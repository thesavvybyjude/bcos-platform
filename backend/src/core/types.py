"""
BCOS Platform — Cross-Dialect Column Types

`sqlalchemy.dialects.postgresql.UUID(as_uuid=True)` only behaves correctly
on PostgreSQL. On SQLite (this project's default local/dev database — see
config.py's DATABASE_URL fallback), it silently stores UUIDs inconsistently
(observed: bare 32-char hex on insert) while application code elsewhere
compares against `str(uuid.UUID(...))` (36-char, hyphenated). The two
representations never match, which meant every Bearer-token-authenticated
endpoint (GET/PUT /api/auth/me, /api/auth/change-password, any
`Depends(get_current_user)` route) silently 401'd on SQLite: the JWT
decoded fine, but `select(User).where(User.id == token_sub)` never found
a row.

`GUID` below fixes this: native `UUID` on PostgreSQL, `CHAR(36)` storing
the canonical hyphenated string form everywhere else, with consistent
Python <-> storage conversion in both directions.
"""

import uuid

from sqlalchemy import CHAR
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.types import TypeDecorator


class GUID(TypeDecorator):
    """Platform-independent UUID column.

    Uses PostgreSQL's native UUID type when available, otherwise stores
    as a CHAR(36) using the canonical hyphenated string representation.
    Always returns `uuid.UUID` instances to application code, on any backend.
    """

    impl = CHAR
    cache_ok = True

    def load_dialect_impl(self, dialect):
        if dialect.name == "postgresql":
            return dialect.type_descriptor(PG_UUID(as_uuid=True))
        return dialect.type_descriptor(CHAR(36))

    def process_bind_param(self, value, dialect):
        if value is None:
            return value
        if dialect.name == "postgresql":
            return str(value)
        if not isinstance(value, uuid.UUID):
            value = uuid.UUID(str(value))
        return str(value)

    def process_result_value(self, value, dialect):
        if value is None:
            return value
        if isinstance(value, uuid.UUID):
            return value
        return uuid.UUID(str(value))
