"""
BCOS Platform — Knowledge Validator Service

Validates Markdown module schema structure, cross-references, source attributions,
and calculates platform health score metrics.
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
from pathlib import Path

from ..config import settings
from .knowledge_loader import KnowledgeLoader, ParsedModule


@dataclass
class ValidationIssue:
    module_slug: str
    module_name: str
    severity: str  # ERROR | WARNING | INFO
    category: str  # MISSING_SECTION | BROKEN_CROSS_REF | MISSING_ATTRIBUTION | FORMATTING
    message: str


@dataclass
class ValidationReport:
    total_modules: int
    health_score: float  # 0 to 100
    total_errors: int
    total_warnings: int
    issues: List[ValidationIssue] = field(default_factory=list)


class KnowledgeValidator:
    """
    Validates all knowledge base modules for structural integrity.
    """

    def __init__(self, base_path: Optional[str] = None):
        self.loader = KnowledgeLoader(base_path or settings.KNOWLEDGE_BASE_PATH)

    def validate_all(self) -> ValidationReport:
        modules = self.loader.load_all()
        known_slugs = {m.slug for m in modules}
        known_names_lower = {m.name.lower() for m in modules}

        issues: List[ValidationIssue] = []
        errors_count = 0
        warnings_count = 0

        for m in modules:
            # 1. Check Purpose / Description
            if not m.purpose and not m.description:
                issues.append(
                    ValidationIssue(
                        module_slug=m.slug,
                        module_name=m.name,
                        severity="WARNING",
                        category="MISSING_SECTION",
                        message="Module missing explicit '## Purpose' or '## Description' section.",
                    )
                )
                warnings_count += 1

            # 2. Check Principles
            if not m.principles:
                issues.append(
                    ValidationIssue(
                        module_slug=m.slug,
                        module_name=m.name,
                        severity="INFO",
                        category="MISSING_SECTION",
                        message="Module contains 0 extracted principles.",
                    )
                )

            # 3. Check Rules
            if not m.rules:
                issues.append(
                    ValidationIssue(
                        module_slug=m.slug,
                        module_name=m.name,
                        severity="INFO",
                        category="MISSING_SECTION",
                        message="Module contains 0 extracted operational rules.",
                    )
                )

            # 4. Check Source Attribution
            if not m.source_attribution and "*Source:" not in m.raw_content:
                issues.append(
                    ValidationIssue(
                        module_slug=m.slug,
                        module_name=m.name,
                        severity="WARNING",
                        category="MISSING_ATTRIBUTION",
                        message="Module missing explicit source attribution footer.",
                    )
                )
                warnings_count += 1

            # 5. Check Cross References
            for ref in m.cross_references:
                target = ref.target_slug
                if target not in known_slugs and target.lower() not in known_names_lower:
                    issues.append(
                        ValidationIssue(
                            module_slug=m.slug,
                            module_name=m.name,
                            severity="ERROR",
                            category="BROKEN_CROSS_REF",
                            message=f"Broken cross-reference link to '{target}'. Target module does not exist.",
                        )
                    )
                    errors_count += 1

        total_mods = len(modules)
        # Calculate health score: 100 - (errors * 2 + warnings * 0.5) scaled by module count
        deductions = (errors_count * 3.0) + (warnings_count * 0.2)
        health_score = max(0.0, min(100.0, 100.0 - deductions))

        return ValidationReport(
            total_modules=total_mods,
            health_score=round(health_score, 1),
            total_errors=errors_count,
            total_warnings=warnings_count,
            issues=issues,
        )
