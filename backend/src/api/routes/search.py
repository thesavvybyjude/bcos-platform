"""
BCOS Platform — Search Routes

Provides keyword and semantic search across the knowledge base.
"""

from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ...core.database import get_session
from ...models import DecisionTree, Module, Principle, Rule
from ...schemas import ModuleSummary, SearchResponse, SearchResult

router = APIRouter()


@router.get("", response_model=SearchResponse)
async def search(
    q: str = Query(..., min_length=1, max_length=1000, description="Search query"),
    department: Optional[str] = Query(None, description="Filter by department"),
    max_results: int = Query(10, ge=1, le=50),
    session: AsyncSession = Depends(get_session),
):
    """
    Search across modules, principles, and rules.
    Phase 0: keyword search only.
    Phase 2: hybrid keyword + semantic search via Chroma.
    """
    search_term = f"%{q}%"
    results = []

    # 1. Search modules by name and description
    mod_stmt = select(Module).where(
        Module.status == "active",
        or_(
            Module.name.ilike(search_term),
            Module.description.ilike(search_term),
            Module.raw_content.ilike(search_term),
        ),
    )
    if department:
        mod_stmt = mod_stmt.where(Module.department == department)

    mod_stmt = mod_stmt.limit(max_results)
    mod_result = await session.execute(mod_stmt)
    matched_modules = mod_result.scalars().all()

    # Batch-fetch principle/rule/decision-tree counts for all matched modules
    # in one query instead of 3 queries per module (BUG-005, same fix as BUG-004).
    counts_by_id = await _batch_module_counts(
        session, [mod.id for mod in matched_modules]
    )

    for mod in matched_modules:
        # Compute a naive relevance score
        score = 0.0
        q_lower = q.lower()
        if q_lower in mod.name.lower():
            score += 3.0
        if mod.description and q_lower in mod.description.lower():
            score += 2.0
        if mod.raw_content and q_lower in mod.raw_content.lower():
            score += 1.0

        # Extract a snippet from raw_content
        snippet = _extract_snippet(mod.raw_content, q, max_length=200)

        p_count, r_count, dt_count = counts_by_id.get(mod.id, (0, 0, 0))

        results.append(
            SearchResult(
                module=ModuleSummary(
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
                ),
                score=score,
                snippet=snippet,
                match_type="keyword",
            )
        )

    # 2. Search principles by title/description (add parent module if not already matched)
    p_stmt = (
        select(Principle)
        .where(
            or_(
                Principle.title.ilike(search_term),
                Principle.description.ilike(search_term),
            )
        )
        .limit(max_results)
    )
    p_result = await session.execute(p_stmt)
    matched_principles = p_result.scalars().all()

    seen_module_ids = {r.module.id for r in results}
    unseen_module_ids = {
        p.module_id for p in matched_principles if p.module_id not in seen_module_ids
    }

    if unseen_module_ids:
        # Batch-fetch parent modules in one query instead of session.get() per
        # principle (the other half of BUG-005).
        parent_modules_result = await session.execute(
            select(Module).where(Module.id.in_(unseen_module_ids))
        )
        parent_modules_by_id = {
            m.id: m for m in parent_modules_result.scalars().all()
        }
        parent_counts_by_id = await _batch_module_counts(
            session, list(parent_modules_by_id.keys())
        )

        for p in matched_principles:
            if p.module_id in seen_module_ids:
                continue
            mod = parent_modules_by_id.get(p.module_id)
            if mod:
                p_count, _, _ = parent_counts_by_id.get(mod.id, (0, 0, 0))
                results.append(
                    SearchResult(
                        module=ModuleSummary(
                            id=mod.id,
                            name=mod.name,
                            slug=mod.slug,
                            department=mod.department,
                            description=mod.description,
                            status=mod.status,
                            principle_count=p_count or 0,
                        ),
                        score=1.5,
                        snippet=f"Principle: {p.title} — {p.description[:150]}",
                        match_type="keyword",
                    )
                )
                seen_module_ids.add(mod.id)

    # Sort by score
    results.sort(key=lambda r: r.score, reverse=True)
    results = results[:max_results]

    return SearchResponse(
        query=q,
        total=len(results),
        results=results,
    )


async def _batch_module_counts(session: AsyncSession, module_ids: list) -> dict:
    """Fetch principle/rule/decision-tree counts for a set of module IDs in a
    single query, instead of 3 queries per module (BUG-004/BUG-005)."""
    if not module_ids:
        return {}

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
    stmt = select(Module.id, p_count_sq, r_count_sq, dt_count_sq).where(
        Module.id.in_(module_ids)
    )
    result = await session.execute(stmt)
    return {mod_id: (p, r, dt) for mod_id, p, r, dt in result.all()}


def _extract_snippet(content: str, query: str, max_length: int = 200) -> str:
    """Extract a relevant snippet from content around the query match."""
    if not content:
        return ""

    q_lower = query.lower()
    c_lower = content.lower()
    idx = c_lower.find(q_lower)

    if idx == -1:
        # No exact match — return first N chars
        return content[:max_length] + ("..." if len(content) > max_length else "")

    # Center the snippet around the match
    start = max(0, idx - max_length // 2)
    end = min(len(content), idx + len(query) + max_length // 2)

    snippet = content[start:end].strip()
    if start > 0:
        snippet = "..." + snippet
    if end < len(content):
        snippet = snippet + "..."

    return snippet
