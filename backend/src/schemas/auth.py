"""
BCOS Platform — Pydantic Schemas for Authentication & User Management
"""

import re
from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, field_validator

from ..models.user import UserRole

# A small blocklist of trivially-guessable passwords. Not exhaustive —
# this is a floor, not a substitute for a real breached-password check
# (e.g. HaveIBeenPwned's k-anonymity API) if that's ever warranted.
_COMMON_PASSWORDS = {
    "password", "password1", "password123", "12345678", "123456789",
    "qwerty123", "letmein1", "admin123", "welcome1", "changeme",
}


def _validate_password_strength(password: str) -> str:
    if len(password) < 8:
        raise ValueError("Password must be at least 8 characters long")
    if not re.search(r"[A-Z]", password):
        raise ValueError("Password must contain at least one uppercase letter")
    if not re.search(r"[a-z]", password):
        raise ValueError("Password must contain at least one lowercase letter")
    if not re.search(r"\d", password):
        raise ValueError("Password must contain at least one digit")
    if password.lower() in _COMMON_PASSWORDS:
        raise ValueError("This password is too common — please choose another")
    return password


# ── Auth Request / Response ──

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = ""

    @field_validator("password")
    @classmethod
    def _check_password_strength(cls, v: str) -> str:
        return _validate_password_strength(v)


class UpdateProfileRequest(BaseModel):
    """Request body for PUT /auth/me — previously a bare query param (BUG-006)."""
    full_name: Optional[str] = Field(None, max_length=255)


class ChangePasswordRequest(BaseModel):
    """Request body for POST /auth/change-password — previously query params
    that leaked into server/proxy logs and browser history (SEC-005/BUG-007)."""
    old_password: str
    new_password: str = Field(..., min_length=8)

    @field_validator("new_password")
    @classmethod
    def _check_password_strength(cls, v: str) -> str:
        return _validate_password_strength(v)


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int  # in seconds


class TokenRefreshRequest(BaseModel):
    refresh_token: str


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    role: Optional[str] = None
    exp: Optional[int] = None
    type: Optional[str] = None


# ── User Schemas ──

class UserRead(BaseModel):
    id: UUID
    email: EmailStr
    full_name: Optional[str] = ""
    role: UserRole
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: datetime
    last_login_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[bool] = None
    password: Optional[str] = Field(None, min_length=8)


# ── API Key Schemas ──

class APIKeyCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    scopes: Optional[str] = "read"
    expires_in_days: Optional[int] = None  # None = never expires


class APIKeyRead(BaseModel):
    id: UUID
    name: str
    key_prefix: str
    scopes: str
    is_active: bool
    created_at: datetime
    expires_at: Optional[datetime] = None
    last_used_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class APIKeyCreatedResponse(APIKeyRead):
    raw_api_key: str  # Only returned ONCE upon creation
