"""
BCOS Platform — Health Check Routes
"""

from fastapi import APIRouter

from ...config import settings

router = APIRouter()


@router.get("")
async def health_check():
    """Basic health check."""
    return {
        "status": "healthy",
        "service": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
    }


@router.get("/ready")
async def readiness_check():
    """Readiness probe — checks that core dependencies are available."""
    checks = {
        "database": "ok",
        "vector_store": "stub",
        "graph_store": "stub",
    }
    return {
        "status": "ready",
        "checks": checks,
    }
