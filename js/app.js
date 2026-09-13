// Инициализация Telegram Web App
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.expand();
  console.log("Telegram WebApp version:", tg.version);
} else {
  console.log("Запущено вне Telegram");
}

// DOM
const canvas = document.getElementById("imageCanvas");
const ctx = canvas.getContext("2d");
const previewImage = document.getElementById("previewImage");
const fileInput = document.getElementById("fileInput");
const uploadBtn = document.getElementById("uploadBtn");
const resetBtn = document.getElementById("resetBtn");
const hint = document.getElementById("hint");

const shakalSlider = document.getElementById("shakal");
const brightnessSlider = document.getElementById("brightness");
const contrastSlider = document.getElementById("contrast");
const saturateSlider = document.getElementById("saturate");

let originalImage = new Image();
let isImageLoaded = false;

// --- ЛОГИКА ---

uploadBtn.addEventListener("click", () => fileInput.click());

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

  // Показываем картинку-превью и скрываем canvas
  previewImage.style.display = "block";
  hint.style.display = "block";

  applyEffects();
};

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

function updateLabels() {
  document.getElementById("valShakal").innerText = shakalSlider.value;
  document.getElementById("valBrightness").innerText = brightnessSlider.value;
  document.getElementById("valContrast").innerText = contrastSlider.value;
  document.getElementById("valSaturate").innerText = saturateSlider.value;
}

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

  // Переносим результат в <img> (для долгого тапа)
  previewImage.src = canvas.toDataURL("image/png");
}

resetBtn.addEventListener("click", () => {
  shakalSlider.value = 1;
  brightnessSlider.value = 100;
  contrastSlider.value = 100;
  saturateSlider.value = 100;
  updateLabels();
  applyEffects();
});
