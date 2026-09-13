<div align="center">

# 🎨 Shakal & Color Bot

**Telegram Mini App для быстрой шакализации и цветокоррекции изображений прямо в чате.**

[![Telegram](https://img.shields.io/badge/Telegram-Mini%20App-26A5E4?style=for-the-badge&logo=telegram&logoColor=white)](https://t.me/)
[![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)](https://developer.mozilla.org/ru/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/ru/docs/Web/HTML)
[![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)](https://developer.mozilla.org/ru/docs/Web/CSS)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

_Загружай. Шакаль. Раскрашивай. Скачивай._

</div>

---

## 📖 О проекте

**Shakal & Color Bot** — это легковесное веб-приложение (Telegram Mini App), которое позволяет за пару секунд превратить любое фото в мемный "шакал" с эффектом пикселизации и гибкой цветокоррекцией.

Всё работает **прямо в браузере** пользователя (на клиенте) с использованием `<canvas>`. Никаких загрузок на сервер, никаких задержек — только чистый JavaScript и мгновенный результат.

### ✨ Возможности

- 📁 **Загрузка изображений** — прямо из галереи телефона или с компьютера.
- 🔲 **Шакализация** — регулировка степени пикселизации (от лёгкого "мыла" до полного треша).
- ☀️ **Яркость** — от затемнения до пересвета.
- 🌗 **Контраст** — сделать картинку сочнее или плоской.
- 🌈 **Насыщенность** — от чёрно-белого до кислотного.
- 💾 **Скачивание результата** — сохранение готового изображения в PNG.
- 🌙 **Тёмная тема** — автоматически подстраивается под тему Telegram.

---

## 🚀 Демо

> 🔗 **Открыть в Telegram:** `https://t.me/ваш_бот_username`
>
> 🌐 **Веб-версия:** `https://ваш_никнейм.github.io/tg-shakal-bot/`

<div align="center">

| Экран загрузки |  Результат   |
| :------------: | :----------: |
|  _Скриншот 1_  | _Скриншот 2_ |

</div>

---

## 🛠️ Технологии

|        Технология        |                   Назначение                    |
| :----------------------: | :---------------------------------------------: |
|        **HTML5**         |              Структура приложения               |
|         **CSS3**         |        Стилизация, тёмная тема, адаптив         |
|  **JavaScript (ES6+)**   |          Логика обработки изображений           |
|      **Canvas API**      |            Отрисовка и пикселизация             |
|     **CSS Filters**      | Цветокоррекция (brightness, contrast, saturate) |
| **Telegram Web App API** |              Интеграция с Telegram              |

---

## 📂 Структура проекта

```text
tg-shakal-bot/
├── index.html          # Главный файл приложения
├── css/
│   └── style.css       # Стили (тёмная тема, адаптив)
├── js/
│   └── app.js          # Логика: загрузка, обработка, экспорт
├── assets/             # Иконки, изображения
└── README.md           # Этот файл
```
