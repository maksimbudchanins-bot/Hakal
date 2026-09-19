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

function vibrate(pattern) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {}
  }
}

// ============================================
// DOM
// ============================================
const canvas = document.getElementById("imageCanvas");
const ctx = canvas.getContext("2d");
const overlayCanvas = document.getElementById("overlayCanvas");
const overlayCtx = overlayCanvas.getContext("2d");
const placeholder = document.getElementById("placeholder");
const fileInput = document.getElementById("fileInput");
const downloadBtn = document.getElementById("downloadBtn");
const resetBtn = document.getElementById("resetBtn");
const canvasContainer = document.getElementById("canvasContainer");
const canvasHint = document.getElementById("canvasHint");
const coachTooltip = document.getElementById("coachTooltip");
const fullscreenPreview = document.getElementById("fullscreenPreview");
const fullscreenCanvas = document.getElementById("fullscreenCanvas");
const fullscreenClose = document.getElementById("fullscreenClose");

const addTextBtn = document.getElementById("addTextBtn");
const textEditor = document.getElementById("textEditor");
const textInput = document.getElementById("textInput");
const deleteTextBtn = document.getElementById("deleteTextBtn");
const doneTextBtn = document.getElementById("doneTextBtn");
const autoContrastBtn = document.getElementById("autoContrastBtn");
const strokeToggle = document.getElementById("strokeToggle");
const shadowToggle = document.getElementById("shadowToggle");
const resetRotationBtn = document.getElementById("resetRotationBtn");

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
let currentText = null;
let isTextEditing = false;
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
  if (labelEl) labelEl.innerText = value + getSuffix(inputId);
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
        holdTimers[timerKey].repeat = setInterval(() => changeValue(dir), 80);
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

allInputs.forEach((input) => setInputValue(input.id, parseFloat(input.value)));

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
  overlayCanvas.width = originalImage.width;
  overlayCanvas.height = originalImage.height;
  log("Картинка загружена: " + canvas.width + "×" + canvas.height);
  applyEffects();
};

// ============================================
// ЭФФЕКТЫ
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
// ТЕКСТ С ПОВОРОТОМ
// ============================================
function drawText() {
  if (!isImageLoaded) return;
  overlayCanvas.width = canvas.width;
  overlayCanvas.height = canvas.height;
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  if (!currentText || !currentText.value) return;

  const t = currentText;
  overlayCtx.save();

  // Поворот вокруг центра текста
  overlayCtx.translate(t.x, t.y);
  overlayCtx.rotate((t.rotation * Math.PI) / 180);

  overlayCtx.font = `${t.fontSize}px "${t.font}", Arial, sans-serif`;
  overlayCtx.textAlign = "center";
  overlayCtx.textBaseline = "middle";

  if (t.shadowEnabled) {
    overlayCtx.shadowColor = "rgba(0,0,0,0.8)";
    overlayCtx.shadowBlur = t.shadowBlur;
    overlayCtx.shadowOffsetX = t.shadowOffset;
    overlayCtx.shadowOffsetY = t.shadowOffset;
  } else {
    overlayCtx.shadowColor = "transparent";
    overlayCtx.shadowBlur = 0;
    overlayCtx.shadowOffsetX = 0;
    overlayCtx.shadowOffsetY = 0;
  }

  if (t.strokeEnabled) {
    overlayCtx.strokeStyle = t.strokeColor;
    overlayCtx.lineWidth = t.strokeWidth;
    overlayCtx.lineJoin = "round";
    overlayCtx.strokeText(t.value, 0, 0);
  }

  overlayCtx.fillStyle = t.color;
  overlayCtx.fillText(t.value, 0, 0);

  overlayCtx.restore();
}

// ============================================
// ВЗАИМОДЕЙСТВИЕ
// ============================================
let isDraggingText = false;
let dragStartX = 0,
  dragStartY = 0,
  textStartX = 0,
  textStartY = 0;
let initialPinchDistance = 0,
  initialFontSize = 48;
let initialPinchAngle = 0,
  initialRotation = 0;
let hasShownTooltip = false;

function getTouchPos(e, canvasEl) {
  const rect = canvasEl.getBoundingClientRect();
  const scaleX = canvasEl.width / rect.width;
  const scaleY = canvasEl.height / rect.height;
  const touch = e.touches ? e.touches[0] : e;
  return {
    x: (touch.clientX - rect.left) * scaleX,
    y: (touch.clientY - rect.top) * scaleY,
  };
}

