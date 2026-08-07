"""
BCOS Platform — Context Compiler

Builds AI-ready context packages from one or more modules.
Output format: Markdown (default) or JSON.

Design decisions:
- LLM compilation is DISABLED by default (pluggable mock interface).
- Raw Markdown is returned as-is, which AI agents can consume directly.
- Cross-referenced modules can be included up to 2 levels deep.
"""

from typing import Dict, List, Optional
from uuid import UUID

import structlog
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..models import CrossReference, DecisionTree, Module, Principle, Rule

logger = structlog.get_logger("bcos.compiler")


class ContextCompiler:
    """Compiles knowledge modules into AI-ready context packages."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def compile_by_slugs(
        self,
        slugs: List[str],
        max_principles: int = 10,
        max_rules: int = 10,
        include_cross_refs: bool = True,
        output_format: str = "markdown",
    ) -> Dict:
        """
        Compile context from a list of module slugs.
        Returns a dict with modules and compiled output.
        """
        # Fetch modules with all children
        stmt = (
            select(Module)
            .options(
                selectinload(Module.principles),
                selectinload(Module.rules),
                selectinload(Module.decision_trees),
                selectinload(Module.cross_references),
            )
            .where(Module.slug.in_(slugs))
        )
        result = await self.session.execute(stmt)
        modules = list(result.scalars().all())

        if not modules:
            return {
                "modules": [],
                "compiled_markdown": "No modules found for the given slugs.",
                "total_principles": 0,
                "total_rules": 0,
                "total_decision_trees": 0,
            }

        # If cross-refs requested, fetch referenced modules too
        if include_cross_refs:
            ref_slugs = set()
            for mod in modules:
                for ref in mod.cross_references:
                    if ref.target_module_slug not in slugs:
                        ref_slugs.add(ref.target_module_slug)

            if ref_slugs:
                ref_stmt = (
                    select(Module)
                    .options(
                        selectinload(Module.principles),
                        selectinload(Module.rules),
                    )
                    .where(Module.slug.in_(list(ref_slugs)))
                )
                ref_result = await self.session.execute(ref_stmt)
                ref_modules = list(ref_result.scalars().all())
                modules.extend(ref_modules)

        # Compile output
        if output_format == "markdown":
            compiled = self._compile_markdown(modules, max_principles, max_rules)
        else:
            compiled = ""  # JSON format handled by Pydantic serialization

        total_principles = sum(len(m.principles) for m in modules)
        total_rules = sum(len(m.rules) for m in modules)
        total_trees = sum(len(m.decision_trees) for m in modules)

        logger.info(
            "Context compiled",
            modules=len(modules),
            principles=total_principles,
            rules=total_rules,
        )

        return {
            "modules": modules,
            "compiled_markdown": compiled,
            "total_principles": total_principles,
            "total_rules": total_rules,
            "total_decision_trees": total_trees,
        }

    async def compile_by_query(
        self,
        query: str,
        max_modules: int = 3,
        max_principles: int = 10,
        max_rules: int = 10,
        output_format: str = "markdown",
    ) -> Dict:
        """
        Compile context by first routing the query, then fetching modules.
        This delegates to the Orchestrator for routing, then compiles.
        """
        from .orchestrator import Orchestrator

        orchestrator = Orchestrator()
        matches = orchestrator.route(query, max_results=max_modules)

        if not matches:
            return {
                "query": query,
                "modules": [],
                "compiled_markdown": f"No modules matched the query: '{query}'",
                "total_principles": 0,
                "total_rules": 0,
                "total_decision_trees": 0,
            }

        # Convert module names to slugs
        module_names = [m.module_name for m in matches]
        stmt = select(Module.slug).where(Module.name.in_(module_names))
        result = await self.session.execute(stmt)
        slugs = [row[0] for row in result.all()]

        if not slugs:
            # Try fuzzy matching by slug
            from . import KnowledgeLoader

            slugs = [KnowledgeLoader._slugify(name) for name in module_names]

        compiled = await self.compile_by_slugs(
            slugs=slugs,
            max_principles=max_principles,
            max_rules=max_rules,
            output_format=output_format,
        )
        compiled["query"] = query
        return compiled

    def _compile_markdown(
        self,
        modules: List[Module],
        max_principles: int,
        max_rules: int,
    ) -> str:
        """Render modules into a Markdown context package."""
        parts = []
        parts.append("# BCOS Context Package\n")
        parts.append(f"*Compiled from {len(modules)} module(s)*\n")
        parts.append("---\n")

        for mod in modules:
            parts.append(f"## {mod.name}")
            parts.append(f"**Department:** {mod.department}")
            parts.append("")

            if mod.description:
                parts.append(mod.description)
                parts.append("")

            if mod.purpose:
                parts.append(f"**Purpose:** {mod.purpose}")
                parts.append("")

            # Principles
            principles = sorted(mod.principles, key=lambda p: p.order_index)[
                :max_principles
            ]
            if principles:
                parts.append("### Principles")
                for p in principles:
                    parts.append(f"- **{p.title}**: {p.description}")
                parts.append("")

            # Rules
            rules = sorted(mod.rules, key=lambda r: r.order_index)[:max_rules]
            if rules:
                parts.append("### Rules")
                for r in rules:
                    parts.append(f"- **[{r.rule_type}]** {r.statement}")
                parts.append("")

            # Decision Trees
            trees = sorted(mod.decision_trees, key=lambda t: t.order_index)
            if trees:
                parts.append("### Decision Frameworks")
                for t in trees:
                    entry = f"- **{t.name}**"
                    if t.condition:
                        entry += f": If {t.condition}"
                    if t.action:
                        entry += f" → {t.action}"
                    parts.append(entry)
                parts.append("")

            # Cross-references
            if mod.cross_references:
                parts.append("### Related Modules")
                for ref in mod.cross_references:
                    parts.append(f"- {ref.target_module_slug} ({ref.relationship_type})")
                parts.append("")

            parts.append("---\n")

        return "\n".join(parts)
