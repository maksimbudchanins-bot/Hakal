// Инициализация Telegram Web App
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.expand(); // Разворачиваем на весь экран
} else {
  console.log("Запущено вне Telegram. Работаем в режиме отладки.");
}

// Получаем элементы DOM
const canvas = document.getElementById("imageCanvas");
const ctx = canvas.getContext("2d");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const downloadBtn = document.getElementById("downloadBtn");

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

  // Создаем временный canvas для шакализации
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");

  const scale = 1 / shakalValue;
  const w = Math.max(1, Math.floor(canvas.width * scale));
  const h = Math.max(1, Math.floor(canvas.height * scale));

  tempCanvas.width = w;
  tempCanvas.height = h;

  // Рисуем уменьшенную картинку
  tempCtx.drawImage(originalImage, 0, 0, w, h);

  // Очищаем основной canvas и применяем цветокоррекцию
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;

  // Отключаем сглаживание для эффекта пикселей
  ctx.imageSmoothingEnabled = false;

  // Растягиваем уменьшенную картинку обратно
  ctx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height);

  // Сбрасываем фильтр
  ctx.filter = "none";
}

// 7. Скачивание результата
downloadBtn.addEventListener("click", () => {
  if (!isImageLoaded) {
    if (tg) tg.showAlert("Сначала загрузите картинку!");
    else alert("Сначала загрузите картинку!");
    return;
  }
  const link = document.createElement("a");
  link.download = "shakal_art.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});
