"""
BCOS Platform — Unit Tests for Phase 5 (Admin & Validator) and Phase 6 (Webhooks)
"""

import pytest
from src.services.validator import KnowledgeValidator
from src.services.webhook import sign_payload
from src.models.webhook import WebhookEvent


def test_validator_scan():
    validator = KnowledgeValidator()
    report = validator.validate_all()
    assert report.total_modules > 0
    assert report.health_score >= 0.0
    assert report.health_score <= 100.0


def test_webhook_hmac_signing():
    payload = {"event": "TEST", "data": {"foo": "bar"}}
    secret = "supersecretkey123"
    sig1 = sign_payload(payload, secret)
    sig2 = sign_payload(payload, secret)
    assert sig1 == sig2
    assert len(sig1) == 64  # SHA256 hex string length


def test_webhook_event_enum():
    assert WebhookEvent.CONTEXT_COMPILED.value == "CONTEXT_COMPILED"
    assert WebhookEvent.MODULE_UPDATED.value == "MODULE_UPDATED"
