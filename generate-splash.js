const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SOURCE = "splash.png";
const ANDROID_RES = "android/app/src/main/res";

const SIZES = [
  { dir: "drawable", size: { width: 480, height: 800 } },
  { dir: "drawable-land-hdpi", size: { width: 800, height: 480 } },
  { dir: "drawable-land-mdpi", size: { width: 480, height: 320 } },
  { dir: "drawable-land-xhdpi", size: { width: 1280, height: 720 } },
  { dir: "drawable-land-xxhdpi", size: { width: 1600, height: 960 } },
  { dir: "drawable-land-xxxhdpi", size: { width: 1920, height: 1280 } },
  { dir: "drawable-port-hdpi", size: { width: 480, height: 800 } },
  { dir: "drawable-port-mdpi", size: { width: 320, height: 480 } },
  { dir: "drawable-port-xhdpi", size: { width: 720, height: 1280 } },
  { dir: "drawable-port-xxhdpi", size: { width: 960, height: 1600 } },
  { dir: "drawable-port-xxxhdpi", size: { width: 1280, height: 1920 } },
];

async function generateSplash() {
  if (!fs.existsSync(SOURCE)) {
    console.error(`❌ Файл ${SOURCE} не найден в корне проекта!`);
    process.exit(1);
  }

  console.log(`📸 Читаем исходник: ${SOURCE}`);

  for (const { dir, size } of SIZES) {
    const targetDir = path.join(ANDROID_RES, dir);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const splashPath = path.join(targetDir, "splash.png");

    await sharp(SOURCE)
      .resize(size.width, size.height, {
        fit: "contain",
        background: { r: 23, g: 33, b: 43, alpha: 1 },
      })
      .png()
      .toFile(splashPath);

    console.log(`✅ ${dir}/splash.png — ${size.width}×${size.height}`);
  }

  console.log("\n🎉 Готово! Все сплэши сгенерированы.");
}

generateSplash().catch((err) => {
  console.error("❌ Ошибка:", err);
  process.exit(1);
});
