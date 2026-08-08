"""
BCOS Platform — Auth Dependencies

Provides dependency functions matching checklist specifications:
- get_current_user()
- get_current_active_user()
- get_current_admin_user()
- get_current_editor_user()
- get_api_key()
"""

from typing import Optional
from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from .deps import get_current_user as _deps_get_current_user
from ..models.user import User, UserRole, APIKey
from ..core.security import hash_api_key
from sqlalchemy import select


async def get_current_user(user: User = Depends(_deps_get_current_user)) -> User:
    return user


async def get_current_active_user(user: User = Depends(get_current_user)) -> User:
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user account")
    return user


async def get_current_admin_user(user: User = Depends(get_current_active_user)) -> User:
    if not user.is_superuser and user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return user


async def get_current_editor_user(user: User = Depends(get_current_active_user)) -> User:
    if not user.is_superuser and user.role not in [UserRole.ADMIN, UserRole.EDITOR]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Editor or Admin privileges required",
        )
    return user


async def get_api_key(
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: AsyncSession = Depends(get_db),
) -> APIKey:
    if not x_api_key:
        raise HTTPException(status_code=401, detail="API Key header missing")
    key_hash = hash_api_key(x_api_key)
    res = await db.execute(select(APIKey).where(APIKey.key_hash == key_hash, APIKey.is_active == True))
    api_key = res.scalar_one_or_none()
    if not api_key:
        raise HTTPException(status_code=401, detail="Invalid or revoked API key")
    return api_key
