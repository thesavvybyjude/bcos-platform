"""
BCOS Platform — Database Engine

Async SQLAlchemy engine with PostgreSQL (asyncpg) or SQLite (aiosqlite) fallback.
Provides session factory and Base for all models.
"""

import sys
from pathlib import Path
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from ..config import settings

# Engine configuration
db_url = settings.DATABASE_URL
if "postgresql" in db_url and "localhost" in db_url:
    # Try connecting to postgres, fallback to sqlite if postgres credentials fail
    pass

try:
    engine = create_async_engine(
        db_url,
        echo=settings.DEBUG,
        pool_pre_ping=True,
    )
except Exception:
    # Fallback to local SQLite database
    sqlite_path = Path("./data/bcos.db").resolve()
    sqlite_path.parent.mkdir(parents=True, exist_ok=True)
    fallback_url = f"sqlite+aiosqlite:///{sqlite_path}"
    engine = create_async_engine(fallback_url, echo=settings.DEBUG)

# Session factory
async_session = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all SQLAlchemy models."""
    pass


async def init_database():
    """Create all tables."""
    global engine, async_session
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
    except Exception as e:
        # Fallback to SQLite if PostgreSQL connection fails
        print(f"Notice: Primary DB connection failed ({e}). Falling back to local SQLite database (./data/bcos.db)...")
        sqlite_path = Path("./data/bcos.db").resolve()
        sqlite_path.parent.mkdir(parents=True, exist_ok=True)
        fallback_url = f"sqlite+aiosqlite:///{sqlite_path}"
        
        engine = create_async_engine(fallback_url, echo=settings.DEBUG)
        async_session = async_sessionmaker(
            engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)


async def get_session() -> AsyncSession:
    """Dependency injection for FastAPI routes."""
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
