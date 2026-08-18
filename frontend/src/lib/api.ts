/**
 * BCOS Platform — Central API Client
 * 
 * Handles HTTP requests, JWT header injection, and automatic token refreshes.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface ApiOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiOptions = {}
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  // Inject JWT access token if present
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("bcos_access_token");
    if (token && !headers["Authorization"]) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  let response = await fetch(url, { ...options, headers });

  // Handle 401 Unauthorized — attempt token refresh
  if (response.status === 401 && typeof window !== "undefined") {
    const refreshToken = localStorage.getItem("bcos_refresh_token");
    if (refreshToken && !endpoint.includes("/api/auth/")) {
      try {
        const refreshRes = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem("bcos_access_token", data.access_token);
          headers["Authorization"] = `Bearer ${data.access_token}`;
          // Retry original request
          response = await fetch(url, { ...options, headers });
        } else {
          // Token refresh failed -> clear session
          localStorage.removeItem("bcos_access_token");
          localStorage.removeItem("bcos_refresh_token");
          window.location.href = "/login";
        }
      } catch (err) {
        localStorage.removeItem("bcos_access_token");
        localStorage.removeItem("bcos_refresh_token");
        window.location.href = "/login";
      }
    }
  }

  if (!response.ok) {
    let errorMessage = `HTTP Error ${response.status}`;
    try {
      const errJson = await response.json();
      if (errJson.detail) {
        errorMessage = typeof errJson.detail === "string" 
          ? errJson.detail 
          : JSON.stringify(errJson.detail);
      }
    } catch (_) {}
    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// ── Types (mirror backend/src/schemas/__init__.py exactly — keep in sync) ──

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
  created_at?: string | null;
}

export interface ModuleDetail extends Omit<ModuleSummary, "principle_count" | "rule_count" | "decision_tree_count"> {
  purpose: string;
  file_path: string;
  version: number;
  raw_content: string;
  updated_at?: string | null;
  principles: Principle[];
  rules: Rule[];
  decision_trees: DecisionTree[];
  cross_references: CrossReference[];
}

export interface Department {
  name: string;
  module_count: number;
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

export interface RoutedModule {
  module_name: string;
  department: string;
  role: string;
  relevance_score: number;
  matched_keywords: string[];
}

export interface RouteResponse {
  query: string;
  routed_modules: RoutedModule[];
  suggestion: string;
}

export interface CompileContextRequest {
  query?: string;
  module_slugs?: string[];
  max_principles?: number;
  max_rules?: number;
  include_cross_refs?: boolean;
  output_format?: "markdown" | "json";
}

export interface CompiledContext {
  query?: string | null;
  modules: ModuleDetail[];
  compiled_markdown: string;
  total_principles: number;
  total_rules: number;
  total_decision_trees: number;
}

export interface GraphNode {
  id: string;
  label: string;
  type: "department" | "module";
  department?: string;
  size?: number;
}

export interface GraphLink {
  source: string;
  target: string;
  type: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
  total_nodes?: number;
  total_links?: number;
}

// ── Typed API surface ──

export const api = {
  getStats: () => apiRequest<PlatformStats>("/api/modules/stats"),

  getModules: (params?: { department?: string; search?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.department) qs.set("department", params.department);
    if (params?.search) qs.set("search", params.search);
    qs.set("limit", String(params?.limit ?? 50));
    return apiRequest<ModuleSummary[]>(`/api/modules?${qs.toString()}`);
  },

  getModule: (slug: string) => apiRequest<ModuleDetail>(`/api/modules/${slug}`),

  getDepartments: () => apiRequest<Department[]>("/api/modules/departments"),

  search: (query: string, department?: string, maxResults: number = 10) => {
    const qs = new URLSearchParams({ q: query, max_results: String(maxResults) });
    if (department) qs.set("department", department);
    return apiRequest<SearchResponse>(`/api/search?${qs.toString()}`);
  },

  routeQuery: (query: string, maxModules: number = 5) =>
    apiRequest<RouteResponse>("/api/orchestrator/route", {
      method: "POST",
      body: JSON.stringify({ query, max_modules: maxModules }),
    }),

  compileContext: (req: CompileContextRequest) =>
    apiRequest<CompiledContext>("/api/context/compile", {
      method: "POST",
      body: JSON.stringify(req),
    }),

  getGraphData: (department?: string) => {
    const qs = department ? `?department=${encodeURIComponent(department)}` : "";
    return apiRequest<GraphData>(`/api/graph/data${qs}`);
  },
};

