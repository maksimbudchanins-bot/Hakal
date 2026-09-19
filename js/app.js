// ============================================
// НАСТРОЙКИ ОТЛАДКИ
// ============================================
const DEBUG = true; // ← поставь false перед релизом

function log(message) {
  if (DEBUG) console.log("🔍 [Shakal]", message);
}

log("========== Приложение запущено ==========");

// ============================================
// ЗАГЛУШКА ДЛЯ TELEGRAM
// ============================================
const tg = window.Telegram?.WebApp || {
  expand: () => {},
  close: () => {},
  showAlert: null,
  isVersionAtLeast: () => false,
  platform: "unknown",
  initData: "",
};

if (window.Telegram?.WebApp) {
  tg.expand();
  log("✅ Telegram WebApp version: " + tg.version);
} else {
  log("📱 Запущено вне Telegram (APK или браузер)");
}

const isRealTelegram = !!(tg && tg.initData);

function safeAlert(message) {
  if (isRealTelegram && tg.showAlert) {
    try {
      tg.showAlert(message);
      return;
    } catch (e) {}
  }
  alert(message);
}

// ============================================
// DOM
// ============================================
const canvas = document.getElementById("imageCanvas");
const ctx = canvas.getContext("2d");
const placeholder = document.getElementById("placeholder");
const fileInput = document.getElementById("fileInput");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");
const originalBtn = document.getElementById("originalBtn");

const shakalSlider = document.getElementById("shakal");
const brightnessSlider = document.getElementById("brightness");
const contrastSlider = document.getElementById("contrast");
const saturateSlider = document.getElementById("saturate");
const noiseSlider = document.getElementById("noise");
const glitchSlider = document.getElementById("glitch");
const chromaticSlider = document.getElementById("chromatic");

let originalImage = new Image();
let isImageLoaded = false;
let isShowingOriginal = false;

// ============================================
// ПРЕСЕТЫ
// ============================================
const PRESETS = {
  meme: {
    shakal: 12,
    brightness: 110,
    contrast: 130,
    saturate: 140,
    noise: 15,
    glitch: 10,
    chromatic: 3,
  },
  acid: {
    shakal: 1,
    brightness: 120,
    contrast: 160,
    saturate: 200,
    noise: 0,
    glitch: 0,
    chromatic: 8,
  },
  vintage: {
    shakal: 3,
    brightness: 90,
    contrast: 85,
    saturate: 60,
    noise: 30,
    glitch: 0,
    chromatic: 2,
  },
  glitch: {
    shakal: 20,
    brightness: 100,
    contrast: 150,
    saturate: 180,
    noise: 10,
    glitch: 60,
    chromatic: 15,
  },
};

document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = PRESETS[btn.dataset.preset];
    if (!preset) return;

    log("Применяю пресет: " + btn.dataset.preset);

    shakalSlider.value = preset.shakal;
    brightnessSlider.value = preset.brightness;
    contrastSlider.value = preset.contrast;
    saturateSlider.value = preset.saturate;
    noiseSlider.value = preset.noise;
    glitchSlider.value = preset.glitch;
    chromaticSlider.value = preset.chromatic;

    updateLabels();
    applyEffects();
  });
});

// ============================================
// ЗАГРУЗКА КАРТИНКИ
// ============================================
fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  log("Файл выбран: " + file.name);

  const reader = new FileReader();
  reader.onload = (event) => {
    originalImage.src = event.target.result;
  };
  reader.readAsDataURL(file);
});

originalImage.onload = () => {
  isImageLoaded = true;
  canvas.width = originalImage.width;
  canvas.height = originalImage.height;
  canvas.style.display = "block";
  placeholder.classList.add("hidden");
  log("Картинка загружена: " + canvas.width + "×" + canvas.height);
  applyEffects();
};

