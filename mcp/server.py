"""
BCOS Platform — Model Context Protocol (MCP) Server

Exposes the complete BCOS Knowledge Base, Context Engine, and Routing Brain to AI agents
(Claude Desktop, Cursor, Custom Agents, n8n, LangChain).

Full 9-Tool Suite:
1. route_bcos_query
2. get_bcos_module
3. compile_bcos_context
4. search_bcos_knowledge
5. list_bcos_departments
6. get_bcos_decision_tree
7. get_bcos_principles
8. get_bcos_rules
9. get_bcos_statistics

Resource:
- bcos://knowledge (Full Knowledge Base Catalog)
"""

import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional

# Add parent directory / backend to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

import mcp.types as types
from mcp.server import Server
from mcp.server.stdio import stdio_server

from src.config import settings
from src.services.knowledge_loader import KnowledgeLoader, ParsedModule
from src.services.orchestrator import Orchestrator

orchestrator = Orchestrator(settings.KNOWLEDGE_BASE_PATH)
loader = KnowledgeLoader(settings.KNOWLEDGE_BASE_PATH)

# Cache loaded modules
_modules_cache: Optional[List[ParsedModule]] = None


def get_loaded_modules() -> List[ParsedModule]:
    global _modules_cache
    if _modules_cache is None:
        _modules_cache = loader.load_all()
    return _modules_cache


# ── MCP Request Handlers ──

async def handle_list_resources(ctx, params) -> types.ListResourcesResult:
    return types.ListResourcesResult(
        resources=[
            types.Resource(
                uri="bcos://knowledge",
                name="BCOS Knowledge Base Catalog",
                description="Complete structured catalog of all 249+ business context modules, departments, principles, and rules.",
                mimeType="application/json",
            )
        ]
    )


async def handle_read_resource(ctx, params: types.ReadResourceRequestParams) -> types.ReadResourceResult:
    uri = str(params.uri)
    if uri == "bcos://knowledge":
        modules = get_loaded_modules()
        catalog = [
            {
                "name": m.name,
                "slug": m.slug,
                "department": m.department,
                "description": m.description,
                "purpose": m.purpose,
                "principles_count": len(m.principles),
                "rules_count": len(m.rules),
                "decision_trees_count": len(m.decision_trees),
                "cross_references_count": len(m.cross_references),
            }
            for m in modules
        ]
        return types.ReadResourceResult(
            contents=[
                types.TextResourceContents(
                    uri=uri,
                    mimeType="application/json",
                    text=json.dumps(catalog, indent=2),
                )
            ]
        )
    raise ValueError(f"Resource not found: {uri}")


async def handle_list_tools(ctx, params) -> types.ListToolsResult:
    tools = [
        types.Tool(
            name="route_bcos_query",
            description="Route a natural language business query to relevant BCOS knowledge modules.",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The natural language query or problem statement."
                    },
                    "max_modules": {
                        "type": "integer",
                        "description": "Maximum number of modules to return.",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        ),
        types.Tool(
            name="get_bcos_module",
            description="Retrieve complete BCOS module content, principles, rules, and decision trees by slug or name.",
            inputSchema={
                "type": "object",
                "properties": {
                    "module_slug": {
                        "type": "string",
                        "description": "The slug or exact name of the module."
                    },
                    "include_principles": {
                        "type": "boolean",
                        "default": True
                    },
                    "include_rules": {
                        "type": "boolean",
                        "default": True
                    }
                },
                "required": ["module_slug"]
            }
        ),
        types.Tool(
            name="compile_bcos_context",
            description="Compile unified, prompt-optimized context for a business scenario or list of module slugs.",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Business query to build context for."
                    },
                    "module_slugs": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "Optional list of module slugs to explicitly include."
                    },
                    "format": {
                        "type": "string",
                        "enum": ["markdown", "json"],
                        "default": "markdown"
                    }
                },
                "required": ["query"]
            }
        ),
        types.Tool(
            name="search_bcos_knowledge",
            description="Perform semantic keyword & concept search across all BCOS knowledge modules.",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search query."
                    },
                    "limit": {
                        "type": "integer",
                        "default": 5
                    }
                },
                "required": ["query"]
            }
        ),
        types.Tool(
            name="list_bcos_departments",
            description="List all 64+ departments in BCOS with module counts.",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
        types.Tool(
            name="get_bcos_decision_tree",
            description="Retrieve decision trees and frameworks for a given module.",
            inputSchema={
                "type": "object",
                "properties": {
                    "module_slug": {
                        "type": "string",
                        "description": "Target module slug."
                    },
                    "tree_name": {
                        "type": "string",
                        "description": "Optional filter for specific tree name."
                    }
                },
                "required": ["module_slug"]
            }
        ),
        types.Tool(
            name="get_bcos_principles",
            description="Extract business principles from a module or search term.",
            inputSchema={
                "type": "object",
                "properties": {
                    "module_slug": {
                        "type": "string",
                        "description": "Optional module slug filter."
                    },
                    "limit": {
                        "type": "integer",
                        "default": 10
                    }
                }
            }
        ),
        types.Tool(
            name="get_bcos_rules",
            description="Extract color-coded business rules (Always, Never, Avoid, Prefer) from a module.",
            inputSchema={
                "type": "object",
                "properties": {
                    "module_slug": {
                        "type": "string",
                        "description": "Optional module slug filter."
                    },
                    "rule_type": {
                        "type": "string",
                        "enum": ["Always", "Never", "Avoid", "Prefer"],
                        "description": "Filter by rule constraint type."
                    }
                }
            }
        ),
        types.Tool(
            name="get_bcos_statistics",
            description="Get knowledge base statistics (total modules, principles, rules, departments, cross-references).",
            inputSchema={
                "type": "object",
                "properties": {}
            }
        ),
    ]
    return types.ListToolsResult(tools=tools)


