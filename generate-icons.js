const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const SOURCE = "icon.png";
const ANDROID_RES = "android/app/src/main/res";

// Стандартные размеры иконок Android
const SIZES = [
  { dir: "mipmap-mdpi", size: 48 },
  { dir: "mipmap-hdpi", size: 72 },
  { dir: "mipmap-xhdpi", size: 96 },
  { dir: "mipmap-xxhdpi", size: 144 },
  { dir: "mipmap-xxxhdpi", size: 192 },
];

async function generateIcons() {
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

    const iconPath = path.join(targetDir, "ic_launcher.png");
    const roundIconPath = path.join(targetDir, "ic_launcher_round.png");

    // Обычная иконка
    await sharp(SOURCE).resize(size, size).png().toFile(iconPath);
    console.log(`✅ ${dir}/ic_launcher.png — ${size}×${size}`);

    // Круглая иконка
    await sharp(SOURCE).resize(size, size).png().toFile(roundIconPath);
    console.log(`✅ ${dir}/ic_launcher_round.png — ${size}×${size}`);
  }

  console.log("\n🎉 Готово! Все иконки сгенерированы.");
}

generateIcons().catch((err) => {
  console.error("❌ Ошибка:", err);
  process.exit(1);
});
