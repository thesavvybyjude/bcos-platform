"""
BCOS Platform — Schema Validation Script

Validates Markdown files against standard BCOS Schema rules.
Run: python scripts/validate_schema.py
"""

import sys
from pathlib import Path
from validate import main

if __name__ == "__main__":
    main()
