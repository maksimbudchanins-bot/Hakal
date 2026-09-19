// ============================================
// НАСТРОЙКИ ОТЛАДКИ
// ============================================
const DEBUG = true;

function log(message) {
  if (DEBUG) console.log("🔍 [Shakal]", message);
}

log("========== Приложение запущено ==========");

// ============================================
// TELEGRAM
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

function vibrate(pattern) {
  if (navigator.vibrate) {
    try {
      navigator.vibrate(pattern);
    } catch (e) {}
  }
}

// ============================================
// КАСТОМНЫЕ УВЕДОМЛЕНИЯ
// ============================================
const alertOverlay = document.getElementById("customAlertOverlay");
const alertIcon = document.getElementById("customAlertIcon");
const alertMessage = document.getElementById("customAlertMessage");
const alertBtn = document.getElementById("customAlertBtn");

const confirmOverlay = document.getElementById("customConfirmOverlay");
const confirmIcon = document.getElementById("customConfirmIcon");
const confirmMessage = document.getElementById("customConfirmMessage");
const confirmOk = document.getElementById("customConfirmOk");
const confirmCancel = document.getElementById("customConfirmCancel");

const toast = document.getElementById("toast");

const ICONS = {
  success: "✅",
  error: "❌",
  warning: "⚠️",
  info: "ℹ️",
  question: "❓",
};

function showAlert(message, type = "info") {
  log("Алерт [" + type + "]: " + message);
  alertIcon.innerText = ICONS[type] || ICONS.info;
  alertMessage.innerText = message;
  alertOverlay.style.display = "flex";
  vibrate(20);
}

alertBtn.addEventListener("click", () => {
  alertOverlay.style.display = "none";
});

function showConfirm(
  message,
  { confirmText = "ОК", cancelText = "Отмена", danger = false } = {},
) {
  return new Promise((resolve) => {
    log("Confirm: " + message);
    confirmIcon.innerText = ICONS.question;
    confirmMessage.innerText = message;
    confirmOk.innerText = confirmText;
    confirmCancel.innerText = cancelText;
    confirmOk.classList.toggle("danger", danger);
    confirmOverlay.style.display = "flex";
    vibrate(20);

    const cleanup = () => {
      confirmOk.removeEventListener("click", onOk);
      confirmCancel.removeEventListener("click", onCancel);
      confirmOverlay.style.display = "none";
    };
    const onOk = () => {
      cleanup();
      resolve(true);
    };
    const onCancel = () => {
      cleanup();
      resolve(false);
    };

    confirmOk.addEventListener("click", onOk);
    confirmCancel.addEventListener("click", onCancel);
  });
}

