from __future__ import annotations

import asyncio
import logging
import os
import sys

from dotenv import load_dotenv
from telegram import Update
from telegram.ext import Application

load_dotenv()

logging.basicConfig(
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
    level=logging.INFO,
)
logger = logging.getLogger(__name__)


def main() -> None:
    token = os.environ.get("BOT_TOKEN", "").strip()
    if not token:
        logger.error("BOT_TOKEN is not set")
        sys.exit(1)

    database_url = os.environ.get("DATABASE_URL", "").strip()
    if not database_url:
        logger.error("DATABASE_URL is not set")
        sys.exit(1)

    from bot.db.session import init_db
    from bot.handlers.registration import register_handlers
    from bot.services.storage import ensure_storage

    async def _setup() -> None:
        await init_db()
        ensure_storage()
        logger.info("Database initialized; storage ready")

    asyncio.run(_setup())

    application = Application.builder().token(token).build()
    register_handlers(application)

    logger.info("Starting polling…")
    application.run_polling(allowed_updates=Update.ALL)


if __name__ == "__main__":
    main()
