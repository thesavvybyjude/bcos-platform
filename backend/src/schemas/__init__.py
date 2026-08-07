"""
BCOS Platform — Pydantic Schemas

Request/response models for the REST API.
These are separate from SQLAlchemy models to decouple the API contract from storage.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field


# ── Base schemas ──


class PrincipleSchema(BaseModel):
    id: UUID
    title: str
    description: str
    source_quote: str = ""
    context: str = ""
    order_index: int = 0

    model_config = {"from_attributes": True}


class RuleSchema(BaseModel):
    id: UUID
    rule_type: str
    statement: str
    reasoning: str = ""
    context: str = ""
    order_index: int = 0

    model_config = {"from_attributes": True}


class DecisionTreeSchema(BaseModel):
    id: UUID
    name: str
    condition: str
    action: str
    otherwise: str = ""
    context: str = ""
    order_index: int = 0

    model_config = {"from_attributes": True}


class CrossReferenceSchema(BaseModel):
    id: UUID
    target_module_slug: str
    relationship_type: str = "related_to"
    description: str = ""

    model_config = {"from_attributes": True}


# ── Module schemas ──


class ModuleSummary(BaseModel):
    """Lightweight module listing (for catalog views)."""

    id: UUID
    name: str
    slug: str
    department: str
    description: str = ""
    status: str = "active"
    principle_count: int = 0
    rule_count: int = 0
    decision_tree_count: int = 0
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ModuleDetail(BaseModel):
    """Full module with all children (for detail views)."""

    id: UUID
    name: str
    slug: str
    department: str
    description: str = ""
    purpose: str = ""
    file_path: str = ""
    version: int = 1
    status: str = "active"
    raw_content: str = ""
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    principles: List[PrincipleSchema] = []
    rules: List[RuleSchema] = []
    decision_trees: List[DecisionTreeSchema] = []
    cross_references: List[CrossReferenceSchema] = []

    model_config = {"from_attributes": True}


# ── Search schemas ──


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=1000)
    department: Optional[str] = None
    max_results: int = Field(default=10, ge=1, le=50)
    min_score: float = Field(default=0.0, ge=0.0, le=1.0)


class SearchResult(BaseModel):
    module: ModuleSummary
    score: float
    snippet: str = ""
    match_type: str = "keyword"  # keyword | semantic | hybrid


class SearchResponse(BaseModel):
    query: str
    total: int
    results: List[SearchResult]


# ── Orchestrator schemas ──


class RouteRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    max_modules: int = Field(default=5, ge=1, le=20)


class RoutedModule(BaseModel):
    module_name: str
    department: str
    role: str = "primary"  # primary | secondary
    relevance_score: float = 0.0
    matched_keywords: List[str] = []


class RouteResponse(BaseModel):
    query: str
    routed_modules: List[RoutedModule]
    suggestion: str = ""


# ── Context Compiler schemas ──


class CompileRequest(BaseModel):
    query: Optional[str] = None
    module_slugs: List[str] = Field(default_factory=list)
    max_principles: int = Field(default=10, ge=1, le=50)
    max_rules: int = Field(default=10, ge=1, le=50)
    include_cross_refs: bool = True
    output_format: str = "markdown"  # markdown | json


class CompiledContext(BaseModel):
    """AI-ready context package."""

    query: Optional[str] = None
    modules: List[ModuleDetail]
    compiled_markdown: str = ""
    total_principles: int = 0
    total_rules: int = 0
    total_decision_trees: int = 0


# ── Stats schemas ──


class PlatformStats(BaseModel):
    total_modules: int = 0
    total_principles: int = 0
    total_rules: int = 0
    total_decision_trees: int = 0
    total_cross_references: int = 0
    departments: List[str] = []
    department_counts: dict = {}
