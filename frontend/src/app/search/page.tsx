"use client";

import { useState } from "react";
import Link from "next/link";
import { api, type SearchResult } from "@/lib/api";
import { Search as SearchIcon, BookOpen, Layers, Shield, Zap } from "lucide-react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await api.search(query.trim(), undefined, 20);
      setResults(data.results);
      setTotal(data.total);
    } catch (err) {
      console.error("Search failed:", err);
      setResults([]);
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
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-surface-50">
          Search Knowledge
        </h1>
        <p className="mt-1 text-sm text-surface-200/50">
          Find principles, rules, and decision frameworks across all modules
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch}>
        <div className="relative">
          <input
            type="text"
            placeholder="Search for anything — e.g., 'pricing strategy', 'delegation', 'content hooks'..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-white/5 bg-white/[0.03] px-5 py-4 pl-12 text-base text-surface-50 placeholder:text-surface-200/30 focus:border-brand-500/30 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            autoFocus
          />
          <SearchIcon className="absolute left-4 top-4.5 h-5 w-5 text-surface-200/30" />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-3 top-2.5 rounded-lg bg-brand-500/20 px-4 py-2 text-sm font-medium text-brand-300 hover:bg-brand-500/30 transition-colors disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {/* Results */}
      {searched && (
        <div className="space-y-4">
          <p className="text-sm text-surface-200/40">
            {loading
              ? "Searching..."
              : `Found ${total} result${total !== 1 ? "s" : ""} for "${query}"`}
          </p>

          {results.length === 0 && !loading && (
            <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
              <SearchIcon className="h-12 w-12 text-surface-200/20" />
              <p className="mt-4 text-lg font-medium text-surface-200/40">
                No results found
              </p>
              <p className="mt-1 text-sm text-surface-200/30">
                Try different keywords or check the module catalog
              </p>
            </div>
          )}

          {results.map((result, idx) => (
            <Link key={idx} href={`/modules/${result.module.slug}`}>
              <div className="glass-card group cursor-pointer p-6 transition-all duration-200 hover:border-brand-500/20">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`badge ${deptBadge[result.module.department] || "badge-business"}`}
                      >
                        {result.module.department}
                      </span>
                      <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] text-surface-200/40 font-mono">
                        score: {result.score.toFixed(1)}
                      </span>
                    </div>
                    <h3 className="font-semibold text-surface-50 group-hover:text-brand-300 transition-colors">
                      {result.module.name}
                    </h3>
                    {result.snippet && (
                      <p className="mt-2 text-sm text-surface-200/50 line-clamp-2">
                        {result.snippet}
                      </p>
                    )}
                    <div className="mt-3 flex gap-4 text-xs text-surface-200/30">
                      <span className="flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {result.module.principle_count} principles
                      </span>
                      <span className="flex items-center gap-1">
                        <Shield className="h-3 w-3" />
                        {result.module.rule_count} rules
                      </span>
                    </div>
                  </div>
                  <Zap className="h-4 w-4 text-surface-200/20 group-hover:text-brand-400 transition-colors shrink-0 ml-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