async def handle_call_tool(ctx, params: types.CallToolRequestParams) -> types.CallToolResult:
    name = params.name
    arguments = params.arguments or {}
    modules = get_loaded_modules()

    if name == "route_bcos_query":
        query = str(arguments.get("query", ""))
        max_mods = int(arguments.get("max_modules", 5))
        matches = orchestrator.route(query, max_results=max_mods)

        result_text = f"# BCOS Routing Results\nQuery: '{query}'\n\n"
        for m in matches:
            result_text += f"- **[{m.role.upper()}] {m.module_name}** (`{m.department}`) — Relevance: {m.relevance_score:.2f}\n"

        return types.CallToolResult(content=[types.TextContent(type="text", text=result_text)])

    elif name == "get_bcos_module":
        slug = str(arguments.get("module_slug", ""))
        inc_p = bool(arguments.get("include_principles", True))
        inc_r = bool(arguments.get("include_rules", True))

        matched = next((m for m in modules if m.slug == slug or m.name.lower() == slug.lower()), None)
        if not matched:
            return types.CallToolResult(content=[types.TextContent(type="text", text=f"Module '{slug}' not found.")])

        output = [
            f"# {matched.name}",
            f"**Department:** {matched.department}",
            f"**Slug:** `{matched.slug}`\n",
            f"## Purpose\n{matched.purpose or matched.description}\n",
        ]

        if inc_p and matched.principles:
            output.append("## Key Principles")
            for p in matched.principles:
                output.append(f"- **{p.title}**: {p.description}")
            output.append("")

        if inc_r and matched.rules:
            output.append("## Business Rules")
            for r in matched.rules:
                output.append(f"- **[{r.rule_type}]**: {r.statement} *(Reasoning: {r.reasoning or 'N/A'})*")
            output.append("")

        if matched.decision_trees:
            output.append("## Decision Frameworks")
            for dt in matched.decision_trees:
                output.append(f"- **{dt.name}**: IF `{dt.condition}` THEN `{dt.action}` OTHERWISE `{dt.otherwise}`")
            output.append("")

        if matched.cross_references:
            output.append("## Cross References")
            for cr in matched.cross_references:
                output.append(f"- → `{cr.target_slug}` ({cr.relationship_type})")

        return types.CallToolResult(content=[types.TextContent(type="text", text="\n".join(output))])

    elif name == "compile_bcos_context":
        query = str(arguments.get("query", ""))
        specified_slugs = arguments.get("module_slugs", [])
        fmt = str(arguments.get("format", "markdown"))

        selected_modules = []
        if specified_slugs:
            for s in specified_slugs:
                found = next((m for m in modules if m.slug == s), None)
                if found:
                    selected_modules.append(found)
        else:
            matches = orchestrator.route(query, max_results=3)
            for match in matches:
                found = next((mod for mod in modules if mod.name == match.module_name), None)
                if found:
                    selected_modules.append(found)

        if fmt == "json":
            data = [
                {
                    "name": m.name,
                    "department": m.department,
                    "description": m.description,
                    "principles": [{"title": p.title, "description": p.description} for p in m.principles],
                    "rules": [{"type": r.rule_type, "statement": r.statement} for r in m.rules],
                }
                for m in selected_modules
            ]
            return types.CallToolResult(content=[types.TextContent(type="text", text=json.dumps(data, indent=2))])

        compiled_parts = [f"# BCOS Compiled Context\n**Query:** {query}\n\n"]
        for m in selected_modules:
            compiled_parts.append(f"## Module: {m.name} ({m.department})")
            compiled_parts.append(f"{m.purpose or m.description}\n")
            if m.principles:
                compiled_parts.append("### Principles:")
                for p in m.principles:
                    compiled_parts.append(f"- **{p.title}**: {p.description}")
            if m.rules:
                compiled_parts.append("### Rules:")
                for r in m.rules:
                    compiled_parts.append(f"- **[{r.rule_type}]**: {r.statement}")
            compiled_parts.append("\n---\n")

        return types.CallToolResult(content=[types.TextContent(type="text", text="\n".join(compiled_parts))])

    elif name == "search_bcos_knowledge":
        query = str(arguments.get("query", "")).lower()
        limit = int(arguments.get("limit", 5))

        results = []
        for m in modules:
            score = 0
            if query in m.name.lower():
                score += 10
            if query in m.description.lower() or query in m.purpose.lower():
                score += 5
            for p in m.principles:
                if query in p.title.lower() or query in p.description.lower():
                    score += 3
            for r in m.rules:
                if query in r.statement.lower():
                    score += 2
            if score > 0:
                results.append((score, m))

        results.sort(key=lambda x: x[0], reverse=True)
        top = results[:limit]

        output = [f"# Search Results for: '{query}'\n"]
        for score, m in top:
            output.append(f"- **{m.name}** (`{m.department}`) — Match Score: {score}")
            output.append(f"  *{m.description[:150]}...*")

        if not top:
            output.append("No matching modules found.")

        return types.CallToolResult(content=[types.TextContent(type="text", text="\n".join(output))])

    elif name == "list_bcos_departments":
        dept_counts: Dict[str, int] = {}
        for m in modules:
            dept_counts[m.department] = dept_counts.get(m.department, 0) + 1

        output = ["# BCOS Department Hierarchy\n"]
        for dept, count in sorted(dept_counts.items(), key=lambda x: x[1], reverse=True):
            output.append(f"- **{dept}**: {count} modules")

        return types.CallToolResult(content=[types.TextContent(type="text", text="\n".join(output))])

    elif name == "get_bcos_decision_tree":
        slug = str(arguments.get("module_slug", ""))
        tree_name = arguments.get("tree_name")

        matched = next((m for m in modules if m.slug == slug or m.name.lower() == slug.lower()), None)
        if not matched:
            return types.CallToolResult(content=[types.TextContent(type="text", text=f"Module '{slug}' not found.")])

        trees = matched.decision_trees
        if tree_name:
            tree_name_str = str(tree_name).lower()
            trees = [t for t in trees if tree_name_str in t.name.lower()]

        output = [f"# Decision Frameworks — {matched.name}\n"]
        for t in trees:
            output.append(f"### {t.name}")
            output.append(f"- **IF:** `{t.condition}`")
            output.append(f"- **THEN:** `{t.action}`")
            if t.otherwise:
                output.append(f"- **OTHERWISE:** `{t.otherwise}`")
            output.append("")

        if not trees:
            output.append("No decision trees found matching criteria.")

        return types.CallToolResult(content=[types.TextContent(type="text", text="\n".join(output))])

    elif name == "get_bcos_principles":
        slug = arguments.get("module_slug")
        limit = int(arguments.get("limit", 10))

        all_principles = []
        for m in modules:
            if slug and m.slug != slug and str(slug).lower() not in m.name.lower():
                continue
            for p in m.principles:
                all_principles.append((m.name, p))

        output = ["# BCOS Principles\n"]
        for mod_name, p in all_principles[:limit]:
            output.append(f"- **{p.title}** (*Module: {mod_name}*)")
            output.append(f"  {p.description}\n")

        return types.CallToolResult(content=[types.TextContent(type="text", text="\n".join(output))])

    elif name == "get_bcos_rules":
        slug = arguments.get("module_slug")
        rule_type = arguments.get("rule_type")

        all_rules = []
        for m in modules:
            if slug and m.slug != slug and str(slug).lower() not in m.name.lower():
                continue
            for r in m.rules:
                if rule_type and r.rule_type.lower() != str(rule_type).lower():
                    continue
                all_rules.append((m.name, r))

        output = ["# BCOS Business Rules\n"]
        for mod_name, r in all_rules:
            output.append(f"- **[{r.rule_type}]** {r.statement} (*Module: {mod_name}*)")

        return types.CallToolResult(content=[types.TextContent(type="text", text="\n".join(output))])

    elif name == "get_bcos_statistics":
        depts = set(m.department for m in modules)
        total_principles = sum(len(m.principles) for m in modules)
        total_rules = sum(len(m.rules) for m in modules)
        total_trees = sum(len(m.decision_trees) for m in modules)
        total_refs = sum(len(m.cross_references) for m in modules)

        stats = [
            "# BCOS Knowledge Base Statistics\n",
            f"- **Total Modules:** {len(modules)}",
            f"- **Total Departments:** {len(depts)}",
            f"- **Total Principles:** {total_principles}",
            f"- **Total Rules:** {total_rules}",
            f"- **Total Decision Trees:** {total_trees}",
            f"- **Total Cross References:** {total_refs}",
        ]
        return types.CallToolResult(content=[types.TextContent(type="text", text="\n".join(stats))])

    raise ValueError(f"Unknown tool: {name}")


# Initialize MCP server
app = Server(
    "bcos-mcp-server",
    on_list_resources=handle_list_resources,
    on_read_resource=handle_read_resource,
    on_list_tools=handle_list_tools,
    on_call_tool=handle_call_tool,
)


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        modules = get_loaded_modules()
        print(f"BCOS MCP Test Mode: Successfully loaded {len(modules)} knowledge modules across {len(set(m.department for m in modules))} departments.")
    else:
        asyncio.run(main())
