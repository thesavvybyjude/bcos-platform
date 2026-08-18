"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type CompiledContext } from "@/lib/api";
import {
  getFavorites,
  toggleFavorite,
  type StoredFavorite,
  STORAGE_EVENT,
} from "@/lib/storage";
import {
  Star,
  Sparkles,
  BookOpen,
  ArrowRight,
  Trash2,
  Copy,
  Download,
  X,
  Search,
  Bookmark,
  Layers,
  Compass,
} from "lucide-react";

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<StoredFavorite[]>([]);
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState<string>("All");
  const [isCompiling, setIsCompiling] = useState(false);
  const [compiledResult, setCompiledResult] = useState<CompiledContext | null>(
    null
  );
  const [copied, setCopied] = useState(false);

  function loadFavs() {
    setFavorites(getFavorites());
  }

  useEffect(() => {
    loadFavs();
    const handleUpdate = () => loadFavs();
    window.addEventListener(STORAGE_EVENT, handleUpdate);
    return () => window.removeEventListener(STORAGE_EVENT, handleUpdate);
  }, []);

  const departments = ["All", ...Array.from(new Set(favorites.map((f) => f.department))).sort()];

  const filteredFavorites = favorites.filter((fav) => {
    const matchesSearch =
      fav.name.toLowerCase().includes(search.toLowerCase()) ||
      fav.department.toLowerCase().includes(search.toLowerCase()) ||
      (fav.description && fav.description.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (selectedDept !== "All" && fav.department !== selectedDept) return false;
    return true;
  });

  async function handleCompileAllFavorites() {
    if (favorites.length === 0) return;
    setIsCompiling(true);
    try {
      const res = await api.compileContext({
        module_slugs: favorites.map((f) => f.slug),
        output_format: "markdown",
      });
      setCompiledResult(res);
    } catch (err) {
      console.error("Failed to compile favorites:", err);
      alert("Failed to compile context from favorites.");
    } finally {
      setIsCompiling(false);
    }
  }

  function handleCopyMarkdown() {
    if (!compiledResult) return;
    navigator.clipboard.writeText(compiledResult.compiled_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadMarkdown() {
    if (!compiledResult) return;
    const blob = new Blob([compiledResult.compiled_markdown], {
      type: "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my-favorites-context.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#151b2d]/90 via-[#0c1324]/90 to-[#191f31]/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-3 py-1 text-xs font-semibold text-amber-400">
              <Star className="h-3.5 w-3.5 fill-amber-400" />
              <span>Starred Knowledge</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#dce1fb]">
              Favorites & Bookmarks
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Quickly reference your most critical frameworks, principles, and playbooks. One-click compile all your favorites into custom AI context packages.
            </p>
          </div>

          {/* Compile Button */}
          {favorites.length > 0 && (
            <button
              onClick={handleCompileAllFavorites}
              disabled={isCompiling}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 px-5 py-3 text-sm font-bold shadow-lg shadow-amber-500/25 transition-all self-start md:self-auto disabled:opacity-50"
            >
              <Sparkles className="h-4 w-4" />
              <span>{isCompiling ? "Compiling..." : "Compile All Favorites"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      {favorites.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search in favorites..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-[#151b2d]/80 py-2.5 pl-10 pr-4 text-sm text-[#dce1fb] placeholder-slate-500 focus:border-amber-400 focus:outline-none focus:ring-1 focus:ring-amber-400"
            />
          </div>

          {/* Department Pills */}
          <div className="flex flex-wrap gap-1.5 overflow-x-auto w-full sm:w-auto">
            {departments.map((dept) => (
              <button
                key={dept}
                onClick={() => setSelectedDept(dept)}
                className={`rounded-lg px-3 py-1 text-xs font-medium transition-all ${
                  selectedDept === dept
                    ? "bg-amber-400 text-slate-950 font-bold shadow-md shadow-amber-400/20"
                    : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 border border-white/5"
                }`}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Favorites List */}
      {favorites.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-[#151b2d]/50 p-16 text-center backdrop-blur-xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-400 ring-1 ring-amber-400/20 mb-4">
            <Star className="h-8 w-8" />
          </div>
          <h3 className="text-lg font-bold text-[#dce1fb]">
            No favorites starred yet
          </h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto mt-2 leading-relaxed">
            Star modules and operational guides across the platform to build your personal quick-access library.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link
              href="/modules"
              className="inline-flex items-center gap-2 rounded-xl bg-[#6b89ff] hover:bg-[#5877ee] text-white px-5 py-2.5 text-xs font-semibold shadow-md transition-all"
            >
              <BookOpen className="h-4 w-4" />
              <span>Browse 249 Modules</span>
            </Link>
            <Link
              href="/domains"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 px-4 py-2.5 text-xs font-medium transition-all"
            >
              <Layers className="h-4 w-4" />
              <span>Explore Domains</span>
            </Link>
          </div>
        </div>
      ) : filteredFavorites.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <Search className="mx-auto h-10 w-10 text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">
            No matching favorites found
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search query or department filter.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredFavorites.map((fav) => (
            <div
              key={fav.slug}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-[#151b2d]/80 p-6 backdrop-blur-xl transition-all duration-300 hover:border-amber-400/30 hover:bg-[#191f31]/95 hover:shadow-xl hover:shadow-[#0c1324]/50"
            >
              <div>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <span className="rounded-md bg-amber-400/10 px-2 py-0.5 text-[10px] font-semibold text-amber-400 border border-amber-400/20 font-mono">
                      {fav.department}
                    </span>
                  </div>

                  <button
                    onClick={() => toggleFavorite(fav)}
                    className="text-amber-400 hover:text-amber-300 transition-colors p-1"
                    title="Remove from Favorites"
                  >
                    <Star className="h-4 w-4 fill-amber-400" />
                  </button>
                </div>

                <Link href={`/modules/${fav.slug}`}>
                  <h3 className="font-bold text-base text-[#dce1fb] group-hover:text-white transition-colors mt-3">
                    {fav.name}
                  </h3>
                </Link>

                {fav.description && (
                  <p className="mt-2 text-xs text-slate-400 line-clamp-3 leading-relaxed">
                    {fav.description}
                  </p>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                <Link
                  href={`/modules/${fav.slug}`}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b8c4ff] hover:text-white transition-colors"
                >
                  <span>Read Guide</span>
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </Link>

                <span className="text-[10px] text-slate-500 font-mono">
                  Saved{" "}
                  {new Date(fav.savedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Compiled Context Modal */}
      {compiledResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-[#151b2d] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-amber-400" />
                <div>
                  <h2 className="text-lg font-bold text-[#dce1fb]">
                    Compiled Favorites Context Package
                  </h2>
                  <p className="text-xs text-slate-400">
                    {compiledResult.modules.length} modules •{" "}
                    {compiledResult.total_principles} principles •{" "}
                    {compiledResult.total_rules} rules
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCompiledResult(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-[#0c1324]/50">
              <pre className="text-xs font-mono text-slate-300 whitespace-pre-wrap leading-relaxed">
                {compiledResult.compiled_markdown}
              </pre>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 p-4 bg-[#151b2d]">
              <span className="text-xs text-slate-400 font-mono">
                AI-Ready Markdown Package
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyMarkdown}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-white/10 transition-colors"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copied ? "Copied!" : "Copy Markdown"}</span>
                </button>
                <button
                  onClick={handleDownloadMarkdown}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 px-4 py-2 text-xs font-bold shadow-md transition-colors"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download .md</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
