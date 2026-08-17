"""
BCOS Platform — Webhook Service

Service providing HMAC-SHA256 payload signing and async delivery dispatching.
"""

import hmac
import hashlib
import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..models.webhook import Webhook, WebhookDelivery, WebhookEvent


def sign_payload(payload: Dict[str, Any], secret: str) -> str:
    """Generate HMAC-SHA256 signature string for webhook payload."""
    json_bytes = json.dumps(payload, sort_keys=True).encode("utf-8")
    return hmac.new(secret.encode("utf-8"), json_bytes, hashlib.sha256).hexdigest()


async def deliver_webhook(
    db: AsyncSession,
    webhook: Webhook,
    event: str,
    payload: Dict[str, Any],
) -> WebhookDelivery:
    """Deliver webhook payload via HTTP POST with HMAC signature header.

    Signs with `webhook.secret_hash`, not a raw secret — the raw secret is
    never stored (SEC-011), only shown once at creation time. Using the
    hash as the HMAC key is safe: HMAC just needs a consistent, unguessable
    key, not a reversible one.
    """
    signature = sign_payload(payload, webhook.secret_hash)
    headers = {
        "Content-Type": "application/json",
        "X-BCOS-Event": event,
        "X-BCOS-Signature": signature,
        "User-Agent": "BCOS-Webhook-Dispatcher/1.0",
    }

    payload_json = json.dumps(payload)
    status_code = None
    response_body = ""
    error_msg = ""

    async with httpx.AsyncClient(timeout=10.0) as client:
        try:
            resp = await client.post(webhook.url, content=payload_json, headers=headers)
            status_code = resp.status_code
            response_body = resp.text[:1000]
        except Exception as err:
            error_msg = str(err)

    delivery = WebhookDelivery(
        webhook_id=webhook.id,
        event=event,
        payload=payload_json,
        status_code=status_code,
        response_body=response_body,
        error_message=error_msg,
    )
    db.add(delivery)
    webhook.last_triggered_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(delivery)
    return delivery


async def trigger_webhooks(
    db: AsyncSession,
    event: WebhookEvent,
    payload_data: Dict[str, Any],
) -> List[WebhookDelivery]:
    """Find all active webhooks subscribed to event and deliver payload."""
    result = await db.execute(
        select(Webhook).where(Webhook.event == event, Webhook.is_active == True)
    )
    webhooks = result.scalars().all()

    full_payload = {
        "event": event.value,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": payload_data,
    }

    deliveries = []
    for wh in webhooks:
        deliv = await deliver_webhook(db, wh, event.value, full_payload)
        deliveries.append(deliv)
    return deliveries
