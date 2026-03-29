from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from bot.db.models import ChatMessage


async def log_chat(
    session: AsyncSession,
    telegram_user_id: int,
    role: str,
    text: str | None = None,
    extra: dict[str, Any] | None = None,
) -> None:
    row = ChatMessage(
        telegram_user_id=telegram_user_id,
        role=role,
        text=text,
        extra=extra,
    )
    session.add(row)


async def recent_messages(
    session: AsyncSession, telegram_user_id: int, limit: int = 50
) -> list[ChatMessage]:
    q = (
        select(ChatMessage)
        .where(ChatMessage.telegram_user_id == telegram_user_id)
        .order_by(ChatMessage.id.desc())
        .limit(limit)
    )
    res = await session.execute(q)
    rows = list(res.scalars().all())
    rows.reverse()
    return rows
