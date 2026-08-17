"""
BCOS Platform — Rate Limiting

Shared slowapi Limiter instance. Defaults to in-process memory storage,
which is fine for a single-worker deployment but does NOT share state
across multiple workers/replicas. If this ever runs with --workers > 1
or multiple pods, set RATE_LIMIT_STORAGE_URI to a shared backend, e.g.
redis://<host>:6379/0 — this repo already depends on redis (see
config.py), it just isn't wired up for this yet.
"""

from slowapi import Limiter
from slowapi.util import get_remote_address

from ..config import settings

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=getattr(settings, "RATE_LIMIT_STORAGE_URI", None),
)
