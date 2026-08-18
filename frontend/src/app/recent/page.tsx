"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getRecentViews,
  clearRecentViews,
  toggleFavorite,
  isFavorite,
  type StoredRecent,
  STORAGE_EVENT,
} from "@/lib/storage";
import {
  Clock,
  BookOpen,
  ArrowRight,
  Trash2,
  Star,
  Search,
  ExternalLink,
  History,
  Layers,
} from "lucide-react";

export default function RecentActivityPage() {
  const [recentViews, setRecentViews] = useState<StoredRecent[]>([]);
  const [search, setSearch] = useState("");

  function loadRecent() {
    setRecentViews(getRecentViews());
  }

  useEffect(() => {
    loadRecent();
    const handleUpdate = () => loadRecent();
    window.addEventListener(STORAGE_EVENT, handleUpdate);
    return () => window.removeEventListener(STORAGE_EVENT, handleUpdate);
  }, []);

  function formatTimeAgo(isoString: string): string {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

      if (diffSec < 60) return "Just now";
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
      if (diffSec < 172800) return "Yesterday";
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
    } catch {
      return "Recently";
    }
  }

  const filteredRecent = recentViews.filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.department.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#151b2d]/90 via-[#0c1324]/90 to-[#191f31]/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-400">
              <Clock className="h-3.5 w-3.5" />
              <span>Activity History</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#dce1fb]">
              Recent Activity
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Quickly re-open your recently viewed knowledge modules and operational frameworks.
            </p>
          </div>

          {recentViews.length > 0 && (
            <button
              onClick={() => {
                if (confirm("Are you sure you want to clear your recent history?")) {
                  clearRecentViews();
                }
              }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 px-4 py-2.5 text-xs font-medium text-slate-300 transition-all self-start md:self-auto"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear History</span>
            </button>
          )}
        </div>
      </div>

      {/* Search Input */}
      {recentViews.length > 0 && (
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search recent items..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#151b2d]/80 py-2.5 pl-10 pr-4 text-sm text-[#dce1fb] placeholder-slate-500 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
          />
        </div>
      )}

      {/* Activity Timeline List */}
      {recentViews.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#151b2d]/50 p-16 text-center backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-400 ring-1 ring-emerald-400/20 mb-4">
            <History className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-[#dce1fb]">
            No recent activity recorded
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
            As you explore knowledge modules and operational frameworks across the platform, your reading history will appear here for fast re-access.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/modules"
              className="inline-flex items-center gap-2 rounded-xl bg-[#6b89ff] hover:bg-[#5877ee] text-white px-5 py-2.5 text-xs font-semibold shadow-md transition-all"
            >
              <BookOpen className="h-4 w-4" />
              <span>Explore Knowledge Modules</span>
            </Link>
          </div>
        </div>
      ) : filteredRecent.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <Search className="mx-auto h-10 w-10 text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">
            No matching recent items
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Try a different search query.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecent.map((item) => {
            const isFav = isFavorite(item.slug);

            return (
              <div
                key={`${item.slug}-${item.visitedAt}`}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-white/5 bg-[#151b2d]/80 p-5 backdrop-blur-xl transition-all hover:border-emerald-400/30 hover:bg-[#191f31]/95"
              >
                <div className="flex items-start gap-4 overflow-hidden">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.03] text-emerald-400 border border-white/10 group-hover:border-emerald-400/30 transition-colors">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-white/[0.04] px-2 py-0.5 text-[10px] font-semibold text-slate-400 border border-white/5 font-mono">
                        {item.department}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        {formatTimeAgo(item.visitedAt)}
                      </span>
                    </div>
                    <Link href={`/modules/${item.slug}`}>
                      <h3 className="font-bold text-base text-[#dce1fb] group-hover:text-white transition-colors mt-1 truncate">
                        {item.name}
                      </h3>
                    </Link>
                    {item.description && (
                      <p className="mt-1 text-xs text-slate-400 truncate max-w-2xl">
                        {item.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => toggleFavorite(item)}
                    className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-xl transition-colors"
                    title={isFav ? "Remove from Favorites" : "Add to Favorites"}
                  >
                    <Star
                      className={`h-4 w-4 ${
                        isFav ? "fill-amber-400 text-amber-400" : ""
                      }`}
                    />
                  </button>

                  <Link
                    href={`/modules/${item.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 px-4 py-2 text-xs font-semibold border border-white/5 transition-colors"
                  >
                    <span>Open Module</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
