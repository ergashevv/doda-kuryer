from __future__ import annotations

import os
from datetime import datetime
from pathlib import Path

import aiofiles
from telegram import Bot

STORAGE_ROOT = Path(os.environ.get("STORAGE_PATH", "./uploads")).resolve()


def ensure_storage() -> None:
    STORAGE_ROOT.mkdir(parents=True, exist_ok=True)


def _ext_from_mime(mime: str | None) -> str:
    if not mime:
        return "bin"
    if "jpeg" in mime or "jpg" in mime:
        return "jpg"
    if "png" in mime:
        return "png"
    if "pdf" in mime:
        return "pdf"
    return "bin"


async def download_telegram_file(
    bot: Bot,
    file_id: str,
    telegram_user_id: int,
    doc_type: str,
    mime_type: str | None = None,
) -> str:
    ensure_storage()
    tg_file = await bot.get_file(file_id)
    ext = _ext_from_mime(mime_type)
    ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    user_dir = STORAGE_ROOT / str(telegram_user_id)
    user_dir.mkdir(parents=True, exist_ok=True)
    fname = f"{doc_type}_{ts}.{ext}"
    dest = user_dir / fname
    await tg_file.download_to_drive(custom_path=str(dest))
    return str(dest)
