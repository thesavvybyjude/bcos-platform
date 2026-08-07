# BCOS Platform — API Reference

**Base URL:** `http://localhost:8000/api`
**Interactive Docs:** `http://localhost:8000/api/docs` (Swagger UI)

---

## Health

### `GET /api/health`

Basic health check.

**Response:**
```json
{
  "status": "healthy",
  "service": "BCOS Platform",
  "version": "1.0.0",
  "environment": "development"
}
```

### `GET /api/health/ready`

Readiness probe — checks core dependencies.

---

## Modules

### `GET /api/modules`

List all knowledge modules.

| Parameter | Type | Description |
|-----------|------|-------------|
| `department` | string (query) | Filter by department name |
| `status` | string (query) | Filter by status (`active`, `draft`, `archived`) |
| `search` | string (query) | Search in name/description |
| `skip` | int (query) | Pagination offset (default: 0) |
| `limit` | int (query) | Page size (default: 50, max: 200) |

**Response:** `ModuleSummary[]`

### `GET /api/modules/{slug}`

Get a single module with all children (principles, rules, decision trees, cross-references).

**Response:** `ModuleDetail`

### `GET /api/modules/departments`

List all departments with module counts.

**Response:**
```json
[
  { "name": "Marketing", "module_count": 12 },
  { "name": "Business", "module_count": 8 }
]
```

### `GET /api/modules/stats`

Platform-wide statistics.

**Response:** `PlatformStats`
```json
{
  "total_modules": 245,
  "total_principles": 1200,
  "total_rules": 800,
  "total_decision_trees": 320,
  "total_cross_references": 150,
  "departments": ["Business", "CEO", "Marketing", "Technology"],
  "department_counts": { "Marketing": 12, "Business": 8 }
}
```

---

## Search

### `GET /api/search`

Search across modules, principles, and rules.

| Parameter | Type | Description |
|-----------|------|-------------|
| `q` | string (query, required) | Search query (1–1000 chars) |
| `department` | string (query) | Filter by department |
| `max_results` | int (query) | Maximum results (default: 10, max: 50) |

**Response:** `SearchResponse`
```json
{
  "query": "pricing strategy",
  "total": 3,
  "results": [
    {
      "module": { "name": "Brand Sponsorships & Negotiation", "slug": "...", ... },
      "score": 5.0,
      "snippet": "...pricing claim with data — CPM benchmarks...",
      "match_type": "keyword"
    }
  ]
}
```

---

## Orchestrator

### `POST /api/orchestrator/route`

Route a natural language query to the most relevant modules.

**Request:**
```json
{
  "query": "How should I price a brand deal?",
  "max_modules": 5
}
```

**Response:** `RouteResponse`
```json
{
  "query": "How should I price a brand deal?",
  "routed_modules": [
    {
      "module_name": "Brand Sponsorships & Negotiation",
      "department": "Marketing",
      "role": "primary",
      "relevance_score": 7.5,
      "matched_keywords": ["brand", "deal", "pricing"]
    }
  ],
  "suggestion": "Based on your query, the primary module is..."
}
```

### `GET /api/orchestrator/rules`

List all active routing rules (from Orchestrator.md).

### `POST /api/orchestrator/reload`

Force-reload routing rules from Orchestrator.md.

---

## Context

### `POST /api/context/compile`

Compile an AI-ready context package.

**Request:**
```json
{
  "query": "brand deal negotiation strategy",
  "module_slugs": [],
  "max_principles": 10,
  "max_rules": 10,
  "include_cross_refs": true,
  "output_format": "markdown"
}
```

Provide either `query` (routes via Orchestrator first) or `module_slugs` (explicit module list).

**Response:**
```json
{
  "compiled_markdown": "# BCOS Context Package\n...",
  "modules": [...],
  "total_principles": 7,
  "total_rules": 5,
  "total_decision_trees": 3
}
```

---

## Graph

### `GET /api/graph/data`

Get knowledge graph in D3-compatible format.

| Parameter | Type | Description |
|-----------|------|-------------|
| `department` | string (query) | Filter by department |

**Response:**
```json
{
  "nodes": [
    { "id": "dept-Marketing", "label": "Marketing", "type": "department", "size": 20 },
    { "id": "brand-sponsorships-negotiation", "label": "Brand Sponsorships & Negotiation", "type": "module", "department": "Marketing", "size": 10 }
  ],
  "links": [
    { "source": "brand-sponsorships-negotiation", "target": "dept-Marketing", "type": "belongs_to" }
  ],
  "total_nodes": 25,
  "total_links": 30
}
```

---

## Data Models

### ModuleSummary

| Field | Type | Description |
|-------|------|-------------|
| `id` | UUID | Unique identifier |
| `name` | string | Display name |
| `slug` | string | URL-friendly identifier |
| `department` | string | Parent department |
| `description` | string | Brief description |
| `status` | string | `active` / `draft` / `archived` |
| `principle_count` | int | Number of principles |
| `rule_count` | int | Number of rules |
| `decision_tree_count` | int | Number of decision trees |

### ModuleDetail

Extends `ModuleSummary` with:

| Field | Type | Description |
|-------|------|-------------|
| `purpose` | string | Module purpose statement |
| `raw_content` | string | Original Markdown content |
| `principles` | Principle[] | Extracted principles |
| `rules` | Rule[] | Extracted rules |
| `decision_trees` | DecisionTree[] | Extracted decision trees |
| `cross_references` | CrossReference[] | Links to other modules |
