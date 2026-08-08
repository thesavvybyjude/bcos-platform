"""
BCOS Platform — Auth Service

High-level authentication service encapsulating password hashing, JWT generation,
user authentication, and token rotation.
"""

from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..config import settings
from ..core.security import (
    create_access_token as sec_create_access_token,
    create_refresh_token as sec_create_refresh_token,
    decode_token as sec_decode_token,
    get_password_hash as sec_get_password_hash,
    verify_password as sec_verify_password,
)
from ..models.user import User, RefreshToken


class AuthService:
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        return sec_verify_password(plain_password, hashed_password)

    @staticmethod
    def get_password_hash(password: str) -> str:
        return sec_get_password_hash(password)

    @staticmethod
    def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
        subject = data.get("sub", "")
        role = data.get("role", "viewer")
        return sec_create_access_token(subject=subject, role=role, expires_delta=expires_delta)

    @staticmethod
    def create_refresh_token(subject: str, expires_delta: Optional[timedelta] = None):
        return sec_create_refresh_token(subject=subject, expires_delta=expires_delta)

    @staticmethod
    async def authenticate_user(db: AsyncSession, email_or_username: str, password: str) -> Optional[User]:
        stmt = select(User).where(
            (User.email == email_or_username.lower()) | (User.username == email_or_username.lower())
        )
        res = await db.execute(stmt)
        user = res.scalar_one_or_none()

        if not user or not AuthService.verify_password(password, user.hashed_password):
            return None
        return user

    @staticmethod
    async def refresh_access_token(db: AsyncSession, refresh_token: str) -> Optional[str]:
        try:
            payload = sec_decode_token(refresh_token)
            if payload.get("type") != "refresh":
                return None
            user_id = payload.get("sub")
            res = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
            user = res.scalar_one_or_none()
            if not user:
                return None
            return AuthService.create_access_token(data={"sub": str(user.id), "role": user.role.value})
        except Exception:
            return None
