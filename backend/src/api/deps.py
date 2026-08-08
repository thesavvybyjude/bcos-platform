"""
BCOS Platform — API Dependencies & Authentication Middleware

Provides FastAPI dependencies for current user resolution, role authorization, and API Key validation.
"""

from typing import List, Optional
import jwt
from fastapi import Depends, Header, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.database import get_db
from ..core.security import decode_token, hash_api_key
from ..models.user import APIKey, User, UserRole

oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/auth/login",
    auto_error=False,
)


async def get_current_user_optional(
    token: Optional[str] = Depends(oauth2_scheme),
    x_api_key: Optional[str] = Header(None, alias="X-API-Key"),
    db: AsyncSession = Depends(get_db),
) -> Optional[User]:
    """
    Attempts to resolve user from Bearer Token or X-API-Key.
    Returns None if unauthenticated.
    """
    # 1. Check Bearer Token
    if token:
        try:
            payload = decode_token(token)
            if payload.get("type") != "access":
                return None
            user_id = payload.get("sub")
            if user_id:
                result = await db.execute(select(User).where(User.id == user_id))
                user = result.scalar_one_or_none()
                if user and user.is_active:
                    return user
        except (jwt.PyJWTError, Exception):
            pass

    # 2. Check X-API-Key Header
    if x_api_key:
        key_hash = hash_api_key(x_api_key)
        result = await db.execute(
            select(APIKey).where(
                APIKey.key_hash == key_hash,
                APIKey.is_active == True,
            )
        )
        api_key = result.scalar_one_or_none()
        if api_key:
            user_res = await db.execute(select(User).where(User.id == api_key.user_id))
            user = user_res.scalar_one_or_none()
            if user and user.is_active:
                return user

    return None


async def get_current_user(
    user: Optional[User] = Depends(get_current_user_optional),
) -> User:
    """Requires authenticated user (throws 401 if unauthenticated)."""
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return user


def require_role(allowed_roles: List[UserRole]):
    """
    Dependency generator for Role-Based Access Control (RBAC).
    Usage: Depends(require_role([UserRole.ADMIN, UserRole.EDITOR]))
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.is_superuser or current_user.role in allowed_roles:
            return current_user
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Operation not permitted. Required role: {[r.value for r in allowed_roles]}",
        )

    return role_checker
