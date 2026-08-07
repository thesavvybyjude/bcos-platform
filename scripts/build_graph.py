"""
BCOS Platform — Neo4j Knowledge Graph Builder

Parses loaded modules and builds the graph of nodes & cross-reference relationships in Neo4j.
Run: python scripts/build_graph.py
"""

import asyncio
import sys
from pathlib import Path

# Fix encoding on Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

from src.config import settings
from src.services.graph_store import GraphStore
from src.services.knowledge_loader import KnowledgeLoader


async def build_graph():
    print("=" * 60)
    print("BCOS Platform — Neo4j Knowledge Graph Builder")
    print("=" * 60)
    print(f"Neo4j URI: {settings.NEO4J_URI}")
    print()

    # 1. Parse knowledge modules
    print("[1/2] Parsing Markdown modules...")
    loader = KnowledgeLoader(settings.KNOWLEDGE_BASE_PATH)
    modules = loader.load_all()
    print(f"  [OK] Parsed {len(modules)} modules")

    if not modules:
        print("No modules found to build graph.")
        return

    # Convert dataclasses to dicts for GraphStore
    module_dicts = [
        {
            "name": m.name,
            "slug": m.slug,
            "department": m.department,
            "description": m.description,
            "cross_references": [
                {"target_slug": ref.target_slug, "relationship_type": ref.relationship_type}
                for ref in m.cross_references
            ],
        }
        for m in modules
    ]

    # 2. Build Graph in Neo4j
    print("[2/2] Connecting to Neo4j and constructing graph...")
    graph_store = GraphStore()
    await graph_store.initialize()

    if not graph_store.is_available:
        print("Notice: Neo4j is not reachable. Ensure neo4j service is running (docker-compose up -d neo4j).")
        return

    result = await graph_store.build_graph_from_modules(module_dicts)
    await graph_store.close()

    print()
    print("=" * 60)
    print("Graph Build Complete!")
    print(f"  Nodes Created:         {result.get('nodes_created', 0)}")
    print(f"  Relationships Created: {result.get('relationships_created', 0)}")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(build_graph())
