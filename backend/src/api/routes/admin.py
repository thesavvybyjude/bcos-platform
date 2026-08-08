"""
BCOS Platform — Admin API Router

Provides administrative endpoints for platform curation:
- System metrics & health scores
- Knowledge base reloading & validation
- Raw Markdown module content editing
- Module archiving & publishing
- System audit log querying
"""

from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from ...config import settings
from ...core.database import get_db
from ...models import Module, User, UserRole
from ...models.audit import AuditAction, AuditLog
from ...services.audit import get_audit_trail, log_action
from ...services.knowledge_loader import KnowledgeLoader
from ...services.validator import KnowledgeValidator
from ..deps import require_role

router = APIRouter()
validator = KnowledgeValidator()


class ModuleUpdatePayload(BaseModel):
    raw_content: str


@router.get("/stats")
async def get_admin_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN])),
):
    """
    Get high-level system statistics and health metrics (Admin only).
    """
    modules_count = (await db.execute(select(func.count(Module.id)))).scalar() or 0
    users_count = (await db.execute(select(func.count(User.id)))).scalar() or 0
    audit_count = (await db.execute(select(func.count(AuditLog.id)))).scalar() or 0

    val_report = validator.validate_all()

    return {
        "total_modules": val_report.total_modules or modules_count,
        "total_users": users_count,
        "total_audit_events": audit_count,
        "health_score": val_report.health_score,
        "validation_errors": val_report.total_errors,
        "validation_warnings": val_report.total_warnings,
        "system_status": "operational" if val_report.health_score > 80 else "degraded",
    }


@router.post("/modules/reload")
async def reload_modules(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN])),
):
    """
    Reload all knowledge modules from the Markdown filesystem (Admin only).
    """
    loader = KnowledgeLoader(settings.KNOWLEDGE_BASE_PATH)
    modules = loader.load_all()
    await log_action(
        db,
        action=AuditAction.SETTINGS_UPDATED,
        user_id=admin.id,
        user_email=admin.email,
        details=f"Reloaded {len(modules)} modules from filesystem.",
    )
    return {"status": "success", "modules_reloaded": len(modules)}


@router.post("/modules/validate")
async def validate_modules(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN])),
):
    """
    Run structure and cross-reference validation across all modules (Admin only).
    """
    report = validator.validate_all()
    await log_action(
        db,
        action=AuditAction.VALIDATION_RUN,
        user_id=admin.id,
        user_email=admin.email,
        details=f"Validation score: {report.health_score}% ({report.total_errors} errors)",
    )
    return report


@router.get("/modules/{slug}/edit")
async def get_module_raw_content(
    slug: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN, UserRole.EDITOR])),
):
    """
    Get raw Markdown content of a module for editing.
    """
    result = await db.execute(select(Module).where(Module.slug == slug))
    mod = result.scalar_one_or_none()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")
    return {"slug": mod.slug, "name": mod.name, "raw_content": mod.raw_content}


@router.put("/modules/{slug}")
async def update_module_content(
    slug: str,
    payload: ModuleUpdatePayload,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN, UserRole.EDITOR])),
):
    """
    Update raw Markdown content of a module (Admin/Editor only).
    """
    result = await db.execute(select(Module).where(Module.slug == slug))
    mod = result.scalar_one_or_none()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")

    mod.raw_content = payload.raw_content
    await db.commit()

    await log_action(
        db,
        action=AuditAction.MODULE_UPDATED,
        user_id=admin.id,
        user_email=admin.email,
        target_slug=slug,
        details=f"Updated module content for {slug}",
    )
    return {"status": "success", "slug": slug}


@router.post("/modules/{slug}/archive")
async def archive_module(
    slug: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN])),
):
    """
    Set module status to archived (Admin only).
    """
    result = await db.execute(select(Module).where(Module.slug == slug))
    mod = result.scalar_one_or_none()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")

    mod.status = "archived"
    await db.commit()

    await log_action(
        db,
        action=AuditAction.MODULE_ARCHIVED,
        user_id=admin.id,
        user_email=admin.email,
        target_slug=slug,
    )
    return {"status": "archived", "slug": slug}


@router.post("/modules/{slug}/publish")
async def publish_module(
    slug: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN])),
):
    """
    Set module status to active (Admin only).
    """
    result = await db.execute(select(Module).where(Module.slug == slug))
    mod = result.scalar_one_or_none()
    if not mod:
        raise HTTPException(status_code=404, detail="Module not found")

    mod.status = "active"
    await db.commit()

    await log_action(
        db,
        action=AuditAction.MODULE_PUBLISHED,
        user_id=admin.id,
        user_email=admin.email,
        target_slug=slug,
    )
    return {"status": "active", "slug": slug}


@router.get("/audit/logs")
async def list_audit_logs(
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN])),
):
    """
    List platform audit log events (Admin only).
    """
    return await get_audit_trail(db, limit=limit)
