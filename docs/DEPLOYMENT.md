# BCOS Platform — Deployment Guide

## Environments

| Environment | Purpose | Trigger |
|-------------|---------|---------|
| **Local** | Development | `make dev` / `docker-compose up` |
| **Staging** | Pre-production testing | Push to `main` branch |
| **Production** | Live system | Push a version tag (`v1.0.0`) |

---

## Local Development

### Prerequisites

- Docker Desktop (Windows/macOS) or Docker Engine (Linux)
- Docker Compose v2+
- Python 3.12+ (for local backend dev)
- Node.js 18+ (for local frontend dev)

### Quick Start

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Start all services
make dev

# 3. Load knowledge base
make load-data

# 4. Open portal
# http://localhost:3000 (frontend)
# http://localhost:8000/api/docs (API docs)
```

### Service Ports

| Service | Port | Dashboard |
|---------|------|-----------|
| Frontend | 3000 | http://localhost:3000 |
| Backend API | 8000 | http://localhost:8000/api/docs |
| PostgreSQL | 5432 | — |
| Redis | 6379 | — |
| Neo4j | 7474, 7687 | http://localhost:7474 |

---

## Staging / Production (Kubernetes)

### Prerequisites

- Kubernetes cluster (1.27+)
- `kubectl` configured with cluster access
- Container registry (GHCR or Docker Hub)
- Secrets configured (see below)

### Deploy

```bash
# Apply all manifests
kubectl apply -f k8s/

# Check status
kubectl -n bcos get pods
kubectl -n bcos get svc
```

### Required Secrets

Create these Kubernetes secrets before deploying:

```bash
# Database credentials
kubectl -n bcos create secret generic bcos-db \
  --from-literal=DATABASE_URL="postgresql+asyncpg://bcos:PASSWORD@postgres:5432/bcos" \
  --from-literal=POSTGRES_PASSWORD="PASSWORD"

# Neo4j credentials
kubectl -n bcos create secret generic bcos-neo4j \
  --from-literal=NEO4J_PASSWORD="PASSWORD"

# App secrets
kubectl -n bcos create secret generic bcos-app \
  --from-literal=SECRET_KEY="your-production-secret-key"
```

### Scaling

```bash
# Scale backend replicas
kubectl -n bcos scale deployment/backend --replicas=3

# Scale frontend replicas
kubectl -n bcos scale deployment/frontend --replicas=2
```

---

## CI/CD Pipeline

### Workflow: `ci.yml`

Runs on every push and PR:
1. **Backend Lint** — Ruff + MyPy
2. **Backend Tests** — pytest with PostgreSQL service
3. **Frontend Lint** — ESLint
4. **Frontend Build** — Next.js production build
5. **Docker Build** — Build images (main branch only)
6. **Validate Knowledge** — Schema validation

### Workflow: `deploy.yml`

Runs on push to `main` or version tags:
1. **Build & Push** — Push images to GHCR
2. **Deploy Staging** — Auto-deploy on `main` push
3. **Deploy Production** — Auto-deploy on version tags (`v*`)

### Releasing

```bash
# Create a release
git tag v1.0.0
git push origin v1.0.0
# → Triggers production deployment automatically
```

---

## Monitoring

### Health Checks

- Backend: `GET /api/health` and `GET /api/health/ready`
- Docker Compose: Built-in healthchecks for all services
- Kubernetes: Liveness and readiness probes in deployment manifests

### Logs

```bash
# Docker Compose
docker-compose logs -f backend

# Kubernetes
kubectl -n bcos logs -f deployment/backend
```

---

## Backup & Recovery

### PostgreSQL

```bash
# Backup
docker-compose exec postgres pg_dump -U bcos bcos > backup.sql

# Restore
docker-compose exec -T postgres psql -U bcos bcos < backup.sql
```

### Knowledge Base

The knowledge base is stored in `data/business_context/`. Version control this directory in your repository. To re-index:

```bash
make load-data
```