// ============================================
// ПОЛЗУНКИ
// ============================================
const sliders = [
  shakalSlider,
  brightnessSlider,
  contrastSlider,
  saturateSlider,
  noiseSlider,
  glitchSlider,
  chromaticSlider,
];
sliders.forEach((slider) => {
  slider.addEventListener("input", () => {
    updateLabels();
    applyEffects();
  });
});

function updateLabels() {
  document.getElementById("valShakal").innerText = shakalSlider.value;
  document.getElementById("valBrightness").innerText = brightnessSlider.value;
  document.getElementById("valContrast").innerText = contrastSlider.value;
  document.getElementById("valSaturate").innerText = saturateSlider.value;
  document.getElementById("valNoise").innerText = noiseSlider.value;
  document.getElementById("valGlitch").innerText = glitchSlider.value;
  document.getElementById("valChromatic").innerText = chromaticSlider.value;
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

// Эффект шума
function applyNoise(canvas, amount) {
  if (amount <= 0) return;
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const noiseAmount = amount * 2.55;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * noiseAmount;
    data[i] = Math.max(0, Math.min(255, data[i] + noise));
    data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
    data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
  }

  ctx.putImageData(imageData, 0, 0);
}

// Эффект глитча (VHS-полосы)
function applyGlitch(canvas, amount) {
  if (amount <= 0) return;
  const ctx = canvas.getContext("2d");
  const w = canvas.width;
  const h = canvas.height;
  const numBands = Math.floor(amount / 3) + 3;

  for (let i = 0; i < numBands; i++) {
    const y = Math.floor(Math.random() * h);
    const bandHeight = Math.floor(Math.random() * 20) + 5;
    const shift = Math.floor((Math.random() - 0.5) * amount * 1.5);

    const band = ctx.getImageData(0, y, w, Math.min(bandHeight, h - y));
    ctx.clearRect(0, y, w, bandHeight);
    ctx.putImageData(band, shift, y);
  }
}

// ============================================
// ОСНОВНАЯ МАГИЯ
// ============================================
function applyEffects() {
  if (!isImageLoaded) return;

  const shakalValue = parseInt(shakalSlider.value);
  const brightness = brightnessSlider.value;
  const contrast = contrastSlider.value;
  const saturate = saturateSlider.value;
  const noise = parseInt(noiseSlider.value);
  const glitch = parseInt(glitchSlider.value);
  const chromatic = parseInt(chromaticSlider.value);

  // Шаг 1. Пикселизация
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  const scale = 1 / shakalValue;
  const w = Math.max(1, Math.floor(canvas.width * scale));
  const h = Math.max(1, Math.floor(canvas.height * scale));

  tempCanvas.width = w;
  tempCanvas.height = h;
  tempCtx.drawImage(originalImage, 0, 0, w, h);

  const pixelCanvas = document.createElement("canvas");
  const pixelCtx = pixelCanvas.getContext("2d");
  pixelCanvas.width = canvas.width;
  pixelCanvas.height = canvas.height;
  pixelCtx.imageSmoothingEnabled = false;
  pixelCtx.drawImage(tempCanvas, 0, 0, w, h, 0, 0, canvas.width, canvas.height);

  // Шаг 2. Цветокоррекция
  const colorCanvas = document.createElement("canvas");
  const colorCtx = colorCanvas.getContext("2d");
  colorCanvas.width = canvas.width;
  colorCanvas.height = canvas.height;
  colorCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;
  colorCtx.drawImage(pixelCanvas, 0, 0);
  colorCtx.filter = "none";

  // Шаг 3. Шум
  if (noise > 0) {
    applyNoise(colorCanvas, noise);
  }

  // Шаг 4. Глитч
  if (glitch > 0) {
    applyGlitch(colorCanvas, glitch);
  }

  // Шаг 5. Хроматика + вывод
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (chromatic > 0) {
    ctx.drawImage(colorCanvas, 0, 0);

    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.3;

    ctx.save();
    ctx.translate(-chromatic, 0);
    ctx.drawImage(colorCanvas, 0, 0);
    ctx.restore();

    ctx.save();
    ctx.translate(chromatic, 0);
    ctx.drawImage(colorCanvas, 0, 0);
    ctx.restore();

    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  } else {
    ctx.drawImage(colorCanvas, 0, 0);
  }

  // Показываем оригинал если зажата кнопка
  if (isShowingOriginal) {
    ctx.drawImage(originalImage, 0, 0, canvas.width, canvas.height);
  }
}

