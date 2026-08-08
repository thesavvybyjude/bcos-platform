"""
BCOS Platform — Context Compilation Routes

Compiles AI-ready context packages from modules.
"""

from fastapi import APIRouter, Depends

from ...core.database import get_session
from ...schemas import CompileRequest, CompiledContext
from ...services.context_compiler import ContextCompiler

router = APIRouter()


@router.post("/compile")
async def compile_context(request: CompileRequest, session=Depends(get_session)):
    """
    Compile a context package from specified modules or a query.

    Accepts either:
    - `module_slugs`: explicit list of modules to include
    - `query`: natural language query (routes via Orchestrator first)
    """
    compiler = ContextCompiler(session)

    if request.module_slugs:
        result = await compiler.compile_by_slugs(
            slugs=request.module_slugs,
            max_principles=request.max_principles,
            max_rules=request.max_rules,
            include_cross_refs=request.include_cross_refs,
            output_format=request.output_format,
        )
    elif request.query:
        result = await compiler.compile_by_query(
            query=request.query,
            max_principles=request.max_principles,
            max_rules=request.max_rules,
            output_format=request.output_format,
        )
    else:
        return {
            "error": "Provide either 'query' or 'module_slugs'.",
            "compiled_markdown": "",
            "modules": [],
        }

    # Serialize modules to dict (can't return SQLAlchemy objects directly)
    serialized_modules = []
    for mod in result.get("modules", []):
        serialized_modules.append(
            {
                "name": mod.name,
                "slug": mod.slug,
                "department": mod.department,
                "description": mod.description,
                "principle_count": len(mod.principles),
                "rule_count": len(mod.rules),
                "decision_tree_count": len(mod.decision_trees),
            }
        )

    from ...models.webhook import WebhookEvent
    from ...services.webhook import trigger_webhooks

    await trigger_webhooks(
        db,
        event=WebhookEvent.CONTEXT_COMPILED,
        payload_data={
            "query": result.get("query"),
            "module_count": len(serialized_modules),
            "modules": [m["slug"] for m in serialized_modules],
        },
    )

    return {
        "query": result.get("query"),
        "compiled_markdown": result.get("compiled_markdown", ""),
        "modules": serialized_modules,
        "total_principles": result.get("total_principles", 0),
        "total_rules": result.get("total_rules", 0),
        "total_decision_trees": result.get("total_decision_trees", 0),
    }
