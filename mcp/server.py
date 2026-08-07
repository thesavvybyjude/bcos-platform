"""
BCOS Platform — MCP Server

Exposes BCOS Platform capabilities as Model Context Protocol (MCP) tools and resources
for integration with AI agents (Claude Desktop, Cursor, Custom Agents).
"""

import asyncio
import os
import sys
from pathlib import Path
from typing import Any, Dict, List

# Add parent directory / backend to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "backend"))

try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    import mcp.types as types
except ImportError:
    # Basic fallback definitions if mcp SDK is not installed in local env
    print("Warning: mcp package not installed. Installing or running in mock mode.")
    Server = Any  # type: ignore
    types = Any  # type: ignore

from src.config import settings
from src.services.knowledge_loader import KnowledgeLoader
from src.services.orchestrator import Orchestrator


app = Server("bcos-mcp-server")
orchestrator = Orchestrator(settings.KNOWLEDGE_BASE_PATH)
loader = KnowledgeLoader(settings.KNOWLEDGE_BASE_PATH)


@app.list_tools()
async def handle_list_tools() -> List[Any]:
    return [
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
            description="Retrieve raw markdown content and details for a specific BCOS module by slug or name.",
            inputSchema={
                "type": "object",
                "properties": {
                    "module_slug": {
                        "type": "string",
                        "description": "The slug or exact name of the module."
                    }
                },
                "required": ["module_slug"]
            }
        ),
        types.Tool(
            name="compile_bcos_context",
            description="Compile AI-ready structured Markdown context for a business scenario or query.",
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Business query to build context for."
                    }
                },
                "required": ["query"]
            }
        )
    ]


@app.call_tool()
async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[Any]:
    if name == "route_bcos_query":
        query = arguments.get("query", "")
        max_mods = arguments.get("max_modules", 5)
        matches = orchestrator.route(query, max_results=max_mods)
        
        result_text = f"Routing results for: '{query}'\n\n"
        for m in matches:
            result_text += f"- [{m.role.upper()}] {m.module_name} ({m.department}) | Score: {m.relevance_score}\n"
        
        return [types.TextContent(type="text", text=result_text)]

    elif name == "get_bcos_module":
        slug = arguments.get("module_slug", "")
        modules = loader.load_all()
        matched = next((m for m in modules if m.slug == slug or m.name.lower() == slug.lower()), None)
        
        if matched:
            return [types.TextContent(type="text", text=matched.raw_content)]
        else:
            return [types.TextContent(type="text", text=f"Module '{slug}' not found.")]

    elif name == "compile_bcos_context":
        query = arguments.get("query", "")
        matches = orchestrator.route(query, max_results=3)
        modules = loader.load_all()
        
        compiled_parts = [f"# BCOS Context for: {query}\n"]
        for match in matches:
            m = next((mod for mod in modules if mod.name == match.module_name), None)
            if m:
                compiled_parts.append(f"## Module: {m.name} ({m.department})")
                compiled_parts.append(f"{m.description}\n")
                if m.principles:
                    compiled_parts.append("### Key Principles:")
                    for p in m.principles:
                        compiled_parts.append(f"- **{p.title}**: {p.description}")
                compiled_parts.append("\n---\n")

        return [types.TextContent(type="text", text="\n".join(compiled_parts))]

    raise ValueError(f"Unknown tool: {name}")


async def main():
    async with stdio_server() as (read_stream, write_stream):
        await app.run(
            read_stream,
            write_stream,
            app.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())
