# BCOS Platform — Architecture Analysis

## 1. System Architecture

### 1.1 Documented vs. Actual Architecture

The [`ARCHITECTURE.md`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/docs/ARCHITECTURE.md) describes a four-tier layered architecture with PostgreSQL, Neo4j, Chroma, and Redis. The **actual implementation** diverges significantly:

| Component | Documented | Actual |
|-----------|-----------|--------|
| PostgreSQL | Primary DB | ✅ Configured, but falls back to **SQLite** in practice |
| Neo4j | Knowledge graph queries | ⚠️ **Stub** — `GraphStore.is_available` returns `False` unless env vars set; all graph routes have SQL fallbacks |
| Chroma | Semantic vector search | ⚠️ **Stub** — `VectorStore` class exists but returns empty results; labeled "Phase 0" |
| Redis | Caching, rate limiting, sessions | ❌ **Not implemented at all** — zero Redis imports in application code despite `docker-compose.yml` and docs declaring it |

### 1.2 Entry Points

The system has **three entry points**:

1. **FastAPI Backend** ([`main.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/main.py)) — Port 8000
2. **Next.js Frontend** ([`layout.tsx`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/frontend/src/app/layout.tsx)) — Port 3000
3. **MCP Server** ([`mcp/server.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/mcp/server.py)) — stdio transport

### 1.3 Dependency Graph

```
┌────────────────────┐     ┌──────────────┐
│   Frontend (Next)  │────→│ Backend API  │
│   Port 3000        │     │ Port 8000    │
└────────────────────┘     └──────┬───────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
              ┌─────▼─────┐ ┌────▼────┐ ┌─────▼─────┐
              │ PostgreSQL │ │ Neo4j   │ │  Chroma   │
              │ (or SQLite)│ │ (stub)  │ │  (stub)   │
              └───────────┘ └─────────┘ └───────────┘

┌────────────────────┐
│   MCP Server       │────→ KnowledgeLoader + Orchestrator (direct, no API)
│   stdio transport  │
└────────────────────┘
```

> [!WARNING]
> The MCP server bypasses the entire API layer. It directly instantiates `KnowledgeLoader` and `Orchestrator` services, reading Markdown files at startup. This means MCP clients see a **different data snapshot** than API clients (who read from the database).

---

## 2. Module Architecture

### 2.1 Backend Package Structure

```
backend/src/
├── main.py              # Entry point, lifespan hooks, router registration
├── config.py            # Pydantic Settings (env vars)
├── core/
│   ├── __init__.py      # ⚠️ DUPLICATE engine + Base + session
│   ├── database.py      # Primary engine + Base + session factory
│   ├── security.py      # JWT, password hashing, API keys
│   └── logging.py       # structlog configuration
├── models/
│   ├── __init__.py      # Re-exports all models
│   ├── user.py          # User, RefreshToken, APIKey
│   ├── knowledge.py     # ⚠️ CIRCULAR SELF-IMPORT
│   ├── webhook.py       # Webhook, WebhookDelivery, WebhookEvent
│   └── audit.py         # AuditLog, AuditAction
├── schemas/
│   ├── __init__.py      # Pydantic request/response models
│   └── auth.py          # Auth-specific schemas
├── services/
│   ├── __init__.py      # Service re-exports
│   ├── knowledge_loader.py  # Markdown parser (dataclass-based)
│   ├── orchestrator.py      # Query routing engine
│   ├── context_compiler.py  # AI context builder
│   ├── vector_store.py      # Chroma stub
│   ├── graph_store.py       # Neo4j interface
│   ├── validator.py         # Module schema validation
│   ├── webhook.py           # Webhook delivery service
│   └── audit.py             # Audit log service
└── api/
    ├── deps.py              # Auth middleware (JWT + API Key)
    ├── dependencies.py      # ⚠️ DUPLICATE of deps.py with different interface
    └── routes/
        ├── health.py
        ├── modules.py
        ├── search.py
        ├── orchestrator.py
        ├── context.py       # ⚠️ BUG: undefined `db` variable
        ├── graph.py
        ├── admin.py
        ├── webhooks.py
        ├── auth.py
        ├── users.py
        └── api_keys.py
```

### 2.2 Architectural Findings

#### ARCH-001: Duplicate Database Engine and `Base` class (CRITICAL)

Two files define engine, session factory, and ORM `Base`:

| File | Engine | Session | Base |
|------|--------|---------|------|
| [`core/__init__.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/core/__init__.py) | `create_async_engine(settings.DATABASE_URL)` | `async_sessionmaker(engine)` | `class Base(DeclarativeBase)` |
| [`core/database.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/core/database.py) | `create_async_engine()` with primary/fallback logic | `async_sessionmaker(engine)` | `class Base(DeclarativeBase)` |