function getPinchDistance(e) {
  const dx = e.touches[0].clientX - e.touches[1].clientX;
  const dy = e.touches[0].clientY - e.touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function getPinchAngle(e) {
  const dx = e.touches[1].clientX - e.touches[0].clientX;
  const dy = e.touches[1].clientY - e.touches[0].clientY;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

overlayCanvas.addEventListener(
  "touchstart",
  (e) => {
    if (!currentText || !isTextEditing) return;
    e.preventDefault();

    // Скрываем тултип при первом жесте
    if (!hasShownTooltip && coachTooltip.style.display !== "none") {
      coachTooltip.style.display = "none";
      hasShownTooltip = true;
    }

    if (e.touches.length === 1) {
      isDraggingText = true;
      const pos = getTouchPos(e, overlayCanvas);
      dragStartX = pos.x;
      dragStartY = pos.y;
      textStartX = currentText.x;
      textStartY = currentText.y;
    } else if (e.touches.length === 2) {
      isDraggingText = false;
      initialPinchDistance = getPinchDistance(e);
      initialFontSize = currentText.fontSize;
      initialPinchAngle = getPinchAngle(e);
      initialRotation = currentText.rotation || 0;
    }
  },
  { passive: false },
);

overlayCanvas.addEventListener(
  "touchmove",
  (e) => {
    if (!currentText || !isTextEditing) return;
    e.preventDefault();

    if (isDraggingText && e.touches.length === 1) {
      const pos = getTouchPos(e, overlayCanvas);
      currentText.x = textStartX + (pos.x - dragStartX);
      currentText.y = textStartY + (pos.y - dragStartY);
      drawText();
    } else if (e.touches.length === 2 && initialPinchDistance > 0) {
      // Масштаб
      const newDistance = getPinchDistance(e);
      const scale = newDistance / initialPinchDistance;
      currentText.fontSize = Math.max(
        10,
        Math.min(300, Math.round(initialFontSize * scale)),
      );
      const fontSizeEl = document.getElementById("valFontSize");
      if (fontSizeEl) fontSizeEl.innerText = currentText.fontSize;

      // Поворот
      const currentAngle = getPinchAngle(e);
      const angleDiff = currentAngle - initialPinchAngle;
      currentText.rotation = (initialRotation + angleDiff) % 360;
      const rotationEl = document.getElementById("valRotation");
      if (rotationEl)
        rotationEl.innerText = Math.round(currentText.rotation) + "°";

      // Haptic каждые ~15°
      const roundedAngle = Math.round(currentText.rotation / 15) * 15;
      if (roundedAngle !== currentText._lastHapticAngle) {
        currentText._lastHapticAngle = roundedAngle;
        // Особенно сильная вибрация на 0, 90, 180, 270
        const abs = Math.abs(roundedAngle % 360);
        if (abs === 0 || abs === 90 || abs === 180 || abs === 270) {
          vibrate([30, 20, 30]);
        } else {
          vibrate(10);
        }
      }

      drawText();
    }
  },
  { passive: false },
);

overlayCanvas.addEventListener("touchend", () => {
  isDraggingText = false;
  initialPinchDistance = 0;
  initialPinchAngle = 0;
});

overlayCanvas.addEventListener("mousedown", (e) => {
  if (!currentText || !isTextEditing) return;
  isDraggingText = true;
  const pos = getTouchPos(e, overlayCanvas);
  dragStartX = pos.x;
  dragStartY = pos.y;
  textStartX = currentText.x;
  textStartY = currentText.y;
});

overlayCanvas.addEventListener("mousemove", (e) => {
  if (!isDraggingText || !currentText) return;
  const pos = getTouchPos(e, overlayCanvas);
  currentText.x = textStartX + (pos.x - dragStartX);
  currentText.y = textStartY + (pos.y - dragStartY);
  drawText();
});

overlayCanvas.addEventListener("mouseup", () => {
  isDraggingText = false;
});
overlayCanvas.addEventListener("mouseleave", () => {
  isDraggingText = false;
});

// ============================================
// ДОБАВЛЕНИЕ ТЕКСТА
// ============================================
addTextBtn.addEventListener("click", () => {
  if (!isImageLoaded) {
    safeAlert("Сначала загрузите картинку!");
    return;
  }

  log("Добавляю текст");

  currentText = {
    value: "Ваш текст",
    x: canvas.width / 2,
    y: canvas.height / 2,
    fontSize: 60,
    rotation: 0,
    font: "Impact",
    color: "#ffffff",
    strokeEnabled: true,
    strokeColor: "#000000",
    strokeWidth: 4,
    shadowEnabled: true,
    shadowOffset: 4,
    shadowBlur: 4,
    _lastHapticAngle: 0,
  };

  textInput.value = currentText.value;
  document.getElementById("valFontSize").innerText = currentText.fontSize;
  document.getElementById("valStrokeWidth").innerText = currentText.strokeWidth;
  document.getElementById("valShadowOffset").innerText =
    currentText.shadowOffset;
  document.getElementById("valShadowBlur").innerText = currentText.shadowBlur;
  document.getElementById("valRotation").innerText = "0°";

  strokeToggle.classList.toggle("active", currentText.strokeEnabled);
  shadowToggle.classList.toggle("active", currentText.shadowEnabled);
  strokeToggle.innerText = currentText.strokeEnabled ? "ВКЛ" : "ВЫКЛ";
  shadowToggle.innerText = currentText.shadowEnabled ? "ВКЛ" : "ВЫКЛ";

  document.querySelectorAll(".font-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.font === currentText.font);
  });

  textEditor.style.display = "block";
  isTextEditing = true;
  document.body.classList.add("text-editing");

  // Показываем тултип при первом добавлении
  if (!hasShownTooltip) {
    coachTooltip.style.display = "block";
    setTimeout(() => {
      if (coachTooltip.style.display !== "none") {
        coachTooltip.style.display = "none";
        hasShownTooltip = true;
      }
    }, 5000);
  }

  drawText();
});

textInput.addEventListener("input", () => {
  if (!currentText) return;
  currentText.value = textInput.value;
  drawText();
});

document.querySelectorAll(".font-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!currentText) return;
    currentText.font = btn.dataset.font;
    document
      .querySelectorAll(".font-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    drawText();
  });
});