let toastTimeout = null;
function showToast(message, duration = 2000) {
  log("Toast: " + message);
  if (toastTimeout) clearTimeout(toastTimeout);
  toast.innerText = message;
  toast.style.display = "block";
  toast.style.animation = "none";
  void toast.offsetWidth;
  toast.style.animation = "toastIn 0.3s ease";
  toastTimeout = setTimeout(() => {
    toast.style.display = "none";
  }, duration);
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
const resetEffectsBtn = document.getElementById("resetEffectsBtn");
const canvasContainer = document.getElementById("canvasContainer");
const canvasHint = document.getElementById("canvasHint");
const coachTooltip = document.getElementById("coachTooltip");
const fullscreenPreview = document.getElementById("fullscreenPreview");
const fullscreenCanvas = document.getElementById("fullscreenCanvas");
const fullscreenClose = document.getElementById("fullscreenClose");

const addTextBtn = document.getElementById("addTextBtn");
const editLastTextBtn = document.getElementById("editLastTextBtn");
const deleteAllTextsBtn = document.getElementById("deleteAllTextsBtn");
const addAnotherTextBtn = document.getElementById("addAnotherTextBtn");
const textEditor = document.getElementById("textEditor");
const textEditorTitle = document.getElementById("textEditorTitle");
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
let isTextEditing = false;
let texts = [];
let activeTextIndex = -1;
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

function blurActiveInput() {
  if (
    document.activeElement &&
    typeof document.activeElement.blur === "function"
  ) {
    document.activeElement.blur();
  }
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
    blurActiveInput();
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
// ЗАГРУЗКА
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
  updateCanvasHint();
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
// ОТРИСОВКА ТЕКСТОВ
// ============================================
function drawTextShape(ctx2d, t) {
  ctx2d.save();
  ctx2d.translate(t.x, t.y);
  ctx2d.rotate((t.rotation * Math.PI) / 180);
  ctx2d.font = `${t.fontSize}px "${t.font}", Arial, sans-serif`;
  ctx2d.textAlign = "center";
  ctx2d.textBaseline = "middle";

  if (t.shadowEnabled) {
    ctx2d.shadowColor = "rgba(0,0,0,0.8)";
    ctx2d.shadowBlur = t.shadowBlur;
    ctx2d.shadowOffsetX = t.shadowOffset;
    ctx2d.shadowOffsetY = t.shadowOffset;
  } else {
    ctx2d.shadowColor = "transparent";
    ctx2d.shadowBlur = 0;
    ctx2d.shadowOffsetX = 0;
    ctx2d.shadowOffsetY = 0;
  }

  if (t.strokeEnabled) {
    ctx2d.strokeStyle = t.strokeColor;
    ctx2d.lineWidth = t.strokeWidth;
    ctx2d.lineJoin = "round";
    ctx2d.strokeText(t.value, 0, 0);
  }

  ctx2d.fillStyle = t.color;
  ctx2d.fillText(t.value, 0, 0);

  ctx2d.shadowColor = "transparent";
  ctx2d.shadowBlur = 0;
  ctx2d.shadowOffsetX = 0;
  ctx2d.shadowOffsetY = 0;
  ctx2d.restore();
}

function redrawAllTexts() {
  overlayCanvas.width = canvas.width;
  overlayCanvas.height = canvas.height;
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);

  texts.forEach((t, index) => {
    if (!t.value) return;
    drawTextShape(overlayCtx, t);

    if (index === activeTextIndex && isTextEditing) {
      overlayCtx.save();
      overlayCtx.translate(t.x, t.y);
      overlayCtx.rotate((t.rotation * Math.PI) / 180);

      overlayCtx.font = `${t.fontSize}px "${t.font}", Arial, sans-serif`;
      const metrics = overlayCtx.measureText(t.value);
      const textWidth = metrics.width;
      const textHeight = t.fontSize * 1.2;

      overlayCtx.strokeStyle = "#ff8c42";
      overlayCtx.lineWidth = 2;
      overlayCtx.setLineDash([6, 4]);

      const padding = 8;
      overlayCtx.strokeRect(
        -textWidth / 2 - padding,
        -textHeight / 2 - padding,
        textWidth + padding * 2,
        textHeight + padding * 2,
      );
      overlayCtx.restore();
    }
  });

  if (editLastTextBtn) {
    editLastTextBtn.style.display = texts.length > 0 ? "block" : "none";
  }
  if (deleteAllTextsBtn) {
    deleteAllTextsBtn.style.display = texts.length > 0 ? "block" : "none";
  }

  updateCanvasHint();
}

// ============================================
// ДИНАМИЧЕСКАЯ ПОДСКАЗКА НА CANVAS
// ============================================
function updateCanvasHint() {
  if (!isImageLoaded) return;

  if (texts.length === 0) {
    canvasHint.innerText = "👆 Фото → экран";
  } else {
    canvasHint.innerText = "👆 Текст → редактор · Фото → экран";
  }
}

// ============================================
// ПОИСК ТЕКСТА ПОД ТОЧКОЙ
// ============================================
function findTextAtPoint(x, y) {
  for (let i = texts.length - 1; i >= 0; i--) {
    const t = texts[i];
    if (!t.value) continue;

    const dx = x - t.x;
    const dy = y - t.y;
    const angle = -(t.rotation * Math.PI) / 180;
    const rx = dx * Math.cos(angle) - dy * Math.sin(angle);
    const ry = dx * Math.sin(angle) + dy * Math.cos(angle);

    const textWidth = t.value.length * t.fontSize * 0.55;
    const textHeight = t.fontSize * 1.2;

    if (
      Math.abs(rx) < textWidth / 2 + 15 &&
      Math.abs(ry) < textHeight / 2 + 15
    ) {
      return i;
    }
  }
  return -1;
}

function setActiveText(index) {
  activeTextIndex = index;
  if (index < 0) return;

  const t = texts[index];
  textEditorTitle.innerText = `Текст #${index + 1}`;

  textInput.value = t.value;
  document.getElementById("valFontSize").innerText = t.fontSize;
  document.getElementById("valStrokeWidth").innerText = t.strokeWidth;
  document.getElementById("valShadowOffset").innerText = t.shadowOffset;
  document.getElementById("valShadowBlur").innerText = t.shadowBlur;
  document.getElementById("valRotation").innerText =
    Math.round(t.rotation) + "°";

  strokeToggle.classList.toggle("active", t.strokeEnabled);
  shadowToggle.classList.toggle("active", t.shadowEnabled);
  strokeToggle.innerText = t.strokeEnabled ? "ВКЛ" : "ВЫКЛ";
  shadowToggle.innerText = t.shadowEnabled ? "ВКЛ" : "ВЫКЛ";

  document.querySelectorAll(".font-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.font === t.font);
  });

  redrawAllTexts();
}

