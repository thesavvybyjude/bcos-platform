"""
BCOS Platform — Webhook API Routes

API endpoints for registering, testing, and managing outbound webhooks.
"""

from typing import List, Optional
from uuid import UUID
import secrets

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel, HttpUrl
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_db
from ...core.security import hash_webhook_secret
from ...models import User, UserRole
from ...models.webhook import Webhook, WebhookDelivery, WebhookEvent
from ...services.webhook import deliver_webhook, trigger_webhooks
from ..deps import require_role

router = APIRouter()


class WebhookCreate(BaseModel):
    name: str
    url: str
    event: WebhookEvent
    secret: Optional[str] = None


class WebhookRead(BaseModel):
    id: UUID
    name: str
    url: str
    event: WebhookEvent
    is_active: bool
    last_triggered_at: Optional[str] = None

    class Config:
        from_attributes = True


class WebhookCreatedResponse(WebhookRead):
    """Returned ONLY from the create endpoint — the raw secret is shown
    once and never stored or retrievable again (SEC-011)."""
    raw_secret: str


@router.post("/", response_model=WebhookCreatedResponse, status_code=status.HTTP_201_CREATED)
async def register_webhook(
    req: WebhookCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN])),
):
    """
    Register a new webhook subscription (Admin only).

    The response includes `raw_secret` ONCE — save it now. Only its hash
    is stored; it cannot be retrieved again after this response (SEC-011).
    """
    raw_secret = req.secret or secrets.token_hex(24)
    wh = Webhook(
        name=req.name,
        url=str(req.url),
        event=req.event,
        secret_hash=hash_webhook_secret(raw_secret),
    )
    db.add(wh)
    await db.commit()
    await db.refresh(wh)
    return WebhookCreatedResponse(
        id=wh.id,
        name=wh.name,
        url=wh.url,
        event=wh.event,
        is_active=wh.is_active,
        last_triggered_at=wh.last_triggered_at.isoformat() if wh.last_triggered_at else None,
        raw_secret=raw_secret,
    )


@router.get("/", response_model=List[WebhookRead])
async def list_webhooks(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN])),
):
    """
    List all active webhook configurations (Admin only).
    """
    result = await db.execute(select(Webhook))
    return result.scalars().all()


@router.delete("/{webhook_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_webhook(
    webhook_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN])),
):
    """
    Delete a webhook endpoint registration (Admin only).
    """
    result = await db.execute(select(Webhook).where(Webhook.id == webhook_id))
    wh = result.scalar_one_or_none()
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook not found")
    await db.delete(wh)
    await db.commit()


@router.post("/{webhook_id}/test")
async def test_webhook(
    webhook_id: UUID,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN])),
):
    """
    Send a test payload to a registered webhook (Admin only).
    """
    result = await db.execute(select(Webhook).where(Webhook.id == webhook_id))
    wh = result.scalar_one_or_none()
    if not wh:
        raise HTTPException(status_code=404, detail="Webhook not found")

    test_payload = {
        "event": wh.event.value,
        "test": True,
        "message": "This is a test notification from BCOS Platform",
    }

    delivery = await deliver_webhook(db, wh, wh.event.value, test_payload)
    return {
        "webhook_id": str(webhook_id),
        "status_code": delivery.status_code,
        "delivered": delivery.status_code == 200 if delivery.status_code else False,
        "error": delivery.error_message,
    }


@router.get("/deliveries")
async def list_webhook_deliveries(
    limit: int = Query(50, le=200),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_role([UserRole.ADMIN])),
):
    """
    List recent webhook delivery logs (Admin only).
    """
    result = await db.execute(
        select(WebhookDelivery).order_by(WebhookDelivery.delivered_at.desc()).limit(limit)
    )
    deliveries = result.scalars().all()
    return [
        {
            "id": str(d.id),
            "webhook_id": str(d.webhook_id),
            "event": d.event,
            "status_code": d.status_code,
            "error_message": d.error_message,
            "delivered_at": d.delivered_at.isoformat() if d.delivered_at else None,
        }
        for d in deliveries
    ]
