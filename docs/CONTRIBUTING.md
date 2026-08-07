# Contributing to BCOS Platform

Thank you for your interest in contributing to the BCOS Platform. This guide explains how to set up your development environment and submit changes.

---

## Development Setup

### Prerequisites

- Python 3.12+
- Node.js 18+
- Docker & Docker Compose
- Git

### Clone & Setup

```bash
git clone https://github.com/your-org/bcos-platform.git
cd bcos-platform

# Backend
cd backend
pip install -e ".[dev]"

# Frontend
cd ../frontend
npm install
```

### Start Infrastructure

```bash
cp .env.example .env
docker-compose up -d postgres redis
```

---

## Code Standards

### Backend (Python)

- **Formatter:** Ruff (`ruff format`)
- **Linter:** Ruff (`ruff check`)
- **Type checking:** MyPy (strict mode)
- **Docstrings:** Google style
- **Tests:** pytest with async fixtures

### Frontend (TypeScript)

- **Formatter:** Prettier
- **Linter:** ESLint (Next.js config)
- **Components:** Functional components with hooks
- **Naming:** PascalCase for components, camelCase for functions/variables

### Knowledge Modules (Markdown)

Every module must have:
- `# Title` (H1 heading)
- `## Purpose` (description of what the module covers)
- `## Principles` (numbered list with **bold titles**)
- `## Rules` (typed: **Always/Never/Avoid/Prefer**)
- `## Decision Frameworks` (optional but recommended)
- `## See Also` (cross-references to related modules)

---

## Branch Strategy

| Branch | Purpose |
|--------|---------|
| `main` | Production-ready code. Deploys to staging on push. |
| `develop` | Integration branch. PRs merge here first. |
| `feature/*` | New features. Branch from `develop`. |
| `fix/*` | Bug fixes. Branch from `develop` or `main` (hotfix). |

### Workflow

1. Create a branch from `develop`:
   ```bash
   git checkout -b feature/my-feature develop
   ```
2. Make changes, commit, push
3. Open a Pull Request to `develop`
4. CI runs automatically (lint, test, build)
5. Get review approval
6. Merge (squash merge preferred)

---

## Pull Request Guidelines

- **Title:** Clear, descriptive (e.g., "Add semantic search to /api/search")
- **Description:** What changed, why, and how to test
- **Size:** Keep PRs small and focused. If a change is large, split it.
- **Tests:** Add or update tests for new functionality
- **Breaking changes:** Flag in PR description with migration steps

---

## Running Tests

```bash
# Backend (with coverage)
cd backend
python -m pytest tests/ -v --cov=src

# Frontend
cd frontend
npm test

# Validate knowledge base
python scripts/validate.py
```

---

## Questions?

Open an issue or reach out to the maintainers.