// ============================================
// ВЗАИМОДЕЙСТВИЕ С ТЕКСТОМ
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
    if (!isImageLoaded || !isTextEditing) return;
    e.preventDefault();

    if (!hasShownTooltip && coachTooltip.style.display !== "none") {
      coachTooltip.style.display = "none";
      hasShownTooltip = true;
    }

    if (e.touches.length === 1) {
      const pos = getTouchPos(e, overlayCanvas);
      const foundIndex = findTextAtPoint(pos.x, pos.y);

      if (foundIndex >= 0 && foundIndex !== activeTextIndex) {
        log("Переключаюсь на текст #" + (foundIndex + 1));
        setActiveText(foundIndex);
      }

      if (activeTextIndex >= 0) {
        isDraggingText = true;
        dragStartX = pos.x;
        dragStartY = pos.y;
        const t = texts[activeTextIndex];
        textStartX = t.x;
        textStartY = t.y;
      }
    } else if (e.touches.length === 2 && activeTextIndex >= 0) {
      isDraggingText = false;
      initialPinchDistance = getPinchDistance(e);
      const t = texts[activeTextIndex];
      initialFontSize = t.fontSize;
      initialPinchAngle = getPinchAngle(e);
      initialRotation = t.rotation || 0;
    }
  },
  { passive: false },
);

