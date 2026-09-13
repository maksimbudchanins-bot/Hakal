import os
import io
import base64
import json
import logging
import urllib.parse
import asyncio

from flask import Flask, request, jsonify
from telegram import Bot

app = Flask(__name__)

BOT_TOKEN = os.environ.get("TELEGRAM_TOKEN")
if not BOT_TOKEN:
    raise ValueError("TELEGRAM_TOKEN не задан в переменных окружения!")

bot = Bot(token=BOT_TOKEN)

logging.basicConfig(level=logging.INFO)


@app.route("/")
def index():
    return "Hakal Bot Server is running", 200


@app.route("/health")
def health():
    return "OK", 200


@app.route("/send-image", methods=["POST"])
def send_image():
    try:
        data = request.get_json()
        if not data:
            return jsonify({"ok": False, "error": "Нет данных"}), 400

        init_data = data.get("initData", "")
        image_data = data.get("image", "")

        if not image_data:
            return jsonify({"ok": False, "error": "Нет картинки"}), 400

        # Убираем префикс data:image/png;base64,
        if "," in image_data:
            image_data = image_data.split(",", 1)[1]

        img_bytes = base64.b64decode(image_data)
        photo = io.BytesIO(img_bytes)
        photo.name = "shakal_art.png"

        # Парсим user_id из initData
        user_id = None
        if init_data:
            parsed = urllib.parse.parse_qs(init_data)
            user_json = parsed.get("user", [None])[0]
            if user_json:
                user_obj = json.loads(user_json)
                user_id = user_obj.get("id")

        if not user_id:
            return jsonify({"ok": False, "error": "Не удалось определить user_id"}), 400

        async def send():
            await bot.send_photo(
                chat_id=user_id,
                photo=photo,
                caption="🎨 Твой шакал готов! Сохрани в галерею."
            )

        asyncio.run(send())

        return jsonify({"ok": True})

    except Exception as e:
        logging.error(f"Ошибка: {e}")
        return jsonify({"ok": False, "error": str(e)}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)