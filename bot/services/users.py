from __future__ import annotations

from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm.attributes import flag_modified

from bot.db.models import UserProfile


async def get_profile(
    session: AsyncSession, telegram_id: int
) -> UserProfile | None:
    r = await session.execute(
        select(UserProfile).where(UserProfile.telegram_id == telegram_id)
    )
    return r.scalar_one_or_none()


async def ensure_profile(session: AsyncSession, telegram_id: int) -> UserProfile:
    p = await get_profile(session, telegram_id)
    if p:
        return p
    p = UserProfile(telegram_id=telegram_id, language="uz", session_state="language")
    session.add(p)
    await session.flush()
    return p


async def update_profile(
    session: AsyncSession,
    telegram_id: int,
    *,
    language: str | None = None,
    service: str | None = None,
    tariff: str | None = None,
    city: str | None = None,
    session_state: str | None = None,
    session_data_patch: dict[str, Any] | None = None,
) -> UserProfile:
    p = await ensure_profile(session, telegram_id)
    if language is not None:
        p.language = language
    if service is not None:
        p.service = service
    if tariff is not None:
        p.tariff = tariff
    if city is not None:
        p.city = city
    if session_state is not None:
        p.session_state = session_state
    if session_data_patch:
        data = dict(p.session_data or {})
        data.update(session_data_patch)
        p.session_data = data
        flag_modified(p, "session_data")
    await session.flush()
    return p


async def reset_registration(session: AsyncSession, telegram_id: int) -> UserProfile:
    p = await ensure_profile(session, telegram_id)
    p.service = None
    p.tariff = None
    p.city = None
    p.session_state = "language"
    p.session_data = {}
    flag_modified(p, "session_data")
    await session.flush()
    return p
