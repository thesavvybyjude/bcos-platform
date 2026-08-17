"""
BCOS Platform — Orchestrator Routes

Routes user queries to relevant knowledge modules.
"""

from functools import lru_cache

from fastapi import APIRouter, Depends

from ...schemas import RouteRequest, RouteResponse, RoutedModule
from ...services.orchestrator import Orchestrator

router = APIRouter()


@lru_cache(maxsize=1)
def get_orchestrator() -> Orchestrator:
    """Cached per-process Orchestrator instance.

    NOTE: this is process-local. Under `--workers N`, each worker holds its
    own instance and its own rule cache — `POST /reload` only reloads the
    worker that handled the request. If/when this runs with multiple
    workers, rule reload needs to be broadcast (e.g. via Redis pub/sub or a
    file-mtime check on each request) rather than relying on this cache.
    Using a lazy factory (vs. a bare module-level singleton) at least
    ensures a parse failure in Orchestrator.md raises on first request
    instead of crashing the whole app at import time.
    """
    return Orchestrator()


@router.post("/route", response_model=RouteResponse)
async def route_query(
    request: RouteRequest, orchestrator: Orchestrator = Depends(get_orchestrator)
):
    """
    Route a natural language query to the most relevant modules.
    Uses routing rules from Orchestrator.md.
    """
    matches = orchestrator.route(request.query, max_results=request.max_modules)

    routed = [
        RoutedModule(
            module_name=m.module_name,
            department=m.department,
            role=m.role,
            relevance_score=m.relevance_score,
            matched_keywords=m.matched_keywords,
        )
        for m in matches
    ]

    suggestion = ""
    if routed:
        primary = next((r for r in routed if r.role == "primary"), routed[0])
        suggestion = (
            f"Based on your query, the primary module is "
            f"'{primary.module_name}' in the {primary.department} department."
        )
    else:
        suggestion = "No modules matched your query. Try different keywords."

    return RouteResponse(
        query=request.query,
        routed_modules=routed,
        suggestion=suggestion,
    )


@router.get("/rules")
async def get_routing_rules(orchestrator: Orchestrator = Depends(get_orchestrator)):
    """List all active routing rules (from Orchestrator.md)."""
    if not orchestrator._loaded:
        orchestrator.load_rules()

    return {
        "total_rules": len(orchestrator.rules),
        "rules": [
            {
                "category": r.category,
                "primary_module": r.primary_module,
                "secondary_modules": r.secondary_modules,
                "keywords": r.keywords,
                "department": r.department,
            }
            for r in orchestrator.rules
        ],
    }


@router.post("/reload")
async def reload_rules(orchestrator: Orchestrator = Depends(get_orchestrator)):
    """Force-reload routing rules from Orchestrator.md (current worker only — see get_orchestrator)."""
    count = orchestrator.load_rules()
    return {"status": "reloaded", "rules_loaded": count}