// МИНИ-СТЕППЕРЫ
const miniHoldTimers = {};

function changeTextProp(btn) {
  if (!currentText) return;
  const prop = btn.dataset.textProp;
  const dir = parseInt(btn.dataset.dir);
  const step = prop === "fontSize" ? 5 : prop === "rotation" ? 5 : 1;

  if (prop === "fontSize") {
    currentText.fontSize = Math.max(
      10,
      Math.min(300, currentText.fontSize + dir * step),
    );
    document.getElementById("valFontSize").innerText = currentText.fontSize;
  } else if (prop === "strokeWidth") {
    currentText.strokeWidth = Math.max(
      1,
      Math.min(20, currentText.strokeWidth + dir * step),
    );
    document.getElementById("valStrokeWidth").innerText =
      currentText.strokeWidth;
  } else if (prop === "shadowOffset") {
    currentText.shadowOffset = Math.max(
      0,
      Math.min(20, currentText.shadowOffset + dir * step),
    );
    document.getElementById("valShadowOffset").innerText =
      currentText.shadowOffset;
  } else if (prop === "shadowBlur") {
    currentText.shadowBlur = Math.max(
      0,
      Math.min(20, currentText.shadowBlur + dir * step),
    );
    document.getElementById("valShadowBlur").innerText = currentText.shadowBlur;
  } else if (prop === "rotation") {
    currentText.rotation = (currentText.rotation + dir * step) % 360;
    document.getElementById("valRotation").innerText =
      Math.round(currentText.rotation) + "°";
  }
  drawText();
}

document.querySelectorAll(".mini-step-btn").forEach((btn) => {
  const timerKey = "mini_" + btn.dataset.textProp + "_" + btn.dataset.dir;

  const startHold = () => {
    stopMiniHold(timerKey);
    changeTextProp(btn);
    miniHoldTimers[timerKey] = {
      hold: setTimeout(() => {
        miniHoldTimers[timerKey].repeat = setInterval(() => {
          changeTextProp(btn);
        }, 80);
      }, 400),
      repeat: null,
    };
  };

  const stopMiniHold = (key) => {
    if (miniHoldTimers[key]) {
      if (miniHoldTimers[key].hold) clearTimeout(miniHoldTimers[key].hold);
      if (miniHoldTimers[key].repeat) clearInterval(miniHoldTimers[key].repeat);
      delete miniHoldTimers[key];
    }
  };

  btn.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      startHold();
    },
    { passive: false },
  );
  btn.addEventListener("touchend", (e) => {
    e.preventDefault();
    stopMiniHold(timerKey);
  });
  btn.addEventListener("touchcancel", () => stopMiniHold(timerKey));
  btn.addEventListener("mousedown", (e) => {
    e.preventDefault();
    startHold();
  });
  btn.addEventListener("mouseup", () => stopMiniHold(timerKey));
  btn.addEventListener("mouseleave", () => stopMiniHold(timerKey));
});

// Кнопка сброса поворота
resetRotationBtn.addEventListener("click", () => {
  if (!currentText) return;
  currentText.rotation = 0;
  document.getElementById("valRotation").innerText = "0°";
  vibrate(20);
  drawText();
});

