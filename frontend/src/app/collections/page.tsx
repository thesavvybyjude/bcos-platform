"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type ModuleSummary, type CompiledContext } from "@/lib/api";
import {
  getCollections,
  saveCollection,
  deleteCollection,
  toggleModuleInCollection,
  type StoredCollection,
  STORAGE_EVENT,
} from "@/lib/storage";
import {
  FolderKanban,
  Plus,
  Trash2,
  Package,
  Layers,
  Sparkles,
  Search,
  X,
  Check,
  Download,
  Copy,
  ExternalLink,
  BookOpen,
  Share2,
} from "lucide-react";

export default function CollectionsPage() {
  const [collections, setCollections] = useState<StoredCollection[]>([]);
  const [modules, setModules] = useState<ModuleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [newColColor, setNewColColor] = useState("#6b89ff");
  const [selectedSlugs, setSelectedSlugs] = useState<string[]>([]);
  const [moduleSearch, setModuleSearch] = useState("");

  // Context compile state
  const [compilingColId, setCompilingColId] = useState<string | null>(null);
  const [compiledResult, setCompiledResult] = useState<{
    name: string;
    data: CompiledContext;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const colors = [
    "#6b89ff",
    "#ffb77d",
    "#a78bfa",
    "#34d399",
    "#f472b6",
    "#fbbf24",
    "#38bdf8",
  ];

  function loadData() {
    setCollections(getCollections());
  }

  useEffect(() => {
    loadData();
    async function fetchModules() {
      try {
        const data = await api.getModules({ limit: 300 });
        setModules(data);
      } catch (err) {
        console.error("Failed to load modules:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchModules();

    const handleUpdate = () => loadData();
    window.addEventListener(STORAGE_EVENT, handleUpdate);
    return () => window.removeEventListener(STORAGE_EVENT, handleUpdate);
  }, []);

  function handleCreateCollection(e: React.FormEvent) {
    e.preventDefault();
    if (!newColName.trim()) return;

    saveCollection({
      name: newColName.trim(),
      description: newColDesc.trim(),
      color: newColColor,
      moduleSlugs: selectedSlugs,
    });

    setNewColName("");
    setNewColDesc("");
    setSelectedSlugs([]);
    setIsCreateModalOpen(false);
  }

  async function handleCompileCollection(col: StoredCollection) {
    if (col.moduleSlugs.length === 0) {
      alert("This collection has no modules. Add some modules first!");
      return;
    }

    setCompilingColId(col.id);
    try {
      const res = await api.compileContext({
        module_slugs: col.moduleSlugs,
        output_format: "markdown",
      });
      setCompiledResult({ name: col.name, data: res });
    } catch (err) {
      console.error("Failed to compile context:", err);
      alert("Failed to compile collection context.");
    } finally {
      setCompilingColId(null);
    }
  }

  function handleCopyMarkdown() {
    if (!compiledResult) return;
    navigator.clipboard.writeText(compiledResult.data.compiled_markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadMarkdown() {
    if (!compiledResult) return;
    const blob = new Blob([compiledResult.data.compiled_markdown], {
      type: "text/markdown",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${compiledResult.name.toLowerCase().replace(/\s+/g, "-")}-context.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const filteredPickerModules = modules.filter(
    (m) =>
      m.name.toLowerCase().includes(moduleSearch.toLowerCase()) ||
      m.department.toLowerCase().includes(moduleSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#151b2d]/90 via-[#0c1324]/90 to-[#191f31]/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-[#ffb77d]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#ffb77d]/30 bg-[#ffb77d]/10 px-3 py-1 text-xs font-semibold text-[#ffb77d]">
              <FolderKanban className="h-3.5 w-3.5" />
              <span>Playbooks & Bundles</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#dce1fb]">
              Knowledge Collections
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Curate and compile bespoke operational bundles from across 249 business modules. Package targeted playbooks to serve to AI agents or onboard team members.
            </p>
          </div>

          {/* Action Button */}
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#6b89ff] hover:bg-[#5877ee] text-white px-5 py-3 text-sm font-semibold shadow-lg shadow-[#6b89ff]/25 transition-all self-start md:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Collection</span>
          </button>
        </div>
      </div>

      {/* Collections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {collections.map((col) => {
          const colModules = modules.filter((m) =>
            col.moduleSlugs.includes(m.slug)
          );
          const totalPrinciples = colModules.reduce(
            (acc, m) => acc + (m.principle_count || 0),
            0
          );
          const totalRules = colModules.reduce(
            (acc, m) => acc + (m.rule_count || 0),
            0
          );

          return (
            <div
              key={col.id}
              className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/10 bg-[#151b2d]/80 p-6 backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-[#191f31]/95 hover:shadow-2xl"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1"
                      style={{
                        backgroundColor: `${col.color}20`,
                        color: col.color,
                        borderColor: `${col.color}40`,
                      }}
                    >
                      <Package className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-[#dce1fb] group-hover:text-white transition-colors">
                        {col.name}
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {col.moduleSlugs.length}{" "}
                        {col.moduleSlugs.length === 1 ? "module" : "modules"} •{" "}
                        {totalPrinciples} principles • {totalRules} rules
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (
                        confirm(
                          `Are you sure you want to delete "${col.name}"?`
                        )
                      ) {
                        deleteCollection(col.id);
                      }
                    }}
                    className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                    title="Delete Collection"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {col.description && (
                  <p className="mt-3 text-xs text-slate-300 leading-relaxed">
                    {col.description}
                  </p>
                )}

                {/* Modules Included */}
                <div className="mt-5 space-y-2">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                    Included Modules:
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                    {col.moduleSlugs.length === 0 ? (
                      <p className="text-xs text-slate-500 italic">
                        No modules added yet.
                      </p>
                    ) : (
                      colModules.map((m) => (
                        <div
                          key={m.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-white/[0.03] px-3 py-2 border border-white/5 text-xs text-slate-300 hover:bg-white/[0.06] transition-colors"
                        >
                          <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-[10px] text-slate-400 font-mono">
                              [{m.department}]
                            </span>
                            <Link
                              href={`/modules/${m.slug}`}
                              className="font-medium hover:text-[#b8c4ff] truncate transition-colors"
                            >
                              {m.name}
                            </Link>
                          </div>
                          <button
                            onClick={() =>
                              toggleModuleInCollection(col.id, m.slug)
                            }
                            className="text-slate-500 hover:text-red-400 p-0.5"
                            title="Remove from collection"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                <button
                  onClick={() => handleCompileCollection(col)}
                  disabled={
                    compilingColId === col.id || col.moduleSlugs.length === 0
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#6b89ff] to-[#4263eb] px-4 py-2 text-xs font-semibold text-white shadow-md hover:from-[#5877ee] hover:to-[#3652d8] transition-all disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>
                    {compilingColId === col.id
                      ? "Compiling AI Context..."
                      : "Compile AI Context"}
                  </span>
                </button>

                <span className="text-[10px] text-slate-500 font-mono">
                  Updated{" "}
                  {new Date(col.updatedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Collection Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#151b2d] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <FolderKanban className="h-5 w-5 text-[#6b89ff]" />
                <h2 className="text-lg font-bold text-[#dce1fb]">
                  Create Knowledge Collection
                </h2>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCollection} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Collection Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Executive Operations Suite"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0c1324] px-3.5 py-2.5 text-sm text-[#dce1fb] placeholder-slate-500 focus:border-[#6b89ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="What is the objective or target use-case for this bundle?"
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  className="w-full rounded-xl border border-white/10 bg-[#0c1324] px-3.5 py-2 text-sm text-[#dce1fb] placeholder-slate-500 focus:border-[#6b89ff] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Color Accent
                </label>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColColor(c)}
                      className={`h-7 w-7 rounded-full transition-transform ${
                        newColColor === c
                          ? "scale-125 ring-2 ring-white"
                          : "opacity-70 hover:opacity-100"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              {/* Module Multi-Select */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Select Modules ({selectedSlugs.length} selected)
                </label>
                <div className="relative mb-2">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search modules to add..."
                    value={moduleSearch}
                    onChange={(e) => setModuleSearch(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#0c1324] py-1.5 pl-9 pr-3 text-xs text-[#dce1fb] placeholder-slate-500 focus:border-[#6b89ff] focus:outline-none"
                  />
                </div>

                <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl border border-white/5 bg-[#0c1324] p-2 custom-scrollbar">
                  {filteredPickerModules.slice(0, 50).map((m) => {
                    const isSelected = selectedSlugs.includes(m.slug);
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => {
                          if (isSelected) {
                            setSelectedSlugs(
                              selectedSlugs.filter((s) => s !== m.slug)
                            );
                          } else {
                            setSelectedSlugs([...selectedSlugs, m.slug]);
                          }
                        }}
                        className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-left text-xs transition-colors ${
                          isSelected
                            ? "bg-[#6b89ff]/20 text-white font-medium"
                            : "text-slate-300 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="truncate pr-2">
                          <span className="text-[10px] text-slate-400 font-mono mr-1.5">
                            [{m.department}]
                          </span>
                          <span>{m.name}</span>
                        </div>
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 text-[#6b89ff] shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-xl border border-white/10 px-4 py-2 text-xs font-medium text-slate-300 hover:bg-white/5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-[#6b89ff] hover:bg-[#5877ee] px-5 py-2 text-xs font-semibold text-white shadow-md shadow-[#6b89ff]/25"
                >
                  Save Collection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Compiled Result Modal */}
      {compiledResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-white/10 bg-[#151b2d] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 p-6">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-[#b8c4ff]" />
                <div>
                  <h2 className="text-lg font-bold text-[#dce1fb]">
                    Compiled AI Context: {compiledResult.name}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {compiledResult.data.modules.length} modules •{" "}
                    {compiledResult.data.total_principles} principles •{" "}
                    {compiledResult.data.total_rules} rules
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
                {compiledResult.data.compiled_markdown}
              </pre>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 p-4 bg-[#151b2d]">
              <span className="text-xs text-slate-400 font-mono">
                Ready for AI agent prompts or LLM context ingestion
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
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#6b89ff] hover:bg-[#5877ee] px-4 py-2 text-xs font-semibold text-white shadow-md transition-colors"
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
