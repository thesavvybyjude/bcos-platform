"use client";

import { useState } from "react";
import { api, type RouteResponse } from "@/lib/api";
import { Compass, Send, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function OrchestratorPage() {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleRoute(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await api.routeQuery(query.trim());
      setResult(data);
    } catch (err) {
      console.error("Routing failed:", err);
    } finally {
      setLoading(false);
    }
  }

  const deptBadge: Record<string, string> = {
    Marketing: "badge-marketing",
    Business: "badge-business",
    CEO: "badge-ceo",
    Technology: "badge-technology",
  };

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-surface-50">
          Orchestrator
        </h1>
        <p className="mt-1 text-sm text-surface-200/50">
          Route a natural language query to the most relevant knowledge modules
        </p>
      </div>

      <form onSubmit={handleRoute}>
        <div className="relative">
          <input
            type="text"
            placeholder="Ask anything — e.g., 'How should I price a brand deal?'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-white/5 bg-white/[0.03] px-5 py-4 pl-12 text-base text-surface-50 placeholder:text-surface-200/30 focus:border-brand-500/30 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            autoFocus
          />
          <Compass className="absolute left-4 top-4.5 h-5 w-5 text-surface-200/30" />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-3 top-2.5 flex items-center gap-2 rounded-lg bg-brand-500/20 px-4 py-2 text-sm font-medium text-brand-300 hover:bg-brand-500/30 transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            Route
          </button>
        </div>
      </form>

      {result && (
        <div className="space-y-4">
          {result.suggestion && (
            <div className="glass-card p-4 border-brand-500/20">
              <p className="text-sm text-brand-300">{result.suggestion}</p>
            </div>
          )}

          <div className="space-y-3">
            {result.routed_modules.map((mod, idx) => (
              <div
                key={idx}
                className={`glass-card p-5 transition-all ${
                  mod.role === "primary"
                    ? "border-brand-500/20 ring-1 ring-brand-500/10"
                    : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span
                      className={`badge ${deptBadge[mod.department] || "badge-business"}`}
                    >
                      {mod.department}
                    </span>
                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase ${
                        mod.role === "primary"
                          ? "bg-brand-500/10 text-brand-400"
                          : "bg-white/5 text-surface-200/40"
                      }`}
                    >
                      {mod.role}
                    </span>
                  </div>
                  <span className="text-xs text-surface-200/30 font-mono">
                    score: {mod.relevance_score.toFixed(1)}
                  </span>
                </div>
                <h3 className="mt-2 font-semibold text-surface-50">
                  {mod.module_name}
                </h3>
                {mod.matched_keywords.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {mod.matched_keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-surface-200/40 font-mono"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {result.routed_modules.length === 0 && (
            <div className="glass-card p-8 text-center text-surface-200/40">
              No modules matched. Try different keywords.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
