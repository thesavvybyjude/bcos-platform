"""
BCOS Platform — Webhook Models

SQLAlchemy models for outbound webhook registrations and event delivery logs.
"""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, Column, DateTime, Enum as SQLEnum, ForeignKey, Integer, String, Text
from ..core.types import GUID
from sqlalchemy.orm import relationship

from ..core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class WebhookEvent(str, enum.Enum):
    MODULE_CREATED = "MODULE_CREATED"
    MODULE_UPDATED = "MODULE_UPDATED"
    MODULE_ARCHIVED = "MODULE_ARCHIVED"
    MODULE_PUBLISHED = "MODULE_PUBLISHED"
    MODULE_DELETED = "MODULE_DELETED"
    CONTEXT_COMPILED = "CONTEXT_COMPILED"
    VALIDATION_COMPLETE = "VALIDATION_COMPLETE"
    SYSTEM_READY = "SYSTEM_READY"


class Webhook(Base):
    """
    Registered webhook endpoint listening to platform events.
    """

    __tablename__ = "webhooks"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    url = Column(String(1024), nullable=False)
    event = Column(SQLEnum(WebhookEvent, values_callable=lambda x: [e.value for e in x]), nullable=False)
    secret_hash = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True, nullable=False)

    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)
    last_triggered_at = Column(DateTime(timezone=True), nullable=True)

    deliveries = relationship("WebhookDelivery", back_populates="webhook", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Webhook {self.name} [{self.event}] -> {self.url}>"


class WebhookDelivery(Base):
    """
    Log entry recording the attempt and outcome of delivering a webhook payload.
    """

    __tablename__ = "webhook_deliveries"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    webhook_id = Column(GUID(), ForeignKey("webhooks.id", ondelete="CASCADE"), nullable=False)
    event = Column(String(100), nullable=False)
    payload = Column(Text, nullable=False)
    status_code = Column(Integer, nullable=True)
    response_body = Column(Text, default="")
    error_message = Column(Text, default="")
    delivered_at = Column(DateTime(timezone=True), default=utcnow)

    webhook = relationship("Webhook", back_populates="deliveries")

    def __repr__(self):
        return f"<WebhookDelivery {self.event} Status:{self.status_code}>"
