"""
Regression tests for BUG-004 / BUG-005 (N+1 query patterns in
/api/modules and /api/search).

These seed several modules each with several principles/rules/decision
trees, then assert:
  1. The returned counts are correct (the refactor didn't change behavior).
  2. The number of SQL statements executed does NOT scale with the number
     of modules — this is what would catch a future N+1 regression, since
     a correctness-only test wouldn't notice 3N queries creeping back in.
"""

import uuid

import pytest
import pytest_asyncio
from sqlalchemy import event
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from src.core.database import Base
from src.models import DecisionTree, Module, Principle, Rule


@pytest_asyncio.fixture
async def seeded_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    module_ids = []
    async with session_factory() as session:
        for i in range(5):
            mod = Module(
                name=f"Test Module {i}",
                slug=f"test-module-{i}",
                department="Testing",
                description=f"Description {i}",
                purpose="Testing purpose",
                file_path=f"/fake/path/{i}.md",
                version=1,
                status="active",
                raw_content=f"Raw content for module {i} mentioning searchterm",
            )
            session.add(mod)
            await session.flush()
            module_ids.append(mod.id)

            # 2 principles, 3 rules, 1 decision tree per module — known counts
            for j in range(2):
                session.add(Principle(
                    module_id=mod.id, title=f"Principle {j}",
                    description="desc", order_index=j,
                ))
            for j in range(3):
                session.add(Rule(
                    module_id=mod.id, rule_type="must", statement=f"Rule {j}",
                    order_index=j,
                ))
            session.add(DecisionTree(
                module_id=mod.id, name="Tree", condition="if x",
                action="do y", order_index=0,
            ))
        await session.commit()

    yield engine, session_factory, module_ids
    await engine.dispose()


class _QueryCounter:
    def __init__(self, engine):
        self.count = 0
        self._engine = engine

    def __enter__(self):
        event.listen(self._engine.sync_engine, "before_cursor_execute", self._inc)
        return self

    def __exit__(self, *a):
        event.remove(self._engine.sync_engine, "before_cursor_execute", self._inc)

    def _inc(self, *args, **kwargs):
        self.count += 1


@pytest.mark.asyncio
async def test_list_modules_counts_are_correct_and_query_count_is_bounded(seeded_engine):
    from src.api.routes.modules import list_modules

    engine, session_factory, module_ids = seeded_engine
    async with session_factory() as session:
        with _QueryCounter(engine) as counter:
            summaries = await list_modules(
                department=None, status="active", search=None,
                skip=0, limit=50, session=session,
            )

    assert len(summaries) == 5
    for s in summaries:
        assert s.principle_count == 2
        assert s.rule_count == 3
        assert s.decision_tree_count == 1

    # Old N+1 code: 1 (list) + 5 modules * 3 count queries = 16 queries.
    # Fixed code: 1 (list) + 1 (batched counts) = 2 queries.
    # Assert well under what N+1 would produce, regardless of exact count.
    assert counter.count <= 4, (
        f"Expected a small, module-count-independent number of queries, "
        f"got {counter.count} — looks like the N+1 pattern regressed."
    )


@pytest.mark.asyncio
async def test_search_counts_are_correct_and_query_count_is_bounded(seeded_engine):
    from src.api.routes.search import search

    engine, session_factory, module_ids = seeded_engine
    async with session_factory() as session:
        with _QueryCounter(engine) as counter:
            response = await search(
                q="searchterm", department=None, max_results=10, session=session,
            )

    assert response.total == 5
    for r in response.results:
        assert r.module.principle_count == 2
        assert r.module.rule_count == 3
        assert r.module.decision_tree_count == 1

    # Old N+1 code: 1 (module search) + 5 * 3 count queries + 1 (principle
    # search) = 17+ queries. Fixed code: module search + 1 batched-counts
    # query + principle search (no unseen modules here) = 3 queries.
    assert counter.count <= 6, (
        f"Expected a small, module-count-independent number of queries, "
        f"got {counter.count} — looks like the N+1 pattern regressed."
    )
