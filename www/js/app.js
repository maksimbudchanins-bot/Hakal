// ============================================
// НАСТРОЙКИ ОТЛАДКИ
// ============================================
const DEBUG = true;

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
const canvasContainer = document.getElementById("canvasContainer");
const canvasHint = document.getElementById("canvasHint");
const fullscreenPreview = document.getElementById("fullscreenPreview");
const fullscreenCanvas = document.getElementById("fullscreenCanvas");
const fullscreenClose = document.getElementById("fullscreenClose");

const shakalInput = document.getElementById("shakal");
const brightnessInput = document.getElementById("brightness");
const contrastInput = document.getElementById("contrast");
const saturateInput = document.getElementById("saturate");
const noiseInput = document.getElementById("noise");
const glitchInput = document.getElementById("glitch");
const chromaticInput = document.getElementById("chromatic");

const allInputs = [
  shakalInput,
  brightnessInput,
  contrastInput,
  saturateInput,
  noiseInput,
  glitchInput,
  chromaticInput,
];

let originalImage = new Image();
let isImageLoaded = false;

const holdTimers = {};

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
    clearAllHoldTimers();

    setInputValue("shakal", preset.shakal);
    setInputValue("brightness", preset.brightness);
    setInputValue("contrast", preset.contrast);
    setInputValue("saturate", preset.saturate);
    setInputValue("noise", preset.noise);
    setInputValue("glitch", preset.glitch);
    setInputValue("chromatic", preset.chromatic);

    applyEffects();
  });
});

// ============================================
// STEPPERS
// ============================================

function getSuffix(inputId) {
  if (inputId === "shakal") return "";
  if (inputId === "chromatic") return "px";
  return "%";
}

function setInputValue(inputId, value) {
  const input = document.getElementById(inputId);
  if (!input) return;

  const min = parseFloat(input.dataset.min) || 0;
  const max = parseFloat(input.dataset.max) || 100;
  value = Math.max(min, Math.min(max, value));
  input.value = value;

  const labelEl = document.getElementById(
    "val" + inputId.charAt(0).toUpperCase() + inputId.slice(1),
  );
  if (labelEl) {
    labelEl.innerText = value + getSuffix(inputId);
  }

  const stepper = input.parentElement.querySelector(".stepper");
  if (stepper) {
    const btnMinus = stepper.querySelector('[data-dir="-1"]');
    const btnPlus = stepper.querySelector('[data-dir="1"]');
    if (btnMinus) btnMinus.disabled = value <= min;
    if (btnPlus) btnPlus.disabled = value >= max;
  }
}

function clearAllHoldTimers() {
  Object.keys(holdTimers).forEach((key) => {
    if (holdTimers[key].hold) clearTimeout(holdTimers[key].hold);
    if (holdTimers[key].repeat) clearInterval(holdTimers[key].repeat);
    delete holdTimers[key];
  });
}

document.querySelectorAll(".stepper").forEach((stepper) => {
  const targetId = stepper.dataset.target;
  const input = document.getElementById(targetId);
  if (!input) return;

  const btnMinus = stepper.querySelector('[data-dir="-1"]');
  const btnPlus = stepper.querySelector('[data-dir="1"]');
  const timerKey = "timer_" + targetId;

  const changeValue = (dir) => {
    const min = parseFloat(input.dataset.min) || 0;
    const max = parseFloat(input.dataset.max) || 100;
    const step = parseFloat(input.dataset.step) || 1;
    const current = parseFloat(input.value);
    const newValue = current + dir * step;

    if (newValue < min || newValue > max) {
      stopHold(targetId);
      return;
    }

    setInputValue(targetId, newValue);
    applyEffects();
  };

  const startHold = (dir) => {
    stopHold(targetId);
    changeValue(dir);

    const min = parseFloat(input.dataset.min) || 0;
    const max = parseFloat(input.dataset.max) || 100;
    const current = parseFloat(input.value);
    if (current <= min && dir === -1) return;
    if (current >= max && dir === 1) return;

    holdTimers[timerKey] = {
      hold: setTimeout(() => {
        holdTimers[timerKey].repeat = setInterval(() => {
          changeValue(dir);
        }, 80);
      }, 500),
      repeat: null,
    };
  };

  const stopHold = (id) => {
    const key = "timer_" + id;
    if (holdTimers[key]) {
      if (holdTimers[key].hold) clearTimeout(holdTimers[key].hold);
      if (holdTimers[key].repeat) clearInterval(holdTimers[key].repeat);
      delete holdTimers[key];
    }
  };

  btnMinus.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      startHold(-1);
    },
    { passive: false },
  );
  btnMinus.addEventListener("mousedown", () => startHold(-1));

  btnPlus.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      startHold(1);
    },
    { passive: false },
  );
  btnPlus.addEventListener("mousedown", () => startHold(1));

  [btnMinus, btnPlus].forEach((btn) => {
    btn.addEventListener("touchend", (e) => {
      e.preventDefault();
      stopHold(targetId);
    });
    btn.addEventListener("touchcancel", () => stopHold(targetId));
    btn.addEventListener("mouseup", () => stopHold(targetId));
    btn.addEventListener("mouseleave", () => stopHold(targetId));
  });
});

