"""
BCOS Platform — SQLAlchemy Models

Defines the core data model for the knowledge base:
  Module → Principle, Rule, DecisionTree, CrossReference

Every module maps to a single Markdown file in `Business Context/`.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from ..core.database import Base
from .audit import AuditAction, AuditLog
from .user import APIKey, RefreshToken, User, UserRole
from .webhook import Webhook, WebhookDelivery, WebhookEvent


def utcnow():
    return datetime.now(timezone.utc)


class Module(Base):
    """
    A single knowledge module — maps 1:1 to a Markdown file.
    Example: "Brand Sponsorships & Negotiation" in Marketing/.
    """

    __tablename__ = "modules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(500), nullable=False)
    slug = Column(String(500), nullable=False, unique=True, index=True)
    department = Column(String(200), nullable=False, index=True)
    description = Column(Text, default="")
    purpose = Column(Text, default="")
    file_path = Column(String(1000), nullable=False)
    version = Column(Integer, default=1)
    status = Column(String(50), default="active")  # active | draft | archived

    # Timestamps
    created_at = Column(DateTime(timezone=True), default=utcnow)
    updated_at = Column(DateTime(timezone=True), default=utcnow, onupdate=utcnow)

    # Raw content (for full-text fallback)
    raw_content = Column(Text, default="")

    # Relationships
    principles = relationship(
        "Principle", back_populates="module", cascade="all, delete-orphan"
    )
    rules = relationship(
        "Rule", back_populates="module", cascade="all, delete-orphan"
    )
    decision_trees = relationship(
        "DecisionTree", back_populates="module", cascade="all, delete-orphan"
    )
    cross_references = relationship(
        "CrossReference",
        back_populates="source_module",
        foreign_keys="CrossReference.source_module_id",
        cascade="all, delete-orphan",
    )

    __table_args__ = (
        Index("ix_modules_department_name", "department", "name"),
    )

    def __repr__(self):
        return f"<Module {self.department}/{self.name}>"


class Principle(Base):
    """A business principle within a module."""

    __tablename__ = "principles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(
        UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False
    )
    title = Column(String(500), nullable=False)
    description = Column(Text, nullable=False)
    source_quote = Column(Text, default="")
    context = Column(Text, default="")
    order_index = Column(Integer, default=0)

    # Relationships
    module = relationship("Module", back_populates="principles")

    def __repr__(self):
        return f"<Principle {self.title[:50]}>"


class Rule(Base):
    """
    A business rule — typed as Always / Never / Avoid / Prefer.
    """

    __tablename__ = "rules"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(
        UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False
    )
    rule_type = Column(String(50), nullable=False)  # Always | Never | Avoid | Prefer
    statement = Column(Text, nullable=False)
    reasoning = Column(Text, default="")
    context = Column(Text, default="")
    order_index = Column(Integer, default=0)

    # Relationships
    module = relationship("Module", back_populates="rules")

    __table_args__ = (
        Index("ix_rules_type", "rule_type"),
    )

    def __repr__(self):
        return f"<Rule [{self.rule_type}] {self.statement[:50]}>"


class DecisionTree(Base):
    """A decision framework / decision tree within a module."""

    __tablename__ = "decision_trees"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    module_id = Column(
        UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False
    )
    name = Column(String(500), nullable=False)
    condition = Column(Text, nullable=False)
    action = Column(Text, nullable=False)
    otherwise = Column(Text, default="")
    context = Column(Text, default="")
    order_index = Column(Integer, default=0)

    # Relationships
    module = relationship("Module", back_populates="decision_trees")

    def __repr__(self):
        return f"<DecisionTree {self.name[:50]}>"


class CrossReference(Base):
    """
    A link between two modules.
    Extracted from '## See Also' / '## Related Modules' sections.
    """

    __tablename__ = "cross_references"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    source_module_id = Column(
        UUID(as_uuid=True), ForeignKey("modules.id", ondelete="CASCADE"), nullable=False
    )
    target_module_slug = Column(String(500), nullable=False)
    relationship_type = Column(
        String(100), default="related_to"
    )  # depends_on | feeds | related_to | extends
    description = Column(Text, default="")

    # Relationships
    source_module = relationship(
        "Module",
        back_populates="cross_references",
        foreign_keys=[source_module_id],
    )

    __table_args__ = (
        UniqueConstraint(
            "source_module_id", "target_module_slug", name="uq_cross_ref"
        ),
    )

    def __repr__(self):
        return f"<CrossReference → {self.target_module_slug}>"
