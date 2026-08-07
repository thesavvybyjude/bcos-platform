# BCOS Platform — System Architecture

## Overview

The BCOS Platform is a full-stack knowledge management system that transforms structured Markdown files into a production-ready API, web portal, knowledge graph, and semantic search engine. It follows a layered architecture with clear separation of concerns.

---

## Layer Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        PRESENTATION LAYER                       │
│                                                                 │
│  ┌─────────────────┐  ┌──────────────┐  ┌───────────────────┐  │
│  │  Next.js Portal  │  │  MCP Server  │  │  REST API (Docs)  │  │
│  │  (Port 3000)     │  │  (Port 9000) │  │  (Port 8000)      │  │
│  └────────┬────────┘  └──────┬───────┘  └────────┬──────────┘  │
│           │                  │                    │              │
└───────────┼──────────────────┼────────────────────┼──────────────┘
            │                  │                    │
            └──────────────────┼────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                       ORCHESTRATION LAYER                        │
│                                                                  │
│  ┌────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │ Context Router  │  │ Context Compiler │  │  Search Engine  │  │
│  │ (Orchestrator)  │  │ (AI-ready pkgs)  │  │ (keyword+vector)│  │
│  └────────────────┘  └──────────────────┘  └─────────────────┘  │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                        KNOWLEDGE LAYER                           │
│                                                                  │
│  ┌──────────────┐  ┌───────────────┐  ┌───────────────────────┐ │
│  │  PostgreSQL   │  │    Neo4j      │  │   Chroma (Vector DB)  │ │
│  │  Modules,     │  │  Knowledge    │  │   Semantic embeddings │ │
│  │  Principles,  │  │  Graph of     │  │   for ANN search      │ │
│  │  Rules, Trees │  │  relations    │  │                       │ │
│  │  (Port 5432)  │  │  (Port 7687)  │  │   (embedded)          │ │
│  └──────────────┘  └───────────────┘  └───────────────────────┘ │
│                                                                  │
│  ┌──────────────┐                                                │
│  │    Redis      │  Caching, rate limiting, session management   │
│  │  (Port 6379)  │                                               │
│  └──────────────┘                                                │
│                                                                  │
└──────────────────────────────┬───────────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────────┐
│                         DATA LAYER                               │
│                                                                  │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │  data/business_context/   (Markdown files — source of truth)│  │
│  │  ├── Orchestrator.md      (routing brain)                   │  │
│  │  ├── Marketing/           (department modules)              │  │
│  │  ├── Business/                                              │  │
│  │  ├── CEO/                                                   │  │
│  │  └── Technology/                                            │  │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Ingestion Pipeline

```
Markdown Files (data/business_context/)
        │
        ▼
┌─ Knowledge Loader ──────────────────┐
│  1. Walk directory tree              │
│  2. Parse ## headings into sections  │
│  3. Extract principles, rules, trees │
│  4. Identify cross-references        │
│  5. Generate slugs                   │
└─────────┬──────────────┬────────────┘
          │              │
          ▼              ▼
    PostgreSQL        Chroma
  (structured data)  (embeddings)
          │
          ▼
       Neo4j
   (graph relations)
```

### Query Pipeline

```
User Query ("How should I price a brand deal?")
        │
        ▼
┌─ Orchestrator ────────────────────┐
│  Match query keywords against      │
│  routing rules from Orchestrator.md│
│  Return ranked module list         │
└─────────┬─────────────────────────┘
          │
          ▼
┌─ Context Compiler ────────────────┐
│  Fetch modules from PostgreSQL     │
│  Compile principles, rules, trees  │
│  Expand cross-references           │
│  Output: Markdown or JSON          │
└───────────────────────────────────┘
```

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Backend API | FastAPI (Python 3.12) | Async REST API, OpenAPI docs |
| Frontend | Next.js 14 (TypeScript) | Server/client rendering, App Router |
| Styling | Tailwind CSS 3.4 | Utility-first CSS framework |
| Primary DB | PostgreSQL 16 | Structured knowledge storage |
| Graph DB | Neo4j 5 | Knowledge graph, relationship queries |
| Vector DB | Chroma | Semantic search, ANN embeddings |
| Cache | Redis 7 | Caching, rate limiting |
| Containerisation | Docker + Docker Compose | Local dev, CI/CD |
| Orchestration | Kubernetes | Production deployment |
| CI/CD | GitHub Actions | Lint, test, build, deploy |

---

## Security Model

| Layer | Strategy |
|-------|----------|
| Authentication | JWT tokens (Phase 2) |
| Authorisation | Role-based access control (Phase 2) |
| API Rate Limiting | Redis-backed sliding window |
| Data Encryption | TLS in transit, encrypted at rest (PostgreSQL) |
| Secrets | Environment variables, Kubernetes secrets |

---

## Scalability Considerations

- **Horizontal scaling:** Backend is stateless; scale replicas behind a load balancer
- **Database:** PostgreSQL read replicas for query scaling
- **Vector search:** Chroma can be replaced with a managed service (Pinecone, Weaviate) for scale
- **Caching:** Redis caches compiled context packages (TTL-based invalidation)
- **CDN:** Frontend served via CDN in production
