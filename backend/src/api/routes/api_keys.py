"""
BCOS Platform — API Keys Management Routes

Endpoints for generating, listing, and revoking programmatic API keys.
"""

from datetime import datetime, timedelta, timezone
from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...core.security import generate_api_key
from ...models.user import APIKey, User, UserRole
from ...schemas.auth import APIKeyCreate, APIKeyCreatedResponse, APIKeyRead
from ..deps import get_current_user, require_role

router = APIRouter()


@router.post("", response_model=APIKeyCreatedResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    req: APIKeyCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_role([UserRole.ADMIN, UserRole.EDITOR])),
):
    """
    Generate a new API key for automation / programmatic access.
    The raw API key is returned ONLY ONCE in this response.
    """
    raw_key, key_prefix, key_hash = generate_api_key()

    expires_at = None
    if req.expires_in_days:
        expires_at = datetime.now(timezone.utc) + timedelta(days=req.expires_in_days)

    api_key_obj = APIKey(
        user_id=current_user.id,
        name=req.name,
        key_prefix=key_prefix,
        key_hash=key_hash,
        scopes=req.scopes or "read",
        expires_at=expires_at,
        is_active=True,
    )

    db.add(api_key_obj)
    await db.commit()
    await db.refresh(api_key_obj)

    return APIKeyCreatedResponse(
        id=api_key_obj.id,
        name=api_key_obj.name,
        key_prefix=api_key_obj.key_prefix,
        scopes=api_key_obj.scopes,
        is_active=api_key_obj.is_active,
        created_at=api_key_obj.created_at,
        expires_at=api_key_obj.expires_at,
        last_used_at=api_key_obj.last_used_at,
        raw_api_key=raw_key,
    )


@router.get("", response_model=List[APIKeyRead])
async def list_api_keys(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    List active API keys created by the logged-in user (or all keys for admin).
    """
    if current_user.role == UserRole.ADMIN or current_user.is_superuser:
        query = select(APIKey).order_by(APIKey.created_at.desc())
    else:
        query = select(APIKey).where(APIKey.user_id == current_user.id).order_by(APIKey.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.delete("/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def revoke_api_key(
    key_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Revoke/delete an API key.
    Users can revoke their own keys; Admins can revoke any key.
    """
    result = await db.execute(select(APIKey).where(APIKey.id == key_id))
    api_key_obj = result.scalar_one_or_none()

    if not api_key_obj:
        raise HTTPException(status_code=404, detail="API Key not found")

    if api_key_obj.user_id != current_user.id and current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Not authorized to revoke this API key")

    await db.delete(api_key_obj)
    await db.commit()
    return None