overlayCanvas.addEventListener(
  "touchmove",
  (e) => {
    if (!isTextEditing || activeTextIndex < 0) return;
    e.preventDefault();
    const t = texts[activeTextIndex];

    if (isDraggingText && e.touches.length === 1) {
      const pos = getTouchPos(e, overlayCanvas);
      t.x = textStartX + (pos.x - dragStartX);
      t.y = textStartY + (pos.y - dragStartY);
      redrawAllTexts();
    } else if (e.touches.length === 2 && initialPinchDistance > 0) {
      const newDistance = getPinchDistance(e);
      const scale = newDistance / initialPinchDistance;
      t.fontSize = Math.max(
        10,
        Math.min(300, Math.round(initialFontSize * scale)),
      );
      document.getElementById("valFontSize").innerText = t.fontSize;

      const currentAngle = getPinchAngle(e);
      const angleDiff = currentAngle - initialPinchAngle;
      t.rotation = (initialRotation + angleDiff) % 360;
      document.getElementById("valRotation").innerText =
        Math.round(t.rotation) + "°";

      const roundedAngle = Math.round(t.rotation / 15) * 15;
      if (roundedAngle !== t._lastHapticAngle) {
        t._lastHapticAngle = roundedAngle;
        const abs = Math.abs(roundedAngle % 360);
        if (abs === 0 || abs === 90 || abs === 180 || abs === 270) {
          vibrate([30, 20, 30]);
        } else {
          vibrate(10);
        }
      }
      redrawAllTexts();
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
  if (!isImageLoaded || !isTextEditing) return;
  const pos = getTouchPos(e, overlayCanvas);
  const foundIndex = findTextAtPoint(pos.x, pos.y);
  if (foundIndex >= 0) {
    setActiveText(foundIndex);
    isDraggingText = true;
    dragStartX = pos.x;
    dragStartY = pos.y;
    const t = texts[activeTextIndex];
    textStartX = t.x;
    textStartY = t.y;
  }
});

overlayCanvas.addEventListener("mousemove", (e) => {
  if (!isDraggingText || activeTextIndex < 0) return;
  const t = texts[activeTextIndex];
  const pos = getTouchPos(e, overlayCanvas);
  t.x = textStartX + (pos.x - dragStartX);
  t.y = textStartY + (pos.y - dragStartY);
  redrawAllTexts();
});

overlayCanvas.addEventListener("mouseup", () => {
  isDraggingText = false;
});
overlayCanvas.addEventListener("mouseleave", () => {
  isDraggingText = false;
});

// ============================================
// СОЗДАНИЕ НОВОГО ТЕКСТА
// ============================================
function createNewText() {
  const newText = {
    value: "Ваш текст",
    x: canvas.width / 2 + ((texts.length * 30) % 100) - 50,
    y: canvas.height / 2 + ((texts.length * 40) % 100) - 50,
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
  texts.push(newText);
  return texts.length - 1;
}

addTextBtn.addEventListener("click", () => {
  if (!isImageLoaded) {
    showAlert("Сначала загрузите картинку!", "warning");
    return;
  }
  log("Добавляю текст");
  const index = createNewText();
  setActiveText(index);

  textEditor.style.display = "block";
  isTextEditing = true;
  document.body.classList.add("text-editing");

  if (!hasShownTooltip) {
    coachTooltip.style.display = "block";
    setTimeout(() => {
      if (coachTooltip.style.display !== "none") {
        coachTooltip.style.display = "none";
        hasShownTooltip = true;
      }
    }, 5000);
  }
  redrawAllTexts();
  showToast("💬 Текст добавлен");
});

editLastTextBtn.addEventListener("click", () => {
  if (texts.length === 0) return;
  const lastIndex = texts.length - 1;
  log("Открываю редактор для последнего текста #" + (lastIndex + 1));
  setActiveText(lastIndex);
  textEditor.style.display = "block";
  isTextEditing = true;
  document.body.classList.add("text-editing");
  coachTooltip.style.display = "none";
  redrawAllTexts();
  showToast("✏️ Редактируем текст #" + (lastIndex + 1));
});

deleteAllTextsBtn.addEventListener("click", async () => {
  if (texts.length === 0) return;
  const confirmed = await showConfirm(`Удалить все тексты (${texts.length})?`, {
    confirmText: "Удалить",
    cancelText: "Отмена",
    danger: true,
  });
  if (!confirmed) return;

  log("Удаляю все тексты");
  texts = [];
  activeTextIndex = -1;
  overlayCtx.clearRect(0, 0, overlayCanvas.width, overlayCanvas.height);
  textEditor.style.display = "none";
  isTextEditing = false;
  document.body.classList.remove("text-editing");
  coachTooltip.style.display = "none";

  redrawAllTexts();
  showToast("🗑 Все тексты удалены");
});

addAnotherTextBtn.addEventListener("click", () => {
  if (!isImageLoaded) return;
  log("Добавляю ещё текст");
  const index = createNewText();
  setActiveText(index);
  redrawAllTexts();
  showToast("💬 Ещё один текст");
});

// ============================================
// РЕДАКТОР
// ============================================
textInput.addEventListener("input", () => {
  if (activeTextIndex < 0) return;
  texts[activeTextIndex].value = textInput.value;
  redrawAllTexts();
});

document.querySelectorAll(".font-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (activeTextIndex < 0) return;
    texts[activeTextIndex].font = btn.dataset.font;
    document
      .querySelectorAll(".font-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    redrawAllTexts();
  });
});

const miniHoldTimers = {};

