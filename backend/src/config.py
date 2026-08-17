"""
BCOS Platform — Configuration

All settings are loaded from environment variables (or .env file).
Pydantic Settings ensures type safety and validation.
"""

from typing import List, Optional
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_FILE = (BASE_DIR / "data" / "bcos.db").resolve()
KB_DIR = (BASE_DIR / "data" / "business_context").resolve()
CHROMA_DIR = (BASE_DIR / "data" / "chroma").resolve()

# Format Windows path for SQLite URL
DB_URL_STR = f"sqlite+aiosqlite:///{DB_FILE.as_posix()}"
KB_PATH_STR = KB_DIR.as_posix()
CHROMA_PATH_STR = CHROMA_DIR.as_posix()


class Settings(BaseSettings):
    """BCOS Platform Settings — single source of config truth."""

    # ── Application ──
    APP_NAME: str = "BCOS Platform"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = Field(default=True, validation_alias="DEBUG")
    ENVIRONMENT: str = Field(default="development", validation_alias="ENVIRONMENT")

    # ── API & Auth ──
    API_PREFIX: str = "/api"
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:3000", "http://localhost:8000"],
        validation_alias="CORS_ORIGINS",
    )
    SECRET_KEY: str = Field(
        ...,  # Required — no insecure default. Set via SECRET_KEY env var.
        validation_alias="SECRET_KEY",
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day default
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # SEC-007: rate limiting. None = in-process memory (fine for a single
    # worker; does not share state across workers/replicas). Set to e.g.
    # "redis://localhost:6379/0" for multi-worker/multi-pod deployments.
    RATE_LIMIT_STORAGE_URI: Optional[str] = None
    FIRST_SUPERUSER_EMAIL: str = Field(
        default="admin@bcos.local",
        validation_alias="FIRST_SUPERUSER_EMAIL",
    )
    FIRST_SUPERUSER_PASSWORD: str = Field(
        ...,  # Required — no insecure default. Set via FIRST_SUPERUSER_PASSWORD env var.
        validation_alias="FIRST_SUPERUSER_PASSWORD",
    )

    # ── PostgreSQL / SQLite ──
    DATABASE_URL: str = Field(
        default=DB_URL_STR,
        validation_alias="DATABASE_URL",
    )

    # ── Redis ──
    REDIS_URL: str = Field(default="redis://localhost:6379/0", validation_alias="REDIS_URL")

    # ── Knowledge Base ──
    KNOWLEDGE_BASE_PATH: str = Field(
        default=KB_PATH_STR,
        validation_alias="KNOWLEDGE_BASE_PATH",
    )

    # ── Chroma (Vector DB) ──
    CHROMA_PERSIST_DIR: str = Field(default=CHROMA_PATH_STR, validation_alias="CHROMA_PERSIST_DIR")
    CHROMA_COLLECTION_NAME: str = "bcos_knowledge"

    # ── Embeddings ──
    EMBEDDING_MODEL: str = Field(
        default="sentence-transformers/all-MiniLM-L6-v2",
        validation_alias="EMBEDDING_MODEL",
    )

    # ── Neo4j (Graph DB) ──
    NEO4J_URI: Optional[str] = Field(default="bolt://localhost:7687", validation_alias="NEO4J_URI")
    NEO4J_USER: Optional[str] = Field(default="neo4j", validation_alias="NEO4J_USER")
    NEO4J_PASSWORD: Optional[str] = Field(default=None, validation_alias="NEO4J_PASSWORD")

    # ── OpenAI (optional — disabled by default) ──
    OPENAI_API_KEY: Optional[str] = Field(default=None, validation_alias="OPENAI_API_KEY")
    OPENAI_MODEL: str = Field(default="gpt-4-turbo", validation_alias="OPENAI_MODEL")

    # ── MCP Server ──
    MCP_SERVER_HOST: str = Field(default="0.0.0.0", validation_alias="MCP_SERVER_HOST")
    MCP_SERVER_PORT: int = Field(default=9000, validation_alias="MCP_SERVER_PORT")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )


# Singleton instance
settings = Settings()
