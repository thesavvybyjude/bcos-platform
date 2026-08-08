"""
BCOS Platform — User Management API Routes

Admin endpoints for listing, updating, and deactivating user accounts.
"""

from typing import List
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...core.security import get_password_hash
from ...models.user import User, UserRole
from ...schemas.auth import UserRead, UserUpdate
from ..deps import require_role

router = APIRouter()


@router.get("", response_model=List[UserRead])
async def list_users(
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMIN])),
):
    """
    List all platform users (Admin only).
    """
    result = await db.execute(select(User).order_by(User.created_at.desc()))
    return result.scalars().all()


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(
    user_id: UUID,
    req: UserUpdate,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMIN])),
):
    """
    Update user role, active status, or details (Admin only).
    """
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.full_name is not None:
        user.full_name = req.full_name
    if req.role is not None:
        user.role = req.role
    if req.is_active is not None:
        user.is_active = req.is_active
    if req.password is not None:
        user.hashed_password = get_password_hash(req.password)

    await db.commit()
    await db.refresh(user)
    return user


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin_user: User = Depends(require_role([UserRole.ADMIN])),
):
    """
    Deactivate or delete user account (Admin only).
    Prevent admin self-deletion.
    """
    if user_id == admin_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own admin account")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    await db.delete(user)
    await db.commit()
    return None
