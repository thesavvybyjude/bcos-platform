"""
Unit tests for BCOS Platform Authentication & Security utilities.
"""

import pytest
from src.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_api_key,
    get_password_hash,
    hash_api_key,
    verify_password,
)


def test_password_hashing():
    password = "SuperSecretPassword123!"
    hashed = get_password_hash(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword", hashed) is False


def test_jwt_access_token():
    subject = "12345678-1234-5678-1234-567812345678"
    role = "admin"
    token = create_access_token(subject=subject, role=role)
    
    decoded = decode_token(token)
    assert decoded["sub"] == subject
    assert decoded["role"] == role
    assert decoded["type"] == "access"


def test_jwt_refresh_token():
    subject = "12345678-1234-5678-1234-567812345678"
    raw_token, token_hash = create_refresh_token(subject=subject)
    
    assert len(raw_token) > 0
    assert len(token_hash) == 64  # SHA256 hex string length
    
    decoded = decode_token(raw_token)
    assert decoded["sub"] == subject
    assert decoded["type"] == "refresh"


def test_api_key_generation():
    raw_key, prefix, key_hash = generate_api_key()
    assert raw_key.startswith("bcos_live_")
    assert prefix.startswith("bcos_live_")
    assert hash_api_key(raw_key) == key_hash