function changeTextProp(btn) {
  if (activeTextIndex < 0) return;
  const t = texts[activeTextIndex];
  const prop = btn.dataset.textProp;
  const dir = parseInt(btn.dataset.dir);
  const step = prop === "fontSize" ? 5 : prop === "rotation" ? 5 : 1;

  if (prop === "fontSize") {
    t.fontSize = Math.max(10, Math.min(300, t.fontSize + dir * step));
    document.getElementById("valFontSize").innerText = t.fontSize;
  } else if (prop === "strokeWidth") {
    t.strokeWidth = Math.max(1, Math.min(20, t.strokeWidth + dir * step));
    document.getElementById("valStrokeWidth").innerText = t.strokeWidth;
  } else if (prop === "shadowOffset") {
    t.shadowOffset = Math.max(0, Math.min(20, t.shadowOffset + dir * step));
    document.getElementById("valShadowOffset").innerText = t.shadowOffset;
  } else if (prop === "shadowBlur") {
    t.shadowBlur = Math.max(0, Math.min(20, t.shadowBlur + dir * step));
    document.getElementById("valShadowBlur").innerText = t.shadowBlur;
  } else if (prop === "rotation") {
    t.rotation = (t.rotation + dir * step) % 360;
    document.getElementById("valRotation").innerText =
      Math.round(t.rotation) + "°";
  }
  redrawAllTexts();
}

