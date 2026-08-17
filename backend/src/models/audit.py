"""
BCOS Platform — Audit Log Models

SQLAlchemy models for administrative and security audit logging.
"""

import enum
import uuid
from datetime import datetime, timezone

from sqlalchemy import Column, DateTime, Enum as SQLEnum, ForeignKey, String, Text
from ..core.types import GUID

from ..core.database import Base


def utcnow():
    return datetime.now(timezone.utc)


class AuditAction(str, enum.Enum):
    MODULE_CREATED = "MODULE_CREATED"
    MODULE_UPDATED = "MODULE_UPDATED"
    MODULE_ARCHIVED = "MODULE_ARCHIVED"
    MODULE_PUBLISHED = "MODULE_PUBLISHED"
    MODULE_DELETED = "MODULE_DELETED"
    USER_LOGIN = "USER_LOGIN"
    USER_LOGOUT = "USER_LOGOUT"
    USER_CREATED = "USER_CREATED"
    USER_UPDATED = "USER_UPDATED"
    USER_DELETED = "USER_DELETED"
    VALIDATION_RUN = "VALIDATION_RUN"
    SETTINGS_UPDATED = "SETTINGS_UPDATED"


class AuditLog(Base):
    """
    Audit log entry recording administrative events, module changes, and user access.
    """

    __tablename__ = "audit_logs"

    id = Column(GUID(), primary_key=True, default=uuid.uuid4)
    user_id = Column(GUID(), nullable=True)
    user_email = Column(String(255), default="system")
    action = Column(SQLEnum(AuditAction, values_callable=lambda x: [e.value for e in x]), nullable=False)
    target_slug = Column(String(500), nullable=True)
    details = Column(Text, default="")
    ip_address = Column(String(50), default="")
    timestamp = Column(DateTime(timezone=True), default=utcnow, index=True)

    def __repr__(self):
        return f"<AuditLog {self.action} by {self.user_email} at {self.timestamp}>"
