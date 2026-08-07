/**
 * BCOS Platform — API Client
 *
 * Typed client for the FastAPI backend.
 * In development, requests are proxied via Next.js rewrites (see next.config.js).
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "/api";

// ── Types ──

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
  created_at: string | null;
}

export interface Principle {
  id: string;
  title: string;
  description: string;
  source_quote: string;
  context: string;
  order_index: number;
}

export interface Rule {
  id: string;
  rule_type: string;
  statement: string;
  reasoning: string;
  context: string;
  order_index: number;
}

export interface DecisionTree {
  id: string;
  name: string;
  condition: string;
  action: string;
  otherwise: string;
  context: string;
  order_index: number;
}

export interface CrossReference {
  id: string;
  target_module_slug: string;
  relationship_type: string;
  description: string;
}

export interface ModuleDetail extends ModuleSummary {
  purpose: string;
  file_path: string;
  version: number;
  raw_content: string;
  updated_at: string | null;
  principles: Principle[];
  rules: Rule[];
  decision_trees: DecisionTree[];
  cross_references: CrossReference[];
}

export interface PlatformStats {
  total_modules: number;
  total_principles: number;
  total_rules: number;
  total_decision_trees: number;
  total_cross_references: number;
  departments: string[];
  department_counts: Record<string, number>;
}

export interface SearchResult {
  module: ModuleSummary;
  score: number;
  snippet: string;
  match_type: string;
}

export interface SearchResponse {
  query: string;
  total: number;
  results: SearchResult[];
}

export interface Department {
  name: string;
  module_count: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  total_nodes: number;
  total_links: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: string;
  department?: string;
  size: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
}

export interface RouteResponse {
  query: string;
  routed_modules: RoutedModule[];
  suggestion: string;
}

export interface RoutedModule {
  module_name: string;
  department: string;
  role: string;
  relevance_score: number;
  matched_keywords: string[];
}

// ── API Functions ──

async function fetchJSON<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API error ${res.status}: ${errorText}`);
  }

  return res.json();
}

export const api = {
  // Health
  health: () => fetchJSON<{ status: string }>("/health"),

  // Modules
  getModules: (params?: {
    department?: string;
    search?: string;
    limit?: number;
    skip?: number;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.department) searchParams.set("department", params.department);
    if (params?.search) searchParams.set("search", params.search);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.skip) searchParams.set("skip", String(params.skip));
    const qs = searchParams.toString();
    return fetchJSON<ModuleSummary[]>(`/modules${qs ? `?${qs}` : ""}`);
  },

  getModule: (slug: string) =>
    fetchJSON<ModuleDetail>(`/modules/${slug}`),

  getDepartments: () =>
    fetchJSON<Department[]>("/modules/departments"),

  getStats: () =>
    fetchJSON<PlatformStats>("/modules/stats"),

  // Search
  search: (query: string, department?: string, maxResults?: number) => {
    const params = new URLSearchParams({ q: query });
    if (department) params.set("department", department);
    if (maxResults) params.set("max_results", String(maxResults));
    return fetchJSON<SearchResponse>(`/search?${params}`);
  },

  // Graph
  getGraphData: (department?: string) => {
    const params = department
      ? `?department=${encodeURIComponent(department)}`
      : "";
    return fetchJSON<GraphData>(`/graph/data${params}`);
  },

  // Orchestrator
  routeQuery: (query: string, maxModules?: number) =>
    fetchJSON<RouteResponse>("/orchestrator/route", {
      method: "POST",
      body: JSON.stringify({
        query,
        max_modules: maxModules || 5,
      }),
    }),

  // Context
  compileContext: (params: {
    query?: string;
    module_slugs?: string[];
    max_principles?: number;
    output_format?: string;
  }) =>
    fetchJSON<{
      compiled_markdown: string;
      modules: any[];
      total_principles: number;
      total_rules: number;
    }>("/context/compile", {
      method: "POST",
      body: JSON.stringify(params),
    }),
};
