# BCOS Platform — Remediation Plan

## Prioritized Fix Order

All findings are organized into **immediate**, **short-term**, and **medium-term** phases. Each fix includes the specific file, the exact change needed, and the estimated effort.

---

## Phase 1: Critical Fixes (Do Immediately)

> [!CAUTION]
> These items prevent the application from functioning and/or represent active security vulnerabilities. Fix before any testing or deployment.

### 1.1 Fix BUG-001: Undefined `db` in context.py

**File:** [`backend/src/api/routes/context.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/api/routes/context.py#L68)

**Change:** Line 68 — replace `db` with `session`

```diff
     await trigger_webhooks(
-        db,
+        session,
         event=WebhookEvent.CONTEXT_COMPILED,
```

**Effort:** 1 minute

---

### 1.2 Fix BUG-002: Circular Import in models/knowledge.py

**File:** [`backend/src/models/knowledge.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/models/knowledge.py)

**Change:** Audit all imports in `knowledge.py`. Remove any self-referencing imports (e.g., `from .knowledge import ...`). If the file imports from `models.__init__`, change to explicit relative imports from sibling modules.

**Effort:** 15 minutes

---

### 1.3 Fix SEC-001 + SEC-003: Remove Hardcoded Secrets

**File:** [`backend/src/config.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/config.py)

**Change:**

```diff
-    SECRET_KEY: str = "bcos_super_secret_jwt_key_change_in_production_32bytesmin"
+    SECRET_KEY: str  # Required — no default. Set via SECRET_KEY env var.

-    FIRST_SUPERUSER_PASSWORD: str = "Admin123!"
+    FIRST_SUPERUSER_PASSWORD: str  # Required — no default. Set via env var.
```

Add a startup validation in `main.py`:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    if "change_in_production" in settings.SECRET_KEY or settings.SECRET_KEY == "":
        raise RuntimeError("SECRET_KEY must be set to a secure random value")
    ...
```

**Effort:** 15 minutes

---

### 1.4 Fix SEC-002: Remove .env from Repository

**Commands:**
```bash
git rm --cached .env
echo ".env" >> .gitignore
git commit -m "Remove .env from version control"
```

Create a `.env.example` with placeholder values:
```env
DATABASE_URL=postgresql+asyncpg://user:password@localhost:5432/bcos
SECRET_KEY=CHANGE_ME_TO_RANDOM_64_CHAR_STRING
FIRST_SUPERUSER_PASSWORD=CHANGE_ME
```

**Effort:** 10 minutes

---

### 1.5 Fix SEC-004: Remove SHA-256 Password Fallback

**File:** [`backend/src/core/security.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/core/security.py)

**Change:** Remove the `except` block that falls back to SHA-256. Let bcrypt failures propagate as errors.

```diff
 def get_password_hash(password: str) -> str:
-    try:
-        return pwd_context.hash(password)
-    except Exception:
-        return hashlib.sha256(password.encode()).hexdigest()
+    return pwd_context.hash(password)
```

**Effort:** 5 minutes

---

### 1.6 Fix BUG-008: Frontend TypeScript Type Errors

**Files:**
- [`frontend/src/lib/auth-context.tsx`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/frontend/src/lib/auth-context.tsx)
- [`frontend/src/lib/auth.ts`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/frontend/src/lib/auth.ts)

**Change:** Replace all `str` → `string` and `bool` → `boolean`:

```diff
-  is_active: bool;
-  is_superuser: bool;
+  is_active: boolean;
+  is_superuser: boolean;

-  login: (email: string, password: str) => Promise<void>;
-  register: (email: string, password: str, full_name?: string) => Promise<void>;
+  login: (email: string, password: string) => Promise<void>;
+  register: (email: string, password: string, full_name?: string) => Promise<void>;
```

**Effort:** 10 minutes

---

## Phase 2: High-Priority Fixes (This Sprint)

### 2.1 Fix ARCH-001: Consolidate Duplicate Base/Engine

**Action:** Remove the duplicate engine, session factory, and Base class from [`core/__init__.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/core/__init__.py). Keep `core/database.py` as the single source of truth.

Replace `core/__init__.py` contents with:
```python
"""BCOS Platform — Core Package"""
from .database import Base, engine, async_session, get_session, get_db, init_database

__all__ = ["Base", "engine", "async_session", "get_session", "get_db", "init_database"]
```

**Effort:** 30 minutes (including updating all imports)

---

### 2.2 Fix ARCH-002: Consolidate Auth Dependencies

**Action:** Delete [`api/dependencies.py`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/backend/src/api/dependencies.py) entirely. It's dead code. All routes already use `deps.py`.

**Effort:** 5 minutes

---

### 2.3 Fix ARCH-003: Standardize Session Dependency

**Action:** Pick one name. Recommendation: use `get_session` everywhere and alias it in `database.py`:

```python
get_db = get_session  # Backward compatibility alias
```

Then gradually migrate all `get_db` usages to `get_session` for consistency.

**Effort:** 20 minutes

---

### 2.4 Fix SEC-005 + BUG-006 + BUG-007: Use Request Bodies for Sensitive Data

**Action:** Create Pydantic models for `update_me` and `change_password`:

```python
class UpdateProfileRequest(BaseModel):
    full_name: Optional[str] = None

class ChangePasswordRequest(BaseModel):
    old_password: str
    new_password: str = Field(..., min_length=8)
```

Update the route handlers to accept these as request body parameters.

**Effort:** 20 minutes

---

### 2.5 Fix BUG-004 + BUG-005: Eliminate N+1 Queries

**Action:** Replace per-module count queries with a single aggregated query:

```python
from sqlalchemy import func, select
from sqlalchemy.orm import aliased

# Single query with subquery counts
stmt = (
    select(
        Module,
        func.count(distinct(Principle.id)).label("p_count"),
        func.count(distinct(Rule.id)).label("r_count"),
        func.count(distinct(DecisionTree.id)).label("dt_count"),
    )
    .outerjoin(Principle, Principle.module_id == Module.id)
    .outerjoin(Rule, Rule.module_id == Module.id)
    .outerjoin(DecisionTree, DecisionTree.module_id == Module.id)
    .group_by(Module.id)
    .where(Module.status == status)
)
```

**Effort:** 1 hour

---

### 2.6 Fix BUG-009: Create Missing Frontend API Exports

**Action:** Add typed API methods and type exports to [`frontend/src/lib/api.ts`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/frontend/src/lib/api.ts):

```typescript
export interface PlatformStats {
  total_modules: number;
  total_principles: number;
  total_rules: number;
  total_decision_trees: number;
  departments: string[];
  department_counts: Record<string, number>;
}

export interface ModuleSummary {
  id: string;
  name: string;
  slug: string;
  department: string;
  description: string;
  status: string;
  principle_count: number;
  rule_count: number;
  decision_tree_count: number;
}

export const api = {
  getStats: () => apiRequest<PlatformStats>("/api/modules/stats"),
  getModules: (params?: { limit?: number }) =>
    apiRequest<ModuleSummary[]>(`/api/modules?limit=${params?.limit ?? 50}`),
  // ... other methods
};
```

**Effort:** 30 minutes

---

### 2.7 Fix BUG-010: CSS Fixes

**File:** [`frontend/src/app/globals.css`](file:///c:/Users/thesa/OneDrive/Documents/ideation_files,%20pre_builds/BCOS/frontend/src/app/globals.css)

```diff
-  .btn-[#ghost]:hover {
+  .btn-ghost:hover {

-  .gradient-text {
-    @apply bg-gradient-to-r from-primary via-primary-container to-tertiary bg-clip-text text-transparent;
-  }
+  .gradient-text {
+    @apply bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent;
+  }
```

Or define `primary`, `primary-container`, `tertiary` in `tailwind.config.ts`.

**Effort:** 15 minutes

---

### 2.8 Add Alembic Migrations

**Action:**
```bash
cd backend
pip install alembic
alembic init alembic
```

Configure `alembic/env.py` to use the async engine from `core.database`. Generate initial migration:
```bash
alembic revision --autogenerate -m "initial"
```

Replace `init_database()` (`Base.metadata.create_all`) with `alembic upgrade head` in startup and deployment.

**Effort:** 2 hours

---

## Phase 3: Medium-Term Improvements (Next Sprint)

### 3.1 Add Rate Limiting

Install `slowapi` and add rate limits to auth endpoints:

```python
from slowapi import Limiter
limiter = Limiter(key_func=get_remote_address)

@router.post("/login")
@limiter.limit("5/minute")
async def login(...):
```

**Effort:** 1 hour

---

### 3.2 Extract Service Layer for Search and Graph

Move business logic from route handlers into dedicated service classes:
- `SearchService` — keyword matching, scoring, snippet extraction
- `GraphService` — D3 data construction, department grouping

**Effort:** 3 hours

---

### 3.3 MCP-API Data Consistency

Either:
- **Option A:** Make MCP server call the REST API instead of directly parsing Markdown
- **Option B:** Add a cache invalidation mechanism so MCP reloads when the DB is updated

**Effort:** 4 hours

---

### 3.4 Test Suite Expansion

Priority test files to create:

1. `test_context_compiler.py` — Tests the context compilation pipeline
2. `test_orchestrator_routing.py` — Tests query routing with various inputs
3. `test_auth_integration.py` — End-to-end register → login → refresh → logout
4. `test_search.py` — Search scoring and deduplication
5. `test_admin.py` — Module CRUD with RBAC enforcement

**Effort:** 8 hours

---

### 3.5 Remove Dead Code

Delete the following unused files/functions:
- `api/dependencies.py` (entire file)
- `services/vector_store.py` (or implement it)
- `frontend/src/components/layout/Footer.tsx`
- `frontend/src/components/layout/Header.tsx`
- `schemas/__init__.py` → `SearchRequest`, `CompiledContext` (unused models)

**Effort:** 30 minutes

---

### 3.6 Fix Frontend Pages Without Backend

Either implement backend support for:
- Email verification (`/verify-email`)
- Password reset (`/reset-password`)

Or remove these pages until the features are built.

**Effort:** 4 hours (implement) or 15 minutes (remove)

---

## Summary of Effort

| Phase | Items | Total Effort |
|-------|-------|-------------|
| **Phase 1** (Critical) | 6 fixes | ~1 hour |
| **Phase 2** (High) | 8 fixes | ~5 hours |
| **Phase 3** (Medium) | 6 improvements | ~20 hours |
| **Total** | 20 items | ~26 hours |

---

## Fix Priority Matrix

```
                    ┌─────────────────────────────────────────┐
     CRITICAL ──────│  BUG-001   SEC-001   SEC-002   SEC-003  │
                    │  BUG-002   SEC-004                       │
                    ├─────────────────────────────────────────┤
     HIGH ──────────│  BUG-004   BUG-005   BUG-008   BUG-009 │
                    │  SEC-005   SEC-007   ARCH-001  ARCH-003 │
                    ├─────────────────────────────────────────┤
     MEDIUM ────────│  BUG-006   BUG-007   BUG-010   BUG-011 │
                    │  BUG-012   ARCH-002  SEC-006   SEC-008  │
                    ├─────────────────────────────────────────┤
     LOW ───────────│  BUG-003   BUG-013   BUG-014   BUG-015 │
                    │  SEC-011   SEC-012   SEC-013            │
                    └─────────────────────────────────────────┘
```
