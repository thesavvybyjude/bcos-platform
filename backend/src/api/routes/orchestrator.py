"""
BCOS Platform — Orchestrator Routes

Routes user queries to relevant knowledge modules.
"""

from fastapi import APIRouter

from ...schemas import RouteRequest, RouteResponse, RoutedModule
from ...services.orchestrator import Orchestrator

router = APIRouter()

# Singleton orchestrator instance
_orchestrator = Orchestrator()


@router.post("/route", response_model=RouteResponse)
async def route_query(request: RouteRequest):
    """
    Route a natural language query to the most relevant modules.
    Uses routing rules from Orchestrator.md.
    """
    matches = _orchestrator.route(request.query, max_results=request.max_modules)

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
async def get_routing_rules():
    """List all active routing rules (from Orchestrator.md)."""
    if not _orchestrator._loaded:
        _orchestrator.load_rules()

    return {
        "total_rules": len(_orchestrator.rules),
        "rules": [
            {
                "category": r.category,
                "primary_module": r.primary_module,
                "secondary_modules": r.secondary_modules,
                "keywords": r.keywords,
                "department": r.department,
            }
            for r in _orchestrator.rules
        ],
    }


@router.post("/reload")
async def reload_rules():
    """Force-reload routing rules from Orchestrator.md."""
    count = _orchestrator.load_rules()
    return {"status": "reloaded", "rules_loaded": count}
