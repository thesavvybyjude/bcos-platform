"""
BCOS Platform — Directory Validation Script

Validates that all .md files in data/business_context/ conform to the expected structure.
Run: python scripts/validate.py
"""

import re
import sys
from pathlib import Path

# Fix encoding on Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Configuration
BASE_PATH = Path(__file__).resolve().parent.parent / "data" / "business_context"
REQUIRED_SECTIONS = ["Purpose", "Principles", "Rules"]
RECOMMENDED_SECTIONS = ["Decision Frameworks", "See Also"]
SKIP_FILES = {"Orchestrator.md", "INDEX.md", "SCHEMA.md", "CHANGELOG.md", "START.md", "README.md"}


def validate_file(file_path: Path, department: str) -> dict:
    """Validate a single Markdown file."""
    issues = []
    warnings = []

    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception as e:
        return {"file": str(file_path), "status": "ERROR", "issues": [f"Cannot read: {e}"]}

    # Check for H1 title
    if not re.search(r"^# .+", content, re.MULTILINE):
        issues.append("Missing H1 title (# Title)")

    # Check for required sections
    for section in REQUIRED_SECTIONS:
        pattern = rf"^## (?:{section}|Core {section}|Key {section}|Guiding {section}|Business {section})"
        if not re.search(pattern, content, re.MULTILINE | re.IGNORECASE):
            issues.append(f"Missing required section: ## {section}")

    # Check for recommended sections
    for section in RECOMMENDED_SECTIONS:
        pattern = rf"^## (?:{section}|Related Modules|See Also|Cross-references)"
        if not re.search(pattern, content, re.MULTILINE | re.IGNORECASE):
            warnings.append(f"Missing recommended section: ## {section}")

    # Check for at least one principle
    principles_section = re.search(
        r"## (?:Core )?Principles\n(.+?)(?=\n## |\Z)", content, re.DOTALL | re.IGNORECASE
    )
    if principles_section:
        principle_count = len(re.findall(r"\n\s*\d+\.\s+\*\*", principles_section.group(1)))
        if principle_count == 0:
            warnings.append("No numbered principles found in Principles section")

    # Check for typed rules
    rules_section = re.search(
        r"## (?:Business )?Rules\n(.+?)(?=\n## |\Z)", content, re.DOTALL | re.IGNORECASE
    )
    if rules_section:
        rule_types = re.findall(
            r"\*\*(Always|Never|Avoid|Prefer)", rules_section.group(1), re.IGNORECASE
        )
        if not rule_types:
            warnings.append("No typed rules (Always/Never/Avoid/Prefer) found in Rules section")

    # Check minimum content length
    if len(content) < 500:
        warnings.append(f"Very short file ({len(content)} chars). May be incomplete.")

    status = "PASS" if not issues else "FAIL"
    return {
        "file": f"{department}/{file_path.name}",
        "status": status,
        "issues": issues,
        "warnings": warnings,
    }


def main():
    print("=" * 60)
    print("BCOS Platform — Directory Validation")
    print("=" * 60)
    print(f"Base path: {BASE_PATH}")
    print()

    if not BASE_PATH.exists():
        print(f"ERROR: {BASE_PATH} does not exist!")
        sys.exit(1)

    results = []
    total_files = 0
    total_pass = 0
    total_fail = 0

    for item in sorted(BASE_PATH.iterdir()):
        if item.is_dir():
            department = item.name
            print(f"[Dept] {department}/")
            for md_file in sorted(item.glob("*.md")):
                total_files += 1
                result = validate_file(md_file, department)
                results.append(result)

                if result["status"] == "PASS":
                    total_pass += 1
                    icon = "  [PASS]"
                else:
                    total_fail += 1
                    icon = "  [FAIL]"

                print(f"{icon} {md_file.name}")
                for issue in result["issues"]:
                    print(f"      - ERROR: {issue}")
                for warning in result.get("warnings", []):
                    print(f"      - WARN:  {warning}")

        elif item.is_file() and item.suffix == ".md" and item.name not in SKIP_FILES:
            total_files += 1
            result = validate_file(item, "Root")
            results.append(result)

    print()
    print("-" * 60)
    print(f"Total files:  {total_files}")
    print(f"Passed:       {total_pass}")
    print(f"Failed:       {total_fail}")
    print("=" * 60)

    if total_fail > 0:
        print("\nNote: Some files failed strict schema checks.")


if __name__ == "__main__":
    main()
