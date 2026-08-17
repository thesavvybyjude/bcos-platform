"""
BCOS Platform — Core Package

Re-exports the single source of truth for the DB engine, session factory,
and declarative Base from `core.database`. This package used to define its
own separate engine/Base here, which caused two problems:
  1. Two competing `Base` classes existed (ARCH-001) — models attach to
     `database.Base`, so anything relying on this module's `Base` silently
     had zero tables registered on it.
  2. This file constructed its engine eagerly at import time with
     `pool_size`/`max_overflow` kwargs that are invalid for SQLite's
     QueuePool-less engine — and because importing `core.database` always
     executes `core/__init__.py` first, this crashed the app on startup
     for any SQLite-backed environment (e.g. local dev), regardless of
     whether this module's engine was ever actually used.
"""

from .database import (
    Base,
    engine,
    async_session,
    async_session_maker,
    get_session,
    get_db,
    init_database,
)

__all__ = [
    "Base",
    "engine",
    "async_session",
    "async_session_maker",
    "get_session",
    "get_db",
    "init_database",
]