document.querySelectorAll(".color-swatch[data-color]").forEach((swatch) => {
  swatch.addEventListener("click", () => {
    if (!currentText) return;
    currentText.color = swatch.dataset.color;
    document
      .querySelectorAll(".color-swatch[data-color]")
      .forEach((s) => s.classList.remove("active"));
    swatch.classList.add("active");
    drawText();
  });
});

document
  .querySelectorAll(".color-swatch[data-stroke-color]")
  .forEach((swatch) => {
    swatch.addEventListener("click", () => {
      if (!currentText) return;
      currentText.strokeColor = swatch.dataset.strokeColor;
      document
        .querySelectorAll(".color-swatch[data-stroke-color]")
        .forEach((s) => s.classList.remove("active"));
      swatch.classList.add("active");
      drawText();
    });
  });

strokeToggle.addEventListener("click", () => {
  if (!currentText) return;
  currentText.strokeEnabled = !currentText.strokeEnabled;
  strokeToggle.classList.toggle("active", currentText.strokeEnabled);
  strokeToggle.innerText = currentText.strokeEnabled ? "ВКЛ" : "ВЫКЛ";
  drawText();
});

shadowToggle.addEventListener("click", () => {
  if (!currentText) return;
  currentText.shadowEnabled = !currentText.shadowEnabled;
  shadowToggle.classList.toggle("active", currentText.shadowEnabled);
  shadowToggle.innerText = currentText.shadowEnabled ? "ВКЛ" : "ВЫКЛ";
  drawText();
});

autoContrastBtn.addEventListener("click", () => {
  if (!currentText || !isImageLoaded) return;
  const sampleX = Math.floor(currentText.x);
  const sampleY = Math.floor(currentText.y);
  if (
    sampleX < 0 ||
    sampleY < 0 ||
    sampleX >= canvas.width ||
    sampleY >= canvas.height
  )
    return;
  const pixel = ctx.getImageData(sampleX, sampleY, 1, 1).data;
  const brightness = (pixel[0] * 299 + pixel[1] * 587 + pixel[2] * 114) / 1000;
  currentText.color = brightness < 128 ? "#ffffff" : "#000000";
  log("Авто-контраст: " + currentText.color);
  drawText();
});

document.querySelectorAll(".text-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    document
      .querySelectorAll(".text-tab")
      .forEach((t) => t.classList.remove("active"));
    document
      .querySelectorAll(".text-tab-content")
      .forEach((c) => c.classList.remove("active"));
    tab.classList.add("active");
    document
      .querySelector(`.text-tab-content[data-content="${tab.dataset.tab}"]`)
      .classList.add("active");
  });
});

doneTextBtn.addEventListener("click", () => {
  log("Закрываю редактор текста");
  textEditor.style.display = "none";
  isTextEditing = false;
  document.body.classList.remove("text-editing");
  coachTooltip.style.display = "none";
});

deleteTextBtn.addEventListener("click", () => {
  log("Удаляю текст");
  currentText = null;
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  textEditor.style.display = "none";
  isTextEditing = false;
  document.body.classList.remove("text-editing");
  coachTooltip.style.display = "none";
});

// ============================================
// МОДАЛКА
// ============================================
function openFullscreen() {
  if (!isImageLoaded) return;
  log("Открываю полный экран");
  fullscreenCanvas.width = canvas.width;
  fullscreenCanvas.height = canvas.height;
  const fsCtx = fullscreenCanvas.getContext("2d");
  fsCtx.drawImage(canvas, 0, 0);
  if (currentText) {
    fsCtx.drawImage(overlayCanvas, 0, 0);
  }
  fullscreenPreview.style.display = "flex";
}

function closeFullscreen() {
  log("Закрываю полный экран");
  fullscreenPreview.style.display = "none";
}

canvasContainer.addEventListener("click", () => {
  if (isTextEditing) return;
  openFullscreen();
});

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

  currentText = null;
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  textEditor.style.display = "none";
  isTextEditing = false;
  document.body.classList.remove("text-editing");
  coachTooltip.style.display = "none";

  applyEffects();
});

downloadBtn.addEventListener("click", async () => {
  if (!isImageLoaded) {
    safeAlert("Сначала загрузите картинку!");
    return;
  }

  log("Начинаю сохранение...");

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = canvas.width;
  finalCanvas.height = canvas.height;
  const finalCtx = finalCanvas.getContext("2d");
  finalCtx.drawImage(canvas, 0, 0);
  if (currentText) {
    finalCtx.drawImage(overlayCanvas, 0, 0);
  }

  const imageDataUrl = finalCanvas.toDataURL("image/png");

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