// ============================================
// КНОПКИ
// ============================================

resetBtn.addEventListener("click", () => {
  log("Сброс настроек");
  shakalSlider.value = 1;
  brightnessSlider.value = 100;
  contrastSlider.value = 100;
  saturateSlider.value = 100;
  noiseSlider.value = 0;
  glitchSlider.value = 0;
  chromaticSlider.value = 0;
  updateLabels();
  applyEffects();
});

// Кнопка "Оригинал" — зажал, видишь исходник
originalBtn.addEventListener("mousedown", () => {
  if (!isImageLoaded) return;
  isShowingOriginal = true;
  log("Показываю оригинал");
  applyEffects();
});

originalBtn.addEventListener("mouseup", () => {
  if (!isImageLoaded) return;
  isShowingOriginal = false;
  log("Возвращаю эффект");
  applyEffects();
});

originalBtn.addEventListener("mouseleave", () => {
  if (!isImageLoaded) return;
  if (isShowingOriginal) {
    isShowingOriginal = false;
    applyEffects();
  }
});

// Для тач-устройств
originalBtn.addEventListener("touchstart", (e) => {
  e.preventDefault();
  if (!isImageLoaded) return;
  isShowingOriginal = true;
  log("Показываю оригинал (touch)");
  applyEffects();
});

originalBtn.addEventListener("touchend", (e) => {
  e.preventDefault();
  if (!isImageLoaded) return;
  isShowingOriginal = false;
  log("Возвращаю эффект (touch)");
  applyEffects();
});

// Скачивание
downloadBtn.addEventListener("click", async () => {
  if (!isImageLoaded) {
    safeAlert("Сначала загрузите картинку!");
    return;
  }

  log("Начинаю сохранение...");
  const imageDataUrl = canvas.toDataURL("image/png");

  // Telegram
  if (
    isRealTelegram &&
    tg.isVersionAtLeast &&
    tg.isVersionAtLeast("6.9") &&
    tg.downloadFile
  ) {
    try {
      tg.downloadFile({ url: imageDataUrl, file_name: "shakal_art.png" });
      log("Сохранено через Telegram");
      return;
    } catch (err) {
      log("downloadFile не сработал: " + err);
    }
  }

  // Capacitor (APK)
  if (
    window.Capacitor &&
    window.Capacitor.Plugins &&
    window.Capacitor.Plugins.Media
  ) {
    const Media = window.Capacitor.Plugins.Media;
    try {
      try {
        await Media.createAlbum({ name: "Shakal" });
      } catch (e) {
        log("Альбом Shakal уже есть");
      }

      const { albums } = await Media.getAlbums();
      const shakalAlbum = albums.find((a) => a.name === "Shakal");

      if (shakalAlbum) {
        await Media.savePhoto({
          path: imageDataUrl,
          albumIdentifier: shakalAlbum.identifier,
        });
        log("Сохранено в альбом Shakal");
        safeAlert("✅ Картинка сохранена в Галерею!");
      } else {
        log("Альбом Shakal не найден");
        safeAlert("❌ Не удалось найти альбом Shakal");
      }
      return;
    } catch (err) {
      log("Ошибка Media: " + err);
      safeAlert("❌ Ошибка: " + (err.message || err));
      return;
    }
  }

  // Браузер
  log("Fallback: обычное скачивание");
  const link = document.createElement("a");
  link.download = "shakal_art.png";
  link.href = imageDataUrl;
  link.click();
});

log("========== Все обработчики навешаны ==========");
