"""
BCOS Platform — Knowledge Loader

Recursively walks the Business Context/ directory, parses each Markdown file,
and extracts structured knowledge (principles, rules, decision trees, cross-refs, source attribution).
Guarantees unique slugs across all modules using relative file path slugifying.
"""

import re
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Set

import structlog

from ..config import settings

logger = structlog.get_logger("bcos.loader")


@dataclass
class ParsedPrinciple:
    title: str
    description: str
    source_quote: str = ""
    context: str = ""
    order_index: int = 0


@dataclass
class ParsedRule:
    rule_type: str  # Always | Never | Avoid | Prefer
    statement: str
    reasoning: str = ""
    context: str = ""
    order_index: int = 0


@dataclass
class ParsedDecisionTree:
    name: str
    condition: str
    action: str
    otherwise: str = ""
    context: str = ""
    order_index: int = 0


@dataclass
class ParsedCrossRef:
    target_name: str
    target_slug: str
    relationship_type: str = "related_to"
    description: str = ""


@dataclass
class ParsedModule:
    name: str
    slug: str
    department: str
    description: str
    purpose: str
    file_path: str
    raw_content: str
    source_attribution: str = ""
    principles: List[ParsedPrinciple] = field(default_factory=list)
    rules: List[ParsedRule] = field(default_factory=list)
    decision_trees: List[ParsedDecisionTree] = field(default_factory=list)
    cross_references: List[ParsedCrossRef] = field(default_factory=list)


