"""
BCOS Platform — Module Routes

CRUD endpoints for browsing and retrieving knowledge modules.
"""

from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ...core.database import get_session
from ...models import CrossReference, DecisionTree, Module, Principle, Rule
from ...schemas import ModuleDetail, ModuleSummary, PlatformStats

router = APIRouter()


@router.get("", response_model=List[ModuleSummary])
async def list_modules(
    department: Optional[str] = Query(None, description="Filter by department"),
    status: str = Query("active", description="Filter by status"),
    search: Optional[str] = Query(None, description="Search in name/description"),
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session),
):
    """List all modules, optionally filtered by department or keyword."""
    stmt = select(Module).where(Module.status == status)

    if department:
        stmt = stmt.where(Module.department == department)

    if search:
        search_term = f"%{search}%"
        stmt = stmt.where(
            Module.name.ilike(search_term) | Module.description.ilike(search_term)
        )

    stmt = stmt.order_by(Module.department, Module.name).offset(skip).limit(limit)

    result = await session.execute(stmt)
    modules = result.scalars().all()

    if not modules:
        return []

    module_ids = [mod.id for mod in modules]

    # Single aggregated count query instead of 3 queries per module (BUG-004).
    # Each count is computed as a correlated scalar subquery rather than a
    # join+group-by, which avoids the row-multiplication (and therefore
    # inflated counts) that a naive multi-table outer join would produce
    # when a module has, say, 5 principles and 3 rules.
    p_count_sq = (
        select(func.count(Principle.id))
        .where(Principle.module_id == Module.id)
        .correlate(Module)
        .scalar_subquery()
    )
    r_count_sq = (
        select(func.count(Rule.id))
        .where(Rule.module_id == Module.id)
        .correlate(Module)
        .scalar_subquery()
    )
    dt_count_sq = (
        select(func.count(DecisionTree.id))
        .where(DecisionTree.module_id == Module.id)
        .correlate(Module)
        .scalar_subquery()
    )
    counts_stmt = select(
        Module.id, p_count_sq, r_count_sq, dt_count_sq
    ).where(Module.id.in_(module_ids))
    counts_result = await session.execute(counts_stmt)
    counts_by_id = {
        mod_id: (p, r, dt) for mod_id, p, r, dt in counts_result.all()
    }

    summaries = []
    for mod in modules:
        p_count, r_count, dt_count = counts_by_id.get(mod.id, (0, 0, 0))
        summaries.append(
            ModuleSummary(
                id=mod.id,
                name=mod.name,
                slug=mod.slug,
                department=mod.department,
                description=mod.description,
                status=mod.status,
                principle_count=p_count or 0,
                rule_count=r_count or 0,
                decision_tree_count=dt_count or 0,
                created_at=mod.created_at,
            )
        )

    return summaries


@router.get("/departments")
async def list_departments(session: AsyncSession = Depends(get_session)):
    """List all departments with module counts."""
    stmt = select(Module.department, func.count(Module.id)).group_by(
        Module.department
    )
    result = await session.execute(stmt)
    departments = [
        {"name": dept, "module_count": count} for dept, count in result.all()
    ]
    return sorted(departments, key=lambda d: d["name"])


@router.get("/stats", response_model=PlatformStats)
async def get_stats(session: AsyncSession = Depends(get_session)):
    """Get platform-wide statistics."""
    total_modules = await session.scalar(select(func.count(Module.id)))
    total_principles = await session.scalar(select(func.count(Principle.id)))
    total_rules = await session.scalar(select(func.count(Rule.id)))
    total_trees = await session.scalar(select(func.count(DecisionTree.id)))
    total_refs = await session.scalar(select(func.count(CrossReference.id)))

    dept_result = await session.execute(
        select(Module.department, func.count(Module.id)).group_by(Module.department)
    )
    dept_counts = {dept: count for dept, count in dept_result.all()}

    return PlatformStats(
        total_modules=total_modules or 0,
        total_principles=total_principles or 0,
        total_rules=total_rules or 0,
        total_decision_trees=total_trees or 0,
        total_cross_references=total_refs or 0,
        departments=sorted(dept_counts.keys()),
        department_counts=dept_counts,
    )


@router.get("/{slug}", response_model=ModuleDetail)
async def get_module(slug: str, session: AsyncSession = Depends(get_session)):
    """Get a single module by slug, including all principles, rules, trees, and cross-refs."""
    stmt = (
        select(Module)
        .options(
            selectinload(Module.principles),
            selectinload(Module.rules),
            selectinload(Module.decision_trees),
            selectinload(Module.cross_references),
        )
        .where(Module.slug == slug)
    )
    result = await session.execute(stmt)
    module = result.scalar_one_or_none()

    if not module:
        raise HTTPException(status_code=404, detail=f"Module '{slug}' not found")

    return module
