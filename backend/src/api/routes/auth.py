"""
BCOS Platform — Authentication API Routes

Endpoints for registration, login, token refresh, and profile retrieval.
"""

from datetime import datetime, timedelta, timezone
import hashlib
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...config import settings
from ...core.database import get_db
from ...core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    get_password_hash,
    verify_password,
)
from ...models.user import RefreshToken, User, UserRole
from ...schemas.auth import (
    LoginRequest,
    RegisterRequest,
    Token,
    TokenRefreshRequest,
    UserRead,
)
from ..deps import get_current_user

router = APIRouter()


@router.post("/register", response_model=UserRead, status_code=status.HTTP_211_CREATED if hasattr(status, 'HTTP_211_CREATED') else 201)
async def register(
    req: RegisterRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Register a new user account.
    First user in the system is automatically made an ADMIN / Superuser.
    """
    # Check if user already exists
    existing = await db.execute(select(User).where(User.email == req.email.lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists",
        )

    # Check user count to determine initial role
    count_res = await db.execute(select(User))
    users_list = count_res.scalars().all()
    is_first = len(users_list) == 0

    user = User(
        email=req.email.lower(),
        hashed_password=get_password_hash(req.password),
        full_name=req.full_name or "",
        role=UserRole.ADMIN if is_first else UserRole.VIEWER,
        is_superuser=is_first,
        is_active=True,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(
    req: LoginRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Authenticate credentials and issue Access & Refresh JWT tokens.
    """
    result = await db.execute(select(User).where(User.email == req.email.lower()))
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user account",
        )

    # Update last login
    user.last_login_at = datetime.now(timezone.utc)

    # Generate tokens
    access_token = create_access_token(subject=str(user.id), role=user.role.value)
    raw_refresh_token, refresh_hash = create_refresh_token(subject=str(user.id))

    refresh_entry = RefreshToken(
        user_id=user.id,
        token_hash=refresh_hash,
        expires_at=datetime.now(timezone.utc) + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        revoked=False,
    )
    db.add(refresh_entry)
    await db.commit()

    return Token(
        access_token=access_token,
        refresh_token=raw_refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.post("/refresh", response_model=Token)
async def refresh_token(
    req: TokenRefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Issue a new access token using a valid, non-revoked refresh token.
    """
    try:
        payload = decode_token(req.refresh_token)
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=400, detail="Invalid token type")
        user_id = payload.get("sub")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")

    token_hash = hashlib.sha256(req.refresh_token.encode("utf-8")).hexdigest()
    result = await db.execute(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.revoked == False,
        )
    )
    stored_token = result.scalar_one_or_none()
    if not stored_token:
        raise HTTPException(status_code=401, detail="Refresh token revoked or not found")

    user_res = await db.execute(select(User).where(User.id == user_id))
    user = user_res.scalar_one_or_none()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User is inactive or deleted")

    new_access_token = create_access_token(subject=str(user.id), role=user.role.value)
    return Token(
        access_token=new_access_token,
        refresh_token=req.refresh_token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
    )


@router.get("/me", response_model=UserRead)
async def get_me(
    current_user: User = Depends(get_current_user),
):
    """
    Get profile information for the currently authenticated user.
    """
    return current_user


@router.put("/me", response_model=UserRead)
async def update_me(
    full_name: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Update profile details for the currently logged-in user.
    """
    if full_name is not None:
        current_user.full_name = full_name
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.post("/change-password", status_code=status.HTTP_200_OK)
async def change_password(
    old_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Change password for currently authenticated user.
    """
    if not verify_password(old_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect current password")
    current_user.hashed_password = get_password_hash(new_password)
    await db.commit()
    return {"status": "password updated successfully"}


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(
    req: TokenRefreshRequest,
    db: AsyncSession = Depends(get_db),
):
    """
    Invalidate refresh token session.
    """
    token_hash = hashlib.sha256(req.refresh_token.encode("utf-8")).hexdigest()
    result = await db.execute(select(RefreshToken).where(RefreshToken.token_hash == token_hash))
    token_entry = result.scalar_one_or_none()
    if token_entry:
        token_entry.revoked = True
        await db.commit()
    return {"status": "logged out successfully"}
