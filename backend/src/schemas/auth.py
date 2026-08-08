"""
BCOS Platform — Pydantic Schemas for Authentication & User Management
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field

from ..models.user import UserRole


# ── Auth Request / Response ──

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)
    full_name: Optional[str] = ""


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
