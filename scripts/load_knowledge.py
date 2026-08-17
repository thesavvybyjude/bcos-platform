"""
BCOS Platform — Knowledge Loader CLI Script

Parses all Markdown files in data/business_context/ and loads them into PostgreSQL / SQLite.
Run: python -m scripts.load_knowledge [--force]
"""

import argparse
import asyncio
import sys
from pathlib import Path

# Fix encoding on Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Add parent to path for imports
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from src.config import settings
from src.core.database import init_database
from src import core
from src.models import CrossReference, DecisionTree, Module, Principle, Rule
from src.services import KnowledgeLoader


async def load_knowledge(force: bool = False):
    """Main loader function."""
    print("=" * 60)
    print("BCOS Platform — Knowledge Loader")
    print("=" * 60)
    print(f"Knowledge base: {settings.KNOWLEDGE_BASE_PATH}")
    print(f"Force reload:   {force}")
    print()

    # Initialize database
    print("[1/4] Initializing database...")
    await init_database()
    print("  [OK] Database initialized")

    # Parse markdown files
    print("[2/4] Parsing knowledge base...")
    loader = KnowledgeLoader(settings.KNOWLEDGE_BASE_PATH)
    parsed_modules = loader.load_all()
    stats = loader.stats

    print(f"  - Scanned {stats['files_scanned']} files")
    print(f"  - Parsed {stats['modules_parsed']} modules")
    print(f"  - Extracted {stats['principles_extracted']} principles")
    print(f"  - Extracted {stats['rules_extracted']} rules")
    print(f"  - Extracted {stats['decision_trees_extracted']} decision trees")
    print(f"  - Extracted {stats['cross_refs_extracted']} cross-references")
    if stats['errors'] > 0:
        print(f"  - WARNING: {stats['errors']} errors encountered")
    print()

    if not parsed_modules:
        print("No modules found. Check the KNOWLEDGE_BASE_PATH setting.")
        return

    # Load into database using active session factory
    print("[3/4] Loading into database...")
    async_session_factory = core.database.async_session

    async with async_session_factory() as session:
        from sqlalchemy import delete, func, select

        existing_count = await session.scalar(select(func.count(Module.id)))
        if existing_count and not force:
            print(
                f"  [ABORT] {existing_count} modules already exist in the database.\n"
                f"          Re-running the loader deletes ALL existing modules, "
                f"principles, rules, decision trees, and cross-references first.\n"
                f"          Pass --force to confirm you want to wipe and reload."
            )
            return

        await session.execute(delete(CrossReference))
        await session.execute(delete(DecisionTree))
        await session.execute(delete(Rule))
        await session.execute(delete(Principle))
        await session.execute(delete(Module))
        await session.commit()
        print("  [OK] Cleared existing data")

        for idx, parsed in enumerate(parsed_modules, 1):
            module = Module(
                name=parsed.name,
                slug=parsed.slug,
                department=parsed.department,
                description=parsed.description,
                purpose=parsed.purpose,
                file_path=parsed.file_path,
                raw_content=parsed.raw_content,
                status="active",
            )
            session.add(module)
            await session.flush()

            for p in parsed.principles:
                session.add(
                    Principle(
                        module_id=module.id,
                        title=p.title,
                        description=p.description,
                        source_quote=p.source_quote,
                        context=p.context,
                        order_index=p.order_index,
                    )
                )

            for r in parsed.rules:
                session.add(
                    Rule(
                        module_id=module.id,
                        rule_type=r.rule_type,
                        statement=r.statement,
                        reasoning=r.reasoning,
                        context=r.context,
                        order_index=r.order_index,
                    )
                )

            for d in parsed.decision_trees:
                session.add(
                    DecisionTree(
                        module_id=module.id,
                        name=d.name,
                        condition=d.condition,
                        action=d.action,
                        otherwise=d.otherwise,
                        context=d.context,
                        order_index=d.order_index,
                    )
                )

            for ref in parsed.cross_references:
                session.add(
                    CrossReference(
                        source_module_id=module.id,
                        target_module_slug=ref.target_slug,
                        relationship_type=ref.relationship_type,
                        description=ref.description,
                    )
                )

            if idx % 25 == 0 or idx == len(parsed_modules):
                print(f"  [Loaded {idx}/{len(parsed_modules)}] {parsed.department}/{parsed.name}")

        await session.commit()

    print()
    print("[4/4] Load complete!")
    print("-" * 60)
    print(f"  Modules:         {len(parsed_modules)}")
    print(f"  Departments:     {len(set(m.department for m in parsed_modules))}")
    print(f"  Principles:      {stats['principles_extracted']}")
    print(f"  Rules:           {stats['rules_extracted']}")
    print(f"  Decision Trees:  {stats['decision_trees_extracted']}")
    print(f"  Cross-Refs:      {stats['cross_refs_extracted']}")
    print("=" * 60)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="BCOS Knowledge Loader")
    parser.add_argument("--force", action="store_true", help="Force clear and reload")
    args = parser.parse_args()

    asyncio.run(load_knowledge(force=args.force))
