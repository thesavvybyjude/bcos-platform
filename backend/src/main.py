"""
BCOS Platform — FastAPI Application

The main entry point for the BCOS backend API.
Mounts all routes, configures middleware, and handles startup/shutdown lifecycle.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import select

from .api.routes import api_keys, auth, context, graph, health, modules, orchestrator, search, users
from .config import settings
from .core.database import async_session_maker, init_database
from .core.logging import setup_logging
from .core.security import get_password_hash
from .models.user import User, UserRole

# Initialize logging
logger = setup_logging("DEBUG" if settings.DEBUG else "INFO")


async def init_superuser():
    """Bootstrap default superuser if database has no users."""
    async with async_session_maker() as db:
        res = await db.execute(select(User).limit(1))
        existing_user = res.scalar_one_or_none()
        if not existing_user and settings.FIRST_SUPERUSER_EMAIL:
            admin = User(
                email=settings.FIRST_SUPERUSER_EMAIL.lower(),
                hashed_password=get_password_hash(settings.FIRST_SUPERUSER_PASSWORD),
                full_name="System Admin",
                role=UserRole.ADMIN,
                is_superuser=True,
                is_active=True,
            )
            db.add(admin)
            await db.commit()
            logger.info("Created initial superuser", email=settings.FIRST_SUPERUSER_EMAIL)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle: startup and shutdown hooks."""
    # ── Startup ──
    logger.info(
        "Starting BCOS Platform",
        version=settings.APP_VERSION,
        environment=settings.ENVIRONMENT,
    )

    # Initialize database tables
    await init_database()
    logger.info("Database initialized")

    # Bootstrap default superuser
    await init_superuser()

    # Log knowledge base path
    logger.info("Knowledge base path", path=settings.KNOWLEDGE_BASE_PATH)

    logger.info("BCOS Platform ready", docs="/api/docs")

    yield

    # ── Shutdown ──
    logger.info("Shutting down BCOS Platform")


# Create FastAPI app
app = FastAPI(
    title="BCOS Platform API",
    description=(
        "Business Context Operating System — "
        "Knowledge Management & Context Serving Platform.\n\n"
        "The BCOS Platform ingests structured business knowledge from Markdown files, "
        "parses them into queryable data, and serves them through a REST API, "
        "semantic search, and knowledge graph."
    ),
    version=settings.APP_VERSION,
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
    lifespan=lifespan,
)

# ── Middleware ──

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routes ──

app.include_router(health.router, prefix="/api/health", tags=["Health"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/users", tags=["Users"])
app.include_router(api_keys.router, prefix="/api/api-keys", tags=["API Keys"])
app.include_router(modules.router, prefix="/api/modules", tags=["Modules"])
app.include_router(search.router, prefix="/api/search", tags=["Search"])
app.include_router(orchestrator.router, prefix="/api/orchestrator", tags=["Orchestrator"])
app.include_router(context.router, prefix="/api/context", tags=["Context"])
app.include_router(graph.router, prefix="/api/graph", tags=["Graph"])


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint — platform info."""
    return {
        "name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "status": "operational",
        "docs": "/api/docs",
        "endpoints": {
            "modules": "/api/modules",
            "search": "/api/search",
            "orchestrator": "/api/orchestrator/route",
            "context": "/api/context/compile",
            "graph": "/api/graph/data",
            "health": "/api/health",
        },
    }
