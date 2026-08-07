"""
BCOS Platform — Graph Routes

Returns knowledge graph data for D3 visualization.
Phase 0: Builds graph data from the PostgreSQL database.
Phase 2: Queries Neo4j directly.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ...core.database import get_session
from ...models import CrossReference, Module

router = APIRouter()


@router.get("/data")
async def get_graph_data(
    department: Optional[str] = Query(None, description="Filter by department"),
    session: AsyncSession = Depends(get_session),
):
    """
    Get knowledge graph in D3-compatible format.
    Returns {nodes: [...], links: [...]}.
    """
    stmt = select(Module).options(selectinload(Module.cross_references))
    if department:
        stmt = stmt.where(Module.department == department)

    result = await session.execute(stmt)
    modules = result.scalars().all()

    nodes = []
    links = []
    dept_nodes = set()

    for mod in modules:
        # Add department node (if not seen)
        if mod.department not in dept_nodes:
            nodes.append(
                {
                    "id": f"dept-{mod.department}",
                    "label": mod.department,
                    "type": "department",
                    "size": 20,
                }
            )
            dept_nodes.add(mod.department)

        # Add module node
        nodes.append(
            {
                "id": mod.slug,
                "label": mod.name,
                "type": "module",
                "department": mod.department,
                "size": 10,
            }
        )

        # Link module → department
        links.append(
            {
                "source": mod.slug,
                "target": f"dept-{mod.department}",
                "type": "belongs_to",
            }
        )

        # Add cross-reference links
        for ref in mod.cross_references:
            links.append(
                {
                    "source": mod.slug,
                    "target": ref.target_module_slug,
                    "type": ref.relationship_type,
                }
            )

    return {
        "nodes": nodes,
        "links": links,
        "total_nodes": len(nodes),
        "total_links": len(links),
    }