**Impact:** Models import `Base` from `core.database`. But `core/__init__.py` creates its own `Base`. If any code imports `Base` from `core` (the `__init__`) instead of `core.database`, those models' tables won't be created by `init_database()` because they're registered on a different metadata object.

**Evidence:** [`core/__init__.py` L30](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/core/__init__.py#L30) vs [`core/database.py` L56](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/core/database.py#L56)

#### ARCH-002: Duplicate Auth Dependencies (MEDIUM)

Two files provide authentication dependencies:

| File | Functions |
|------|-----------|
| [`api/deps.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/api/deps.py) | `get_current_user_optional`, `get_current_user`, `require_role` |
| [`api/dependencies.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/api/dependencies.py) | `get_current_user`, `get_current_active_user`, `get_current_admin_user`, `get_current_editor_user`, `get_api_key` |

`dependencies.py` wraps `deps.py`'s `get_current_user` but adds its own `get_current_active_user` which re-checks `is_active` — **but `deps.py` already checks `is_active` in `get_current_user_optional`**, making the check redundant. Neither file is clearly canonical.

**Impact:** Confusion about which dependency to use. Route files inconsistently import from one or the other. `dependencies.py` functions like `get_current_admin_user` are **never used** by any route — dead code.

#### ARCH-003: Inconsistent Session Dependency Injection (HIGH)

Routes use **two different** session dependency functions:

| Routes | Dependency | Source |
|--------|-----------|--------|
| `modules.py`, `search.py`, `graph.py` | `get_session` | `core.database` |
| `auth.py`, `admin.py`, `users.py`, `api_keys.py`, `webhooks.py` | `get_db` | `core.database` |

Both functions exist in [`core/database.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/core/database.py) and are functionally identical (both yield an `AsyncSession`), but the duplication creates confusion about which is canonical.

#### ARCH-004: MCP Server is an Isolated Silo (HIGH)

The MCP server ([`mcp/server.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/mcp/server.py)):
- Directly imports `KnowledgeLoader` and `Orchestrator` from the backend package via `sys.path` manipulation (line 30)
- Parses Markdown files on startup and caches them in a global `_modules_cache`
- **Never reads from the database** — it re-parses raw Markdown each time
- Has **no authentication** — any MCP client has full access to all knowledge

This means the MCP server has a fundamentally different data pathway than the REST API:
- API clients: `Markdown → PostgreSQL → API → Client`
- MCP clients: `Markdown → In-memory cache → Client`

If an admin edits module content via the API (writing to PostgreSQL), MCP clients **will not see the changes** until the server restarts.

#### ARCH-005: Orchestrator is a Singleton with Global State (MEDIUM)

