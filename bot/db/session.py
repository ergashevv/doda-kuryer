from __future__ import annotations

import os
import socket
from urllib.parse import urlparse

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from bot.db.models import Base

_engine = None
_async_session_factory = None


def _normalize_database_url(url: str) -> str:
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+asyncpg://", 1)
    if url.startswith("postgresql://") and "+asyncpg" not in url:
        return url.replace("postgresql://", "postgresql+asyncpg://", 1)
    return url


def _require_database_host(url: str) -> None:
    """Fail fast with a clear message if DATABASE_URL has no resolvable host."""
    try:
        parsed = urlparse(url)
    except ValueError as e:
        raise RuntimeError("DATABASE_URL is not a valid URL") from e
    host = (parsed.hostname or "").strip()
    if not host:
        raise RuntimeError(
            "DATABASE_URL must include a host (e.g. postgresql://user:pass@hostname:5432/dbname). "
            "On Railway, copy the URL from the Postgres service (Variables or Connect), "
            "or reference it from the bot service as ${{ Postgres.DATABASE_URL }}."
        )


def get_engine():
    global _engine
    if _engine is None:
        url = os.environ.get("DATABASE_URL", "").strip()
        if not url:
            raise RuntimeError("DATABASE_URL is required")
        normalized = _normalize_database_url(url)
        _require_database_host(normalized)
        _engine = create_async_engine(normalized, echo=False)
    return _engine


def get_session_factory():
    global _async_session_factory
    if _async_session_factory is None:
        _async_session_factory = async_sessionmaker(
            get_engine(), class_=AsyncSession, expire_on_commit=False
        )
    return _async_session_factory


def _find_gaierror(exc: BaseException | None) -> socket.gaierror | None:
    """SQLAlchemy/asyncpg often wrap socket.gaierror; unwrap the chain."""
    seen: set[int] = set()
    while exc is not None and id(exc) not in seen:
        seen.add(id(exc))
        if isinstance(exc, socket.gaierror):
            return exc
        exc = exc.__cause__ or exc.__context__  # type: ignore[assignment]
    return None


async def init_db():
    eng = get_engine()
    try:
        async with eng.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        gai = _find_gaierror(e)
        if gai is not None:
            raise RuntimeError(
                "Cannot resolve the database host from DATABASE_URL (DNS error). "
                "On Railway: add the Postgres plugin, then in your bot service set DATABASE_URL "
                "to the Postgres connection string (Connect tab), or use a reference variable "
                "so the hostname is the real Railway Postgres host — not 'postgres', 'localhost', "
                "or a placeholder from docker-compose."
            ) from gai
        raise