document.querySelectorAll(".mini-step-btn").forEach((btn) => {
  const timerKey = "mini_" + btn.dataset.textProp + "_" + btn.dataset.dir;

  const startHold = () => {
    blurActiveInput();
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

resetRotationBtn.addEventListener("click", () => {
  if (activeTextIndex < 0) return;
  texts[activeTextIndex].rotation = 0;
  document.getElementById("valRotation").innerText = "0°";
  vibrate(20);
  redrawAllTexts();
});

document.querySelectorAll(".color-swatch[data-color]").forEach((swatch) => {
  swatch.addEventListener("click", () => {
    if (activeTextIndex < 0) return;
    texts[activeTextIndex].color = swatch.dataset.color;
    document
      .querySelectorAll(".color-swatch[data-color]")
      .forEach((s) => s.classList.remove("active"));
    swatch.classList.add("active");
    redrawAllTexts();
  });
});

document
  .querySelectorAll(".color-swatch[data-stroke-color]")
  .forEach((swatch) => {
    swatch.addEventListener("click", () => {
      if (activeTextIndex < 0) return;
      texts[activeTextIndex].strokeColor = swatch.dataset.strokeColor;
      document
        .querySelectorAll(".color-swatch[data-stroke-color]")
        .forEach((s) => s.classList.remove("active"));
      swatch.classList.add("active");
      redrawAllTexts();
    });
  });

strokeToggle.addEventListener("click", () => {
  if (activeTextIndex < 0) return;
  const t = texts[activeTextIndex];
  t.strokeEnabled = !t.strokeEnabled;
  strokeToggle.classList.toggle("active", t.strokeEnabled);
  strokeToggle.innerText = t.strokeEnabled ? "ВКЛ" : "ВЫКЛ";
  redrawAllTexts();
});

shadowToggle.addEventListener("click", () => {
  if (activeTextIndex < 0) return;
  const t = texts[activeTextIndex];
  t.shadowEnabled = !t.shadowEnabled;
  shadowToggle.classList.toggle("active", t.shadowEnabled);
  shadowToggle.innerText = t.shadowEnabled ? "ВКЛ" : "ВЫКЛ";
  redrawAllTexts();
});

autoContrastBtn.addEventListener("click", () => {
  if (activeTextIndex < 0 || !isImageLoaded) return;
  const t = texts[activeTextIndex];
  const sampleX = Math.floor(t.x);
  const sampleY = Math.floor(t.y);
  if (
    sampleX < 0 ||
    sampleY < 0 ||
    sampleX >= canvas.width ||
    sampleY >= canvas.height
  )
    return;
  const pixel = ctx.getImageData(sampleX, sampleY, 1, 1).data;
  const brightness = (pixel[0] * 299 + pixel[1] * 587 + pixel[2] * 114) / 1000;
  t.color = brightness < 128 ? "#ffffff" : "#000000";
  log("Авто-контраст: " + t.color);
  redrawAllTexts();
  showToast("🎨 Авто-контраст: " + t.color);
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
  blurActiveInput();
  textEditor.style.display = "none";
  isTextEditing = false;
  activeTextIndex = -1;
  document.body.classList.remove("text-editing");
  coachTooltip.style.display = "none";
  redrawAllTexts();
  showToast("✓ Готово");
});

deleteTextBtn.addEventListener("click", async () => {
  if (activeTextIndex < 0) return;
  const confirmed = await showConfirm(
    `Удалить текст #${activeTextIndex + 1}?`,
    { confirmText: "Удалить", cancelText: "Отмена", danger: true },
  );
  if (!confirmed) return;

  log("Удаляю текст #" + (activeTextIndex + 1));
  texts.splice(activeTextIndex, 1);

  if (texts.length === 0) {
    textEditor.style.display = "none";
    isTextEditing = false;
    activeTextIndex = -1;
    document.body.classList.remove("text-editing");
  } else {
    setActiveText(Math.min(activeTextIndex, texts.length - 1));
  }
  redrawAllTexts();
  showToast("🗑 Текст удалён");
});

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
  if (texts.length > 0) {
    fsCtx.drawImage(overlayCanvas, 0, 0);
  }
  fullscreenPreview.style.display = "flex";
}

function closeFullscreen() {
  log("Закрываю полный экран");
  fullscreenPreview.style.display = "none";
}

canvasContainer.addEventListener("click", (e) => {
  if (isTextEditing) return;
  if (!isImageLoaded) return;

  const pos = getTouchPos(e, overlayCanvas);
  const foundIndex = findTextAtPoint(pos.x, pos.y);

  if (foundIndex >= 0) {
    log("Тап по тексту #" + (foundIndex + 1) + " → открываю редактор");
    setActiveText(foundIndex);
    textEditor.style.display = "block";
    isTextEditing = true;
    document.body.classList.add("text-editing");
    coachTooltip.style.display = "none";
    redrawAllTexts();
    showToast("✏️ Редактируем текст #" + (foundIndex + 1));
  } else {
    log("Тап по пустому месту → полный экран");
    openFullscreen();
  }
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
// СБРОС ЭФФЕКТОВ
// ============================================
resetEffectsBtn.addEventListener("click", async () => {
  const confirmed = await showConfirm(
    "Сбросить все эффекты? Тексты останутся.",
    { confirmText: "Сбросить", cancelText: "Отмена" },
  );
  if (!confirmed) return;

  log("Сброс эффектов");
  clearAllHoldTimers();
  setInputValue("shakal", 1);
  setInputValue("brightness", 100);
  setInputValue("contrast", 100);
  setInputValue("saturate", 100);
  setInputValue("noise", 0);
  setInputValue("glitch", 0);
  setInputValue("chromatic", 0);

  applyEffects();
  showToast("🎨 Эффекты сброшены");
});

// ============================================
// СКАЧАТЬ
// ============================================
downloadBtn.addEventListener("click", async () => {
  if (!isImageLoaded) {
    showAlert("Сначала загрузите картинку!", "warning");
    return;
  }

  log("Начинаю сохранение...");
  showToast("⏳ Сохраняю...");

  const finalCanvas = document.createElement("canvas");
  finalCanvas.width = canvas.width;
  finalCanvas.height = canvas.height;
  const finalCtx = finalCanvas.getContext("2d");
  finalCtx.drawImage(canvas, 0, 0);
  if (texts.length > 0) {
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
      showAlert("Картинка сохранена!", "success");
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
        showAlert("Картинка сохранена в Галерею!", "success");
      } else {
        showAlert("Не удалось найти альбом Shakal", "error");
      }
      return;
    } catch (err) {
      log("Ошибка Media: " + err);
      showAlert("Ошибка: " + (err.message || err), "error");
      return;
    }
  }

  const link = document.createElement("a");
  link.download = "shakal_art.png";
  link.href = imageDataUrl;
  link.click();
  showAlert("Картинка сохранена!", "success");
});

log("========== Все обработчики навешаны ==========");
