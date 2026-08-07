import pytest
from pathlib import Path
from src.services.knowledge_loader import KnowledgeLoader


def test_slugify():
    assert KnowledgeLoader._slugify("Brand Sponsorships & Negotiation") == "brand-sponsorships-negotiation"
    assert KnowledgeLoader._slugify("AI Strategy 101!") == "ai-strategy-101"


def test_section_extraction(tmp_path):
    sample_md = """# Test Module

## Purpose
This is the test purpose.

## Principles
1. **Test Principle** — Details here.

## Rules
**Always:** Do unit tests.
"""
    file_path = tmp_path / "Test.md"
    file_path.write_text(sample_md, encoding="utf-8")

    loader = KnowledgeLoader(tmp_path)
    parsed = loader._parse_file(file_path, "TestDepartment")

    assert parsed is not None
    assert parsed.name == "Test Module"
    assert parsed.department == "TestDepartment"
    assert len(parsed.principles) == 1
    assert parsed.principles[0].title == "Test Principle"
    assert len(parsed.rules) == 1
    assert parsed.rules[0].rule_type == "Always"
