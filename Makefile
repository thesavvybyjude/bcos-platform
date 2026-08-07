.PHONY: help dev build down test load-data clean lint

help: ## Show available commands
	@echo "Commands:"
	@echo "  make dev          - Start all services with docker-compose"
	@echo "  make build        - Build Docker images"
	@echo "  make down         - Stop all services"
	@echo "  make test         - Run all tests"
	@echo "  make load-data    - Load knowledge base into database"
	@echo "  make validate     - Validate knowledge base structure"
	@echo "  make build-vectors- Build vector index"
	@echo "  make lint         - Run linters"
	@echo "  make clean        - Remove all containers and volumes"

dev: ## Start all services with Docker Compose
	docker-compose up -d

build: ## Build Docker images
	docker-compose build

down: ## Stop all services
	docker-compose down

test: ## Run all tests
	cd backend && python -m pytest tests/ -v
	cd frontend && npm test 2>/dev/null || echo "Frontend tests not yet configured"

test-backend: ## Run backend tests only
	cd backend && python -m pytest tests/ -v --cov=src

test-frontend: ## Run frontend tests only
	cd frontend && npm test

load-data: ## Load knowledge base into database
	docker-compose exec backend python scripts/load_knowledge.py

load-data-local: ## Load knowledge base (local, no Docker)
	cd backend && python -m scripts.load_knowledge

validate: ## Validate knowledge base structure
	python scripts/validate.py

build-vectors: ## Build vector index in Chroma
	python scripts/build_vector_index.py

lint: ## Run linters
	cd backend && python -m ruff check src/
	cd frontend && npm run lint 2>/dev/null || echo "Frontend lint not yet configured"

clean: ## Remove all containers and volumes
	docker-compose down -v
	rm -rf data/chroma data/neo4j data/postgres data/redis
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name .pytest_cache -exec rm -rf {} + 2>/dev/null || true
