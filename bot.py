"""
Sushi Mir Telegram order receiver.
Python 3.10+
Run: python bot.py
The service exposes POST /order on port 8080 and sends validated orders to ADMIN_CHAT_ID.
"""
import asyncio
import html
import logging
import os
import re
from aiohttp import web
from aiogram import Bot
from aiogram.client.default import DefaultBotProperties
from aiogram.enums import ParseMode

BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"
ADMIN_CHAT_ID = "YOUR_CHAT_ID"
# Prefer environment variables in production; the constants above are placeholders.
TOKEN = os.getenv("BOT_TOKEN", BOT_TOKEN)
CHAT_ID = os.getenv("ADMIN_CHAT_ID", ADMIN_CHAT_ID)
PORT = int(os.getenv("PORT", "8080"))
logging.basicConfig(level=logging.INFO)
bot: Bot | None = None

def valid_order(data: dict) -> bool:
    if not isinstance(data, dict):
        return False
    if not isinstance(data.get("name"), str) or not data["name"].strip() or len(data["name"]) > 80:
        return False
    if not re.fullmatch(r"\+380\d{9}", str(data.get("phone", ""))):
        return False
    items = data.get("items")
    if not isinstance(items, list) or not 1 <= len(items) <= 40:
        return False
    for item in items:
        if not isinstance(item, dict):
            return False
        if not isinstance(item.get("name"), str) or len(item["name"]) > 100:
            return False
        if type(item.get("quantity")) is not int or not 1 <= item["quantity"] <= 50:
            return False
        if type(item.get("price")) not in (int, float) or not 0 <= item["price"] <= 1_000_000:
            return False
    return True

def make_message(order: dict) -> str:
    total = sum(i["quantity"] * i["price"] for i in order["items"])
    lines = [
        "📦 <b>НОВЕ ЗАМОВЛЕННЯ</b>",
        f"👤 Клієнт: {html.escape(order['name'])}",
        f"📞 Телефон: {html.escape(order['phone'])}",
        f"💬 Telegram: {html.escape(order.get('telegram') or '—')}",
        f"📍 Спосіб: {html.escape(order.get('fulfillment') or '—')}",
        f"📝 Коментар: {html.escape(str(order.get('comment') or '—')[:500])}",
        "", "🛒 <b>Склад замовлення:</b>",
    ]
    for item in order["items"]:
        lines.append(
            f"• {html.escape(item['name'])} ×{item['quantity']} — "
            f"{item['quantity'] * item['price']:,.0f} грн".replace(",", " ")
        )
    lines += ["", f"💰 <b>Всього: {total:,.0f} грн</b>".replace(",", " ")]
    return "\n".join(lines)

async def order_handler(request: web.Request) -> web.Response:
    try:
        data = await request.json()
    except Exception:
        return web.json_response({"error": "Expected JSON"}, status=400)
    if not valid_order(data):
        return web.json_response({"error": "Invalid order data"}, status=400)
    try:
        await bot.send_message(CHAT_ID, make_message(data))
    except Exception:
        logging.exception("Telegram send failed")
        return web.json_response({"error": "Telegram delivery failed"}, status=502)
    return web.json_response({"ok": True})

async def health_handler(_request: web.Request) -> web.Response:
    return web.json_response({"status": "ok"})

async def on_startup(_app: web.Application):
    global bot
    if not TOKEN or TOKEN == "YOUR_TELEGRAM_BOT_TOKEN" or not CHAT_ID or CHAT_ID == "YOUR_CHAT_ID":
        raise RuntimeError("Set BOT_TOKEN and ADMIN_CHAT_ID environment variables.")
    bot = Bot(TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))

async def on_cleanup(_app: web.Application):
    if bot:
        await bot.session.close()

def main():
    app = web.Application(client_max_size=64 * 1024)
    app.router.add_get("/health", health_handler)
    app.router.add_post("/order", order_handler)
    app.on_startup.append(on_startup)
    app.on_cleanup.append(on_cleanup)
    web.run_app(app, host="0.0.0.0", port=PORT)

if __name__ == "__main__":
    main()