allInputs.forEach((input) => {
  setInputValue(input.id, parseFloat(input.value));
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
  canvasHint.style.display = "block";
  log("Картинка загружена: " + canvas.width + "×" + canvas.height);
  applyEffects();
};

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ЭФФЕКТЫ
// ============================================
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

  const shakalValue = parseInt(shakalInput.value);
  const brightness = brightnessInput.value;
  const contrast = contrastInput.value;
  const saturate = saturateInput.value;
  const noise = parseInt(noiseInput.value);
  const glitch = parseInt(glitchInput.value);
  const chromatic = parseInt(chromaticInput.value);

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

  const colorCanvas = document.createElement("canvas");
  const colorCtx = colorCanvas.getContext("2d");
  colorCanvas.width = canvas.width;
  colorCanvas.height = canvas.height;
  colorCtx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturate}%)`;
  colorCtx.drawImage(pixelCanvas, 0, 0);
  colorCtx.filter = "none";

  if (noise > 0) applyNoise(colorCanvas, noise);
  if (glitch > 0) applyGlitch(colorCanvas, glitch);

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
// МОДАЛКА ПОЛНОЭКРАННОГО ПРОСМОТРА
// ============================================
function openFullscreen() {
  if (!isImageLoaded) return;
  log("Открываю полный экран");

  fullscreenCanvas.width = canvas.width;
  fullscreenCanvas.height = canvas.height;
  const fsCtx = fullscreenCanvas.getContext("2d");
  fsCtx.drawImage(canvas, 0, 0);

  fullscreenPreview.style.display = "flex";
}

function closeFullscreen() {
  log("Закрываю полный экран");
  fullscreenPreview.style.display = "none";
}

canvasContainer.addEventListener("click", openFullscreen);
fullscreenPreview.addEventListener("click", (e) => {
  if (e.target === fullscreenPreview || e.target === fullscreenCanvas) {
    closeFullscreen();
  }
});
fullscreenClose.addEventListener("click", (e) => {
  e.stopPropagation();
  closeFullscreen();
});

// ============================================
// КНОПКИ
// ============================================
resetBtn.addEventListener("click", () => {
  log("Сброс настроек");
  clearAllHoldTimers();

  setInputValue("shakal", 1);
  setInputValue("brightness", 100);
  setInputValue("contrast", 100);
  setInputValue("saturate", 100);
  setInputValue("noise", 0);
  setInputValue("glitch", 0);
  setInputValue("chromatic", 0);
  applyEffects();
});

downloadBtn.addEventListener("click", async () => {
  if (!isImageLoaded) {
    safeAlert("Сначала загрузите картинку!");
    return;
  }

  log("Начинаю сохранение...");
  const imageDataUrl = canvas.toDataURL("image/png");

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
        safeAlert("❌ Не удалось найти альбом Shakal");
      }
      return;
    } catch (err) {
      log("Ошибка Media: " + err);
      safeAlert("❌ Ошибка: " + (err.message || err));
      return;
    }
  }

  const link = document.createElement("a");
  link.download = "shakal_art.png";
  link.href = imageDataUrl;
  link.click();
});

log("========== Все обработчики навешаны ==========");