In [`api/routes/orchestrator.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/api/routes/orchestrator.py#L15):
```python
_orchestrator = Orchestrator()  # Module-level singleton
```

This works in single-process mode but breaks under multi-worker Uvicorn (`--workers N`) since each worker has its own copy. The `POST /reload` endpoint only reloads rules in the **current process**.

---

## 3. Data Flow Analysis

### 3.1 Ingestion Pipeline (Markdown → Database)

```
data/business_context/
    ├── Marketing/Brand-Sponsorships.md
    ├── CEO/Growth-Strategy.md
    └── ...
         │
         ▼
┌─ KnowledgeLoader.load_all() ──────────────────┐
│  1. Walk directory tree recursively            │
│  2. Directory name → department name           │
│  3. For each .md file:                         │
│     a. Read text (UTF-8 with fallback)         │
│     b. Extract H1 title (name)                 │
│     c. Extract ## Purpose section              │
│     d. Extract ## Principles (regex)           │
│     e. Extract ## Rules (regex)                │
│     f. Extract ## Decision Frameworks (regex)  │
│     g. Extract ## See Also / Cross-Refs        │
│     h. Generate slug from relative path        │
│  4. Return List[ParsedModule]                  │
└────────────────────┬───────────────────────────┘
                     │
                     ▼
┌─ scripts/load_knowledge.py ────────────────────┐
│  1. Call init_database() (CREATE TABLE)         │
│  2. DELETE ALL existing data (destructive!)     │
│  3. For each ParsedModule:                      │
│     a. INSERT Module row                        │
│     b. INSERT Principle rows                    │
│     c. INSERT Rule rows                         │
│     d. INSERT DecisionTree rows                 │
│     e. INSERT CrossReference rows               │
│  4. COMMIT                                      │
└────────────────────────────────────────────────┘
```

> [!CAUTION]
> The load script performs a **destructive full reload** — it deletes ALL data from all tables before re-inserting. There is no incremental/differential sync. Any user-created data (audit logs, webhooks, users) that references module IDs via foreign keys could be orphaned or cause constraint violations.

### 3.2 Query Pipeline (User Query → Context)

```
POST /api/orchestrator/route  {"query": "brand pricing"}
         │
         ▼
┌─ Orchestrator.route() ──────────────────┐
│  1. Normalize query to lowercase        │
│  2. For each routing rule:              │
│     a. Check keyword matches            │
│     b. Score by match count             │
│  3. Sort by relevance score             │
│  4. Return top N RouteMatch objects     │
└─────────────┬───────────────────────────┘
              │
              ▼
POST /api/context/compile  {"query": "brand pricing"}
         │
         ▼
┌─ ContextCompiler.compile_by_query() ───┐
│  1. Route query via Orchestrator        │
│  2. Fetch matched modules from DB       │
│  3. Compile principles, rules, trees    │
│  4. Expand cross-references (depth N)   │
│  5. Return markdown or JSON package     │
└─────────────────────────────────────────┘
         │
         ▼ ⚠️ CRASHES HERE (BUG-001)
    trigger_webhooks(db, ...)  ← `db` is undefined
```

---

## 4. Separation of Concerns

### 4.1 Layer Violations

| Violation | Location | Issue |
|-----------|----------|-------|
| Route-level business logic | [`search.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/api/routes/search.py) | Search scoring, snippet extraction, and deduplication logic is in the route handler instead of a service |
| Route-level business logic | [`graph.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/api/routes/graph.py) | D3 graph data construction (nodes, links, department grouping) is in the route handler |
| Route-level business logic | [`modules.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/api/routes/modules.py) | N+1 query pattern for counting principles/rules per module |
| Model-level import | [`context.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/api/routes/context.py#L64-L65) | Inline import of `WebhookEvent` and `trigger_webhooks` inside the handler — a cross-cutting concern mixed into a route |

### 4.2 Missing Service Layer Coverage

The following features have **no service layer** — business logic lives entirely in route handlers:

- **Search** — Keyword matching, scoring, snippet extraction
- **Graph data** — D3 node/link construction, department grouping
- **Module listing** — Count enrichment with N+1 queries
- **User management** — CRUD operations directly in routes

---

## 5. Configuration Architecture

### 5.1 Config Management

[`config.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/config.py) uses Pydantic `BaseSettings` with `.env` file support.

**Good:**
- Type validation via Pydantic
- Environment-specific overrides via env vars
- Grouped settings (database, auth, knowledge base)

**Bad:**
- Default superuser password in code: `FIRST_SUPERUSER_PASSWORD: str = "Admin123!"`
- Default JWT secret in code: `SECRET_KEY: str = "bcos_super_secret_jwt_key_change_in_production_32bytesmin"`
- `CORS_ORIGINS` defaults to `["http://localhost:3000", "http://127.0.0.1:3000"]` — acceptable for dev but must be restricted for production
- `.env` file is present in the repository (despite `.gitignore` entry)

### 5.2 Database URL Resolution

The database URL follows a cascading fallback:
1. `DATABASE_URL` env var (if set)
2. Constructed from `POSTGRES_*` components
3. Fallback to `sqlite+aiosqlite:///./bcos_platform.db`

> [!IMPORTANT]
> The fallback to SQLite is silently applied. All models use `postgresql.UUID` column types which are handled via SQLAlchemy's dialect adaptation for SQLite. This works for basic operations but **UUID columns won't have proper indexing or validation** on SQLite.

---

## 6. Scalability Assessment

| Concern | Status | Notes |
|---------|--------|-------|
| **Horizontal scaling** | ⚠️ Partially ready | Backend is mostly stateless, but singleton Orchestrator with module-level state and in-memory caching breaks under multiple workers |
| **Database scaling** | ❌ No read replicas | Single database connection; no connection pooling configuration beyond default |
| **Caching** | ❌ Not implemented | Redis is declared but zero caching exists in the codebase |
| **Rate limiting** | ❌ Not implemented | No rate limiting middleware despite documentation claiming Redis-backed sliding window |
| **Search performance** | ⚠️ Poor | `list_modules` uses N+1 queries (one count query per module per child type); search uses `ILIKE '%term%'` which cannot use indexes |
| **Context compilation** | ⚠️ Unbounded | Cross-reference expansion has a depth parameter but no cycle detection |
