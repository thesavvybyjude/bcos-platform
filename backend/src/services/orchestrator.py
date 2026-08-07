"""
BCOS Platform — Full Master Orchestrator.md Parser

Parses the 1,500+ line Orchestrator.md master routing brain.
Extracts:
1. Master Routing Tables (| Query Category | Primary Module | Secondary Module(s) | Notes |)
2. Heading-based rules (### Category)
3. Module Dependency Graph (## Module Dependency Graph)
4. Department-level fallback routing
"""

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import structlog

from ..config import settings

logger = structlog.get_logger("bcos.orchestrator")


@dataclass
class RoutingRule:
    category: str
    primary_module: str
    secondary_modules: List[str] = field(default_factory=list)
    keywords: List[str] = field(default_factory=list)
    patterns: List[str] = field(default_factory=list)
    department: str = ""
    description: str = ""
    notes: str = ""


@dataclass
class DependencyNode:
    module_name: str
    depends_on: List[str] = field(default_factory=list)
    required_by: List[str] = field(default_factory=list)


@dataclass
class RouteMatch:
    module_name: str
    department: str
    role: str  # primary | secondary
    relevance_score: float
    matched_keywords: List[str] = field(default_factory=list)


class Orchestrator:
    """
    Routes queries to relevant modules using rules from Orchestrator.md.
    Supports parsing tables, headings, bullets, and dependency graphs.
    """

    def __init__(self, base_path: Optional[str] = None):
        self.base_path = Path(base_path or settings.KNOWLEDGE_BASE_PATH)
        self.rules: List[RoutingRule] = []
        self.dependencies: Dict[str, DependencyNode] = {}
        self._loaded = False

    def load_rules(self) -> int:
        """Parse Orchestrator.md and extract all routing rules and dependencies."""
        orchestrator_path = self.base_path / "Orchestrator.md"

        if not orchestrator_path.exists():
            logger.warning(
                "Orchestrator.md not found, using fallback routing",
                path=str(orchestrator_path),
            )
            self._load_fallback_rules()
            self._loaded = True
            return len(self.rules)

        try:
            content = orchestrator_path.read_text(encoding="utf-8")
            self.rules = self._parse_full_orchestrator(content)
            self.dependencies = self._parse_dependency_graph(content)
            self._loaded = True
            logger.info("Master Orchestrator rules loaded", count=len(self.rules), dependencies=len(self.dependencies))
            return len(self.rules)
        except Exception as e:
            logger.error("Failed to parse Orchestrator.md", error=str(e))
            self._load_fallback_rules()
            self._loaded = True
            return len(self.rules)

    def route(self, query: str, max_results: int = 5) -> List[RouteMatch]:
        """Route a query to the most relevant modules."""
        if not self._loaded:
            self.load_rules()

        query_lower = query.lower()
        matches: List[RouteMatch] = []
        seen_modules: set = set()

        for rule in self.rules:
            score, matched_kw = self._score_rule(query_lower, rule)
            if score > 0:
                if rule.primary_module not in seen_modules:
                    matches.append(
                        RouteMatch(
                            module_name=rule.primary_module,
                            department=rule.department or "General",
                            role="primary",
                            relevance_score=score,
                            matched_keywords=matched_kw,
                        )
                    )
                    seen_modules.add(rule.primary_module)

                for sec in rule.secondary_modules:
                    if sec and sec not in seen_modules:
                        matches.append(
                            RouteMatch(
                                module_name=sec,
                                department=rule.department or "General",
                                role="secondary",
                                relevance_score=score * 0.6,
                                matched_keywords=matched_kw,
                            )
                        )
                        seen_modules.add(sec)

        matches.sort(key=lambda m: m.relevance_score, reverse=True)
        return matches[:max_results]

    def _score_rule(self, query_lower: str, rule: RoutingRule) -> Tuple[float, List[str]]:
        score = 0.0
        matched_keywords = []

        for kw in rule.keywords:
            if kw and kw.lower() in query_lower:
                score += 1.0
                matched_keywords.append(kw)

        for pattern in rule.patterns:
            try:
                if re.search(pattern, query_lower, re.IGNORECASE):
                    score += 2.0
                    matched_keywords.append(f"pattern:{pattern}")
            except re.error:
                continue

        if rule.category.lower() in query_lower:
            score += 0.5

        return score, matched_keywords

    def _parse_full_orchestrator(self, content: str) -> List[RoutingRule]:
        rules: List[RoutingRule] = []

        # 1. Parse Master Markdown Table (| Query Category | Primary Module | Secondary Module(s) | Notes |)
        table_rules = self._parse_table_rules(content)
        if table_rules:
            rules.extend(table_rules)

        # 2. Parse Heading-based blocks (### Category Name)
        heading_rules = self._parse_heading_rules(content)
        if heading_rules:
            rules.extend(heading_rules)

        # 3. Parse Bullet-based patterns (- **Module** -> keywords)
        bullet_rules = self._parse_bullet_rules(content)
        if bullet_rules:
            rules.extend(bullet_rules)

        # Deduplicate
        seen = set()
        unique_rules = []
        for r in rules:
            if r.primary_module not in seen:
                unique_rules.append(r)
                seen.add(r.primary_module)

        return unique_rules

    def _parse_table_rules(self, content: str) -> List[RoutingRule]:
        rules = []
        # Find markdown table rows
        rows = re.findall(r"^\|(.+?)\|(.+?)\|(.+?)\|(?:(.+?)\|)?$", content, re.MULTILINE)
        for cols in rows:
            clean_cols = [c.strip() for c in cols if c.strip()]
            if not clean_cols or clean_cols[0].lower() in ("category", "query category", "---") or "---" in clean_cols[0]:
                continue

            category = clean_cols[0]
            primary = clean_cols[1] if len(clean_cols) > 1 else ""
            secondary_raw = clean_cols[2] if len(clean_cols) > 2 else ""
            notes = clean_cols[3] if len(clean_cols) > 3 else ""

            secondary = [s.strip() for s in secondary_raw.split(",") if s.strip()]
            keywords = [k.strip().lower() for k in re.split(r"[\s,;&]+", category) if len(k) > 2]

            if primary:
                rules.append(
                    RoutingRule(
                        category=category,
                        primary_module=primary,
                        secondary_modules=secondary,
                        keywords=keywords,
                        notes=notes,
                    )
                )

        return rules

    def _parse_heading_rules(self, content: str) -> List[RoutingRule]:
        rules = []
        sections = re.split(r"\n###\s+", content)

        for section in sections[1:]:
            lines = section.strip().split("\n")
            category = lines[0].strip()
            body = "\n".join(lines[1:])

            primary_match = re.search(r"\*\*(?:Primary|Module)[:\s]*\*\*\s*(.+?)(?:\n|$)", body, re.IGNORECASE)
            secondary_match = re.search(r"\*\*Secondary[:\s]*\*\*\s*(.+?)(?:\n|$)", body, re.IGNORECASE)
            keywords_match = re.search(r"\*\*Keywords?[:\s]*\*\*\s*(.+?)(?:\n|$)", body, re.IGNORECASE)
            dept_match = re.search(r"\*\*Department[:\s]*\*\*\s*(.+?)(?:\n|$)", body, re.IGNORECASE)

            if primary_match:
                primary = primary_match.group(1).strip()
                secondary = [s.strip() for s in secondary_match.group(1).split(",")] if secondary_match else []
                keywords = [k.strip().lower() for k in keywords_match.group(1).split(",")] if keywords_match else []
                dept = dept_match.group(1).strip() if dept_match else ""

                rules.append(
                    RoutingRule(
                        category=category,
                        primary_module=primary,
                        secondary_modules=secondary,
                        keywords=keywords,
                        department=dept,
                    )
                )

        return rules

    def _parse_bullet_rules(self, content: str) -> List[RoutingRule]:
        rules = []
        bullet_pattern = r"[-*]\s+\*\*(.+?)\*\*\s*(?:→|->|:)\s*(?:keywords?:\s*)?(.+?)(?:\n|$)"
        matches = re.findall(bullet_pattern, content, re.IGNORECASE)

        for module_name, keywords_str in matches:
            keywords = [k.strip().lower() for k in keywords_str.split(",")]
            rules.append(
                RoutingRule(
                    category=module_name,
                    primary_module=module_name.strip(),
                    keywords=keywords,
                )
            )

        return rules

    def _parse_dependency_graph(self, content: str) -> Dict[str, DependencyNode]:
        """Extract dependency graph relationships from ## Module Dependency Graph section."""
        graph: Dict[str, DependencyNode] = {}
        dep_section = re.search(r"## (?:Module )?Dependency Graph\n(.+?)(?=\n## |\Z)", content, re.DOTALL | re.IGNORECASE)
        if not dep_section:
            return graph

        section_text = dep_section.group(1)
        # Parse lines like: - **Module A** depends on: Module B, Module C
        matches = re.findall(r"[-*]\s+\*\*(.+?)\*\*\s+depends on[:\s]+(.+?)(?:\n|$)", section_text, re.IGNORECASE)
        for mod, deps_str in matches:
            mod_name = mod.strip()
            deps = [d.strip() for d in deps_str.split(",") if d.strip()]
            graph[mod_name] = DependencyNode(module_name=mod_name, depends_on=deps)

        return graph

    def _load_fallback_rules(self):
        logger.info("Loading fallback routing rules")
        if not self.base_path.exists():
            return

        for dept_dir in sorted(self.base_path.iterdir()):
            if not dept_dir.is_dir():
                continue
            department = dept_dir.name
            for md_file in sorted(dept_dir.glob("*.md")):
                module_name = md_file.stem
                keywords = [w.lower() for w in re.split(r"[\s&,]+", module_name) if len(w) > 2]
                self.rules.append(
                    RoutingRule(
                        category=department,
                        primary_module=module_name,
                        keywords=keywords,
                        department=department,
                    )
                )