class KnowledgeLoader:
    def __init__(self, base_path: Optional[str] = None):
        self.base_path = Path(base_path or settings.KNOWLEDGE_BASE_PATH)
        self.modules: Dict[str, ParsedModule] = {}
        self._assigned_slugs: Set[str] = set()
        self._stats = {
            "files_scanned": 0,
            "modules_parsed": 0,
            "principles_extracted": 0,
            "rules_extracted": 0,
            "decision_trees_extracted": 0,
            "cross_refs_extracted": 0,
            "errors": 0,
        }

    def load_all(self) -> List[ParsedModule]:
        logger.info("Starting knowledge load", base_path=str(self.base_path))

        if not self.base_path.exists():
            logger.error("Knowledge base path does not exist", path=str(self.base_path))
            return []

        parsed_modules = []
        self._assigned_slugs.clear()

        # Recursive search for all .md files in the knowledge base
        for md_file in sorted(self.base_path.rglob("*.md")):
            # Skip meta files
            if md_file.name.lower() in (
                "orchestrator.md",
                "index.md",
                "schema.md",
                "changelog.md",
                "start.md",
                "readme.md",
            ):
                logger.info("Skipping meta-file", file=md_file.name)
                continue

            # Determine department from parent folder
            try:
                rel = md_file.relative_to(self.base_path)
                department = rel.parts[0] if len(rel.parts) > 1 else "General"
            except ValueError:
                department = "General"

            self._stats["files_scanned"] += 1
            parsed = self._parse_file(md_file, department)
            if parsed:
                parsed_modules.append(parsed)
                self.modules[parsed.slug] = parsed

        logger.info(
            "Knowledge load complete",
            modules=len(parsed_modules),
            **self._stats,
        )
        return parsed_modules

    def _parse_file(self, file_path: Path, department: str) -> Optional[ParsedModule]:
        try:
            content = file_path.read_text(encoding="utf-8")
        except Exception as e:
            logger.error("Failed to read file", file=str(file_path), error=str(e))
            self._stats["errors"] += 1
            return None

        name_match = re.search(r"^#\s+(.+?)$", content, re.MULTILINE)
        name = name_match.group(1).strip() if name_match else file_path.stem.replace("_", " ")

        # Create unique slug based on relative path
        try:
            rel_str = str(file_path.relative_to(self.base_path)).replace(".md", "")
            base_slug = self._slugify(rel_str)
        except ValueError:
            base_slug = self._slugify(f"{department}-{file_path.stem}")

        if not base_slug:
            base_slug = "module"

        slug = base_slug
        counter = 2
        while slug in self._assigned_slugs:
            slug = f"{base_slug}-{counter}"
            counter += 1

        self._assigned_slugs.add(slug)

        sections = self._extract_sections(content)
        description = self._extract_description(content)
        purpose = sections.get("purpose", "")
        source_attribution = self._extract_source_attribution(content)

        principles = self._parse_principles(sections)
        rules = self._parse_rules(sections)
        decision_trees = self._parse_decision_trees(sections)
        cross_refs = self._parse_cross_references(sections)

        self._stats["modules_parsed"] += 1
        self._stats["principles_extracted"] += len(principles)
        self._stats["rules_extracted"] += len(rules)
        self._stats["decision_trees_extracted"] += len(decision_trees)
        self._stats["cross_refs_extracted"] += len(cross_refs)

        try:
            rel_path = str(file_path.relative_to(self.base_path))
        except ValueError:
            rel_path = str(file_path)

        return ParsedModule(
            name=name,
            slug=slug,
            department=department,
            description=description,
            purpose=purpose,
            file_path=rel_path,
            raw_content=content,
            source_attribution=source_attribution,
            principles=principles,
            rules=rules,
            decision_trees=decision_trees,
            cross_references=cross_refs,
        )

    def _extract_source_attribution(self, content: str) -> str:
        match = re.search(r"(?:\*|_)?Source[:\s]+(?:\*|_)?(.+?)(?:\*|_)?(?:\n|$)", content, re.IGNORECASE)
        return match.group(1).strip() if match else ""

    def _extract_sections(self, content: str) -> Dict[str, str]:
        sections: Dict[str, str] = {}
        current_section: Optional[str] = None
        current_lines: List[str] = []

        for line in content.split("\n"):
            if line.startswith("## "):
                if current_section is not None:
                    sections[current_section] = "\n".join(current_lines).strip()
                current_section = self._normalize_section(line[3:].strip())
                current_lines = []
            elif current_section is not None:
                current_lines.append(line)

        if current_section is not None:
            sections[current_section] = "\n".join(current_lines).strip()

        return sections

    def _normalize_section(self, heading: str) -> str:
        heading_lower = heading.lower().strip()
        mappings = {
            "purpose": "purpose",
            "core purpose": "purpose",
            "overview": "purpose",
            "principles": "principles",
            "core principles": "principles",
            "key principles": "principles",
            "guiding principles": "principles",
            "rules": "rules",
            "business rules": "rules",
            "operational rules": "rules",
            "decision frameworks": "decision_frameworks",
            "decision trees": "decision_frameworks",
            "frameworks": "decision_frameworks",
            "see also": "see_also",
            "related modules": "see_also",
            "cross-references": "see_also",
        }
        return mappings.get(heading_lower, heading_lower.replace(" ", "_"))

    def _extract_description(self, content: str) -> str:
        lines = content.split("\n")
        past_title = False
        desc_lines: List[str] = []

        for line in lines:
            if not past_title:
                if line.startswith("# "):
                    past_title = True
                continue

            if not desc_lines and not line.strip():
                continue

            if line.startswith("#") or (desc_lines and not line.strip()):
                break

            desc_lines.append(line)

        return " ".join(desc_lines).strip()

    def _parse_principles(self, sections: Dict[str, str]) -> List[ParsedPrinciple]:
        content = sections.get("principles", "")
        if not content.strip():
            return []

        principles = []
        pattern = r"(?:^|\n)\s*(?:\d+\.\s*|\*\s*|-\s*)\*\*(.+?)\*\*[:\s—–-]*(.+?)(?=\n\s*(?:\d+\.|\*|-)\s*\*\*|\n\n|\Z)"
        matches = re.findall(pattern, content, re.DOTALL)

        for idx, (title, description) in enumerate(matches):
            principles.append(
                ParsedPrinciple(
                    title=title.strip(),
                    description=description.strip(),
                    order_index=idx,
                )
            )

        if not principles:
            items = re.split(r"\n\s*(?:\d+\.|\*|-)\s+", content)
            for idx, item in enumerate(items):
                item = item.strip()
                if not item or len(item) < 10:
                    continue
                parts = re.split(r"[:\.\n]", item, maxsplit=1)
                title = parts[0].strip()
                desc = parts[1].strip() if len(parts) > 1 else title
                principles.append(
                    ParsedPrinciple(
                        title=title[:200],
                        description=desc,
                        order_index=idx,
                    )
                )

        return principles

    def _parse_rules(self, sections: Dict[str, str]) -> List[ParsedRule]:
        content = sections.get("rules", "")
        if not content.strip():
            return []

        rules = []
        idx = 0

        typed_pattern = r"\*\*(Always|Never|Avoid|Prefer)[:\s]*\*\*\s*(.+?)(?=\n\s*\*\*(?:Always|Never|Avoid|Prefer)|\n\n|\Z)"
        typed_matches = re.findall(typed_pattern, content, re.DOTALL | re.IGNORECASE)

        for rule_type, statement in typed_matches:
            rules.append(
                ParsedRule(
                    rule_type=rule_type.strip().capitalize(),
                    statement=statement.strip(),
                    order_index=idx,
                )
            )
            idx += 1

        if not rules:
            items = re.split(r"\n\s*[-*]\s+", content)
            for item in items:
                item = item.strip()
                if not item or len(item) < 5:
                    continue
                rule_type = "Prefer"
                lower = item.lower()
                if lower.startswith("always"):
                    rule_type = "Always"
                elif lower.startswith("never"):
                    rule_type = "Never"
                elif lower.startswith("avoid"):
                    rule_type = "Avoid"

                rules.append(
                    ParsedRule(
                        rule_type=rule_type,
                        statement=item,
                        order_index=idx,
                    )
                )
                idx += 1

        return rules

    def _parse_decision_trees(self, sections: Dict[str, str]) -> List[ParsedDecisionTree]:
        content = sections.get("decision_frameworks", "")
        if not content.strip():
            return []

        trees = []
        sub_sections = re.split(r"\n###\s+", content)

        for idx, section in enumerate(sub_sections):
            section = section.strip()
            if not section:
                continue

            lines = section.split("\n", 1)
            name = lines[0].strip().strip("*#")
            body = lines[1] if len(lines) > 1 else ""

            condition_match = re.search(r"(?:if|when|condition)[:\s]+(.+?)(?:\n|$)", body, re.IGNORECASE)
            action_match = re.search(r"(?:then|action|do)[:\s]+(.+?)(?:\n|$)", body, re.IGNORECASE)
            otherwise_match = re.search(r"(?:else|otherwise|fallback)[:\s]+(.+?)(?:\n|$)", body, re.IGNORECASE)

            trees.append(
                ParsedDecisionTree(
                    name=name,
                    condition=condition_match.group(1).strip() if condition_match else body[:200],
                    action=action_match.group(1).strip() if action_match else "",
                    otherwise=otherwise_match.group(1).strip() if otherwise_match else "",
                    order_index=idx,
                )
            )

        return trees

    def _parse_cross_references(self, sections: Dict[str, str]) -> List[ParsedCrossRef]:
        content = sections.get("see_also", "")
        if not content.strip():
            return []

        refs = []
        link_pattern = r"\[([^\]]+)\]\(([^)]+)\)"
        for name, path in re.findall(link_pattern, content):
            refs.append(
                ParsedCrossRef(
                    target_name=name.strip(),
                    target_slug=self._slugify(name.strip()),
                    relationship_type="related_to",
                )
            )

        return refs

    @staticmethod
    def _slugify(text: str) -> str:
        text = text.lower()
        text = re.sub(r"[^a-z0-9\s-]", "", text)
        text = re.sub(r"[\s-]+", "-", text)
        return text.strip("-")

    @property
    def stats(self) -> dict:
        return self._stats.copy()
