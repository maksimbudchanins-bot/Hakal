// Заглушка для Telegram (чтобы код не падал вне Mini App)
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
  console.log("✅ Telegram WebApp version:", tg.version);
} else {
  console.log("📱 Запущено вне Telegram (APK или браузер)");
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

// DOM
const canvas = document.getElementById("imageCanvas");
const ctx = canvas.getContext("2d");
const placeholder = document.getElementById("placeholder");
const fileInput = document.getElementById("fileInput");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");

const shakalSlider = document.getElementById("shakal");
const brightnessSlider = document.getElementById("brightness");
const contrastSlider = document.getElementById("contrast");
const saturateSlider = document.getElementById("saturate");
const chromaticSlider = document.getElementById("chromatic");

let originalImage = new Image();
let isImageLoaded = false;

// ============================================
// ПРЕСЕТЫ
// ============================================

const PRESETS = {
  meme: {
    shakal: 12,
    brightness: 110,
    contrast: 130,
    saturate: 140,
    chromatic: 3,
  },
  acid: {
    shakal: 1,
    brightness: 120,
    contrast: 160,
    saturate: 200,
    chromatic: 8,
  },
  vintage: {
    shakal: 3,
    brightness: 90,
    contrast: 85,
    saturate: 60,
    chromatic: 2,
  },
  glitch: {
    shakal: 20,
    brightness: 100,
    contrast: 150,
    saturate: 180,
    chromatic: 15,
  },
};

document.querySelectorAll(".preset-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const preset = PRESETS[btn.dataset.preset];
    if (!preset) return;

    shakalSlider.value = preset.shakal;
    brightnessSlider.value = preset.brightness;
    contrastSlider.value = preset.contrast;
    saturateSlider.value = preset.saturate;
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
  document.getElementById("valChromatic").innerText = chromaticSlider.value;
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

  // Шаг 3. Хроматика
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
}

// ============================================
// КНОПКИ
// ============================================

resetBtn.addEventListener("click", () => {
  shakalSlider.value = 1;
  brightnessSlider.value = 100;
  contrastSlider.value = 100;
  saturateSlider.value = 100;
  chromaticSlider.value = 0;
  updateLabels();
  applyEffects();
});

downloadBtn.addEventListener("click", () => {
  if (!isImageLoaded) {
    safeAlert("Сначала загрузите картинку!");
    return;
  }

  const imageDataUrl = canvas.toDataURL("image/png");

  // Пытаемся использовать нативный метод Telegram
  if (
    isRealTelegram &&
    tg.isVersionAtLeast &&
    tg.isVersionAtLeast("6.9") &&
    tg.downloadFile
  ) {
    try {
      tg.downloadFile({
        url: imageDataUrl,
        file_name: "shakal_art.png",
      });
      return;
    } catch (err) {
      console.warn("downloadFile не сработал, используем fallback:", err);
    }
  }

  // Fallback: обычное скачивание
  const link = document.createElement("a");
  link.download = "shakal_art.png";
  link.href = imageDataUrl;
  link.click();
});
