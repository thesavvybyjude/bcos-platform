"""
BCOS Platform — Audit Service

Provides helper functions for recording user and system actions in the audit trail database.
"""

from typing import List, Optional
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.audit import AuditAction, AuditLog


async def log_action(
    db: AsyncSession,
    action: AuditAction,
    user_id: Optional[UUID] = None,
    user_email: str = "system",
    target_slug: Optional[str] = None,
    details: str = "",
    ip_address: str = "",
) -> AuditLog:
    """Record an audit log entry in PostgreSQL/SQLite."""
    entry = AuditLog(
        user_id=user_id,
        user_email=user_email,
        action=action,
        target_slug=target_slug,
        details=details,
        ip_address=ip_address,
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


async def get_audit_trail(
    db: AsyncSession,
    limit: int = 50,
    action: Optional[AuditAction] = None,
) -> List[AuditLog]:
    """Retrieve recent audit logs."""
    query = select(AuditLog).order_by(AuditLog.timestamp.desc()).limit(limit)
    if action:
        query = query.where(AuditLog.action == action)
    result = await db.execute(query)
    return result.scalars().all()
