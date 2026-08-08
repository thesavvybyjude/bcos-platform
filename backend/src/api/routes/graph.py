"""
BCOS Platform — Graph Routes

Exposes endpoints for D3 knowledge graph visualization, department subgraphs, N-hop neighborhood traversals, and pathfinding.
"""

from typing import Optional
from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ...core.database import get_session
from ...models import CrossReference, Module
from ...services.graph_store import GraphStore

router = APIRouter()
graph_store = GraphStore()


@router.get("/data")
async def get_graph_data(
    department: Optional[str] = Query(None, description="Filter by department"),
    session: AsyncSession = Depends(get_session),
):
    """
    Get knowledge graph data in D3-compatible format.
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

        # Link module -> department
        links.append(
            {
                "source": mod.slug,
                "target": f"dept-{mod.department}",
                "type": "belongs_to",
            }
        )

        # Cross-reference links
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


@router.get("/department/{dept_name}")
async def get_department_subgraph(
    dept_name: str,
    session: AsyncSession = Depends(get_session),
):
    """
    Get graph data for a specific department.
    """
    return await get_graph_data(department=dept_name, session=session)


@router.get("/module/{slug}")
async def get_module_neighbors(
    slug: str,
    depth: int = Query(2, ge=1, le=3),
    session: AsyncSession = Depends(get_session),
):
    """
    Get N-hop neighborhood graph centered around a target module.
    """
    if graph_store.is_available:
        return await graph_store.get_module_neighbors(slug=slug, depth=depth)

    # Database fallback
    stmt = select(Module).where(Module.slug == slug).options(selectinload(Module.cross_references))
    res = await session.execute(stmt)
    center = res.scalar_one_or_none()
    if not center:
        return {"nodes": [{"id": slug, "label": slug, "type": "module"}], "links": []}

    nodes = [
        {"id": center.slug, "label": center.name, "type": "module", "department": center.department},
        {"id": f"dept-{center.department}", "label": center.department, "type": "department"},
    ]
    links = [{"source": center.slug, "target": f"dept-{center.department}", "type": "belongs_to"}]

    for ref in center.cross_references:
        nodes.append({"id": ref.target_module_slug, "label": ref.target_module_slug, "type": "module"})
        links.append({"source": center.slug, "target": ref.target_module_slug, "type": ref.relationship_type})

    return {"nodes": nodes, "links": links}


@router.get("/path")
async def find_path(
    source: str = Query(..., description="Source module slug"),
    target: str = Query(..., description="Target module slug"),
):
    """
    Find shortest path between two business modules.
    """
    if graph_store.is_available:
        return await graph_store.find_path(source_slug=source, target_slug=target)

    return {"path_found": False, "nodes": [], "links": [], "notice": "Neo4j graph store not available"}
