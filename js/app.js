// Инициализация Telegram Web App
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.expand();
  console.log("Telegram WebApp version:", tg.version);
} else {
  console.log("Запущено вне Telegram. Работаем в режиме отладки.");
}

// Получаем элементы DOM
const canvas = document.getElementById("imageCanvas");
const ctx = canvas.getContext("2d");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");

// Элементы управления
const shakalSlider = document.getElementById("shakal");
const brightnessSlider = document.getElementById("brightness");
const contrastSlider = document.getElementById("contrast");
const saturateSlider = document.getElementById("saturate");

let originalImage = new Image();
let isImageLoaded = false;

// --- ЛОГИКА ---

// 1. Клик по кнопке "Загрузить" открывает выбор файла
uploadBtn.addEventListener("click", () => {
  fileInput.click();
});

// 2. Обработка выбранного файла
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    originalImage.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

// 3. Когда картинка загрузилась
originalImage.onload = () => {
  isImageLoaded = true;
  canvas.width = originalImage.width;
  canvas.height = originalImage.height;
  applyEffects();
};

// 4. Слушатели ползунков
const sliders = [
  shakalSlider,
  brightnessSlider,
  contrastSlider,
  saturateSlider,
];
sliders.forEach((slider) => {
  slider.addEventListener("input", () => {
    updateLabels();
    applyEffects();
  });
});

// 5. Обновление цифр возле ползунков
function updateLabels() {
  document.getElementById("valShakal").innerText = shakalSlider.value;
  document.getElementById("valBrightness").innerText = brightnessSlider.value;
  document.getElementById("valContrast").innerText = contrastSlider.value;
  document.getElementById("valSaturate").innerText = saturateSlider.value;
}

// 6. Основная функция магии
function applyEffects() {
  if (!isImageLoaded) return;

  const shakalValue = parseInt(shakalSlider.value);
  const brightness = brightnessSlider.value;
  const contrast = contrastSlider.value;
  const saturate = saturateSlider.value;

  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  const scale = 1 / shakalValue;
  const w = Math.max(1, Math.floor(canvas.width * scale));
  const h = Math.max(1, Math.floor(canvas.height * scale));

  tempCanvas.width = w;
  tempCanvas.height = h;

  tempCtx.drawImage(originalImage, 0, 0, w, h);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height);
  ctx.filter = "none";
}

// 7. Поделиться / сохранить результат (Web Share API + fallback)
downloadBtn.addEventListener("click", async () => {
  if (!isImageLoaded) {
    if (tg) tg.showAlert("Сначала загрузите картинку!");
    else alert("Сначала загрузите картинку!");
    return;
  }

  // Конвертируем canvas в Blob
  canvas.toBlob(async (blob) => {
    if (!blob) {
      if (tg) tg.showAlert("Не удалось создать файл.");
      return;
    }

    const file = new File([blob], "shakal_art.png", { type: "image/png" });

    // Проверяем поддержку Web Share API с файлами
    const canShareFiles =
      navigator.canShare && navigator.canShare({ files: [file] });

    if (navigator.share && canShareFiles) {
      try {
        await navigator.share({
          files: [file],
          title: "Shakal Art",
          text: "🎨 Сделано в Shakal & Color Bot",
        });
      } catch (err) {
        // Пользователь отменил — это не ошибка
        if (err.name !== "AbortError") {
          console.error("Ошибка share:", err);
          if (tg) tg.showAlert("Не удалось поделиться. Попробуйте ещё раз.");
        }
      }
    } else {
      // Fallback: скачивание через ссылку (работает на ПК)
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = "shakal_art.png";
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }, "image/png");
});

// 8. Кнопка сброса настроек
resetBtn.addEventListener("click", () => {
  shakalSlider.value = 1;
  brightnessSlider.value = 100;
  contrastSlider.value = 100;
  saturateSlider.value = 100;

  updateLabels();
  applyEffects();
});
