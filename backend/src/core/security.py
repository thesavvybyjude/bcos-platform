"""
BCOS Platform — Security & Cryptography Utilities

Handles password hashing, JWT generation/validation, and API Key generation/hashing.
"""

import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Tuple

import jwt
from passlib.context import CryptContext

from ..config import settings

# CryptContext for password hashing using bcrypt
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain password against a hashed password.

    Never falls back to a fast hash (e.g. SHA-256) — if bcrypt verification
    fails for a reason other than a genuine mismatch, that error should
    propagate rather than silently downgrading password security.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Generate bcrypt password hash. Raises if bcrypt is unavailable —
    never falls back to a fast, crackable hash."""
    return pwd_context.hash(password)


def create_access_token(
    subject: str,
    role: str,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create JWT access token."""
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "role": role,
        "type": "access",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def create_refresh_token(
    subject: str,
    expires_delta: Optional[timedelta] = None,
) -> Tuple[str, str]:
    """
    Create JWT refresh token.
    Returns tuple: (raw_refresh_token, hashed_token_for_db_storage)
    """
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "type": "refresh",
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }

    raw_token = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    token_hash = hashlib.sha256(raw_token.encode("utf-8")).hexdigest()
    return raw_token, token_hash


def decode_token(token: str) -> Dict[str, Any]:
    """Decode and validate JWT token."""
    return jwt.decode(
        token,
        settings.SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )


def generate_api_key() -> Tuple[str, str, str]:
    """
    Generate a new API key.
    Returns: (raw_key, key_prefix, key_hash)
    Format: bcos_live_<16 hex chars prefix>_<32 hex chars secret>
    """
    prefix = secrets.token_hex(8)  # 16 chars
    secret = secrets.token_hex(16)  # 32 chars
    raw_key = f"bcos_live_{prefix}_{secret}"
    key_prefix = f"bcos_live_{prefix}"
    key_hash = hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
    return raw_key, key_prefix, key_hash


def hash_api_key(raw_key: str) -> str:
    """Compute SHA256 hash of raw API key for DB lookup."""
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()
