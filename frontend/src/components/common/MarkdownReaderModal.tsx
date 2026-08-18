"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import {
  X,
  FileText,
  Copy,
  Check,
  Download,
  ExternalLink,
  BookOpen,
  Layers,
  Shield,
  GitBranch,
  Sparkles,
  Search,
  Code2,
  Eye,
  Star,
} from "lucide-react";
import { api, type ModuleDetail } from "@/lib/api";
import { toggleFavorite, isFavorite, STORAGE_EVENT } from "@/lib/storage";

interface MarkdownReaderModalProps {
  slug: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MarkdownReaderModal({
  slug,
  isOpen,
  onClose,
}: MarkdownReaderModalProps) {
  const [moduleData, setModuleData] = useState<ModuleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [viewMode, setViewMode] = useState<"rendered" | "structured" | "raw">(
    "rendered"
  );

  useEffect(() => {
    if (!isOpen || !slug) return;
    const currentSlug = slug.trim();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        // 1. Try direct fetch
        let data: ModuleDetail | null = null;
        try {
          data = await api.getModule(currentSlug);
        } catch (e) {
          // 2. If direct fails, try clean slug
          const cleanSlug = currentSlug
            .replace(/^dept-/, "")
            .replace(/\.md$/, "")
            .replace(/[_\-\s]+/g, "")
            .toLowerCase();
          try {
            data = await api.getModule(cleanSlug);
          } catch (e2) {
            // 3. If that fails, fallback to search query
            const searchRes = await api.search(currentSlug.replace(/\.md$/, ""), undefined, 1);
            if (searchRes.results && searchRes.results.length > 0) {
              data = await api.getModule(searchRes.results[0].module.slug);
            }
          }
        }

        if (data) {
          setModuleData(data);
          setFavorited(isFavorite(data.slug));
        } else {
          setError(`Module "${currentSlug}" could not be located.`);
        }
      } catch (err: any) {
        console.error("Failed to load markdown module file:", err);
        setError("Could not load module file. Please verify module slug.");
      } finally {
        setLoading(false);
      }
    }
    load();

  }, [isOpen, slug]);

  useEffect(() => {
    const handleStorage = () => {
      if (moduleData) setFavorited(isFavorite(moduleData.slug));
    };
    window.addEventListener(STORAGE_EVENT, handleStorage);
    return () => window.removeEventListener(STORAGE_EVENT, handleStorage);
  }, [moduleData]);

  if (!isOpen) return null;

  const handleCopyPayload = () => {
    if (!moduleData) return;
    const content =
      moduleData.raw_content ||
      `# ${moduleData.name}\n\n${moduleData.description}`;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!moduleData) return;
    const content =
      moduleData.raw_content ||
      `# ${moduleData.name}\n\n${moduleData.description}`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${moduleData.slug || "module"}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] bg-[#151b2d] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#dce1fb]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 border-b border-white/10 bg-[#0c1324]/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6b89ff]/20 text-[#b8c4ff] border border-[#6b89ff]/30">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-[#6b89ff]/20 text-[#b8c4ff] border border-[#6b89ff]/30">
                  {moduleData?.department || "DOCUMENT"}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {moduleData?.slug ? `${moduleData.slug}.md` : "Loading..."}
                </span>
              </div>
              <h2 className="text-base font-bold text-white tracking-tight mt-0.5">
                {moduleData?.name || slug || "Markdown Knowledge Document"}
              </h2>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {/* View Mode Selector */}
            {moduleData && (
              <div className="flex items-center rounded-xl bg-white/[0.04] p-1 border border-white/10 text-xs mr-2">
                <button
                  onClick={() => setViewMode("rendered")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                    viewMode === "rendered"
                      ? "bg-[#6b89ff] text-white font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Eye className="h-3.5 w-3.5" />
                  <span>Reader</span>
                </button>
                <button
                  onClick={() => setViewMode("structured")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                    viewMode === "structured"
                      ? "bg-[#6b89ff] text-white font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Directives</span>
                </button>
                <button
                  onClick={() => setViewMode("raw")}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                    viewMode === "raw"
                      ? "bg-[#6b89ff] text-white font-semibold shadow-sm"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5" />
                  <span>Raw .md</span>
                </button>
              </div>
            )}

            {moduleData && (
              <button
                onClick={() => {
                  toggleFavorite(moduleData);
                  setFavorited(!favorited);
                }}
                className={`p-2 rounded-xl border transition-colors ${
                  favorited
                    ? "bg-amber-400/20 text-amber-300 border-amber-400/30"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                }`}
                title={favorited ? "Favorited" : "Star to Favorites"}
              >
                <Star
                  className={`h-4 w-4 ${
                    favorited ? "fill-amber-400 text-amber-400" : ""
                  }`}
                />
              </button>
            )}

            <button
              onClick={handleCopyPayload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 border border-white/10 transition-colors"
              title="Copy Raw Markdown"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copied ? "Copied" : "Copy Payload"}</span>
            </button>

            <button
              onClick={handleDownloadFile}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
              title="Download .md File"
            >
              <Download className="h-4 w-4" />
            </button>

            {moduleData && (
              <Link
                href={`/modules/${moduleData.slug}`}
                className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
                title="Open Full Module Page"
              >
                <ExternalLink className="h-4 w-4" />
              </Link>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[#0c1324]/40">
          {loading ? (
            <div className="flex h-72 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <FileText className="h-12 w-12 text-[#6b89ff] animate-pulse" />
                <p className="text-sm text-slate-400 font-mono">
                  Fetching Markdown Source File...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="p-8 bg-red-500/10 border border-red-500/20 rounded-2xl text-center">
              <FileText className="h-10 w-10 text-red-400 mx-auto mb-3 opacity-60" />
              <h3 className="text-base font-bold text-red-300 mb-1">
                Unable to load document
              </h3>
              <p className="text-xs text-red-400/80 mb-4">{error}</p>
              <Link
                href="/modules"
                className="inline-flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 text-white px-4 py-2 text-xs font-semibold"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>Browse All Modules</span>
              </Link>
            </div>
          ) : moduleData ? (
            <>
              {/* 1. READER VIEW (Rendered Markdown) */}
              {viewMode === "rendered" && (
                <div className="space-y-6">
                  {/* Top Metadata Strip */}
                  <div className="flex flex-wrap items-center gap-4 rounded-xl border border-white/5 bg-[#151b2d] p-4 text-xs font-mono">
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">
                        Department
                      </span>
                      <span className="text-[#b8c4ff] font-bold">
                        {moduleData.department}
                      </span>
                    </div>
                    <div className="h-6 w-px bg-white/10" />
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">
                        Principles
                      </span>
                      <span className="text-indigo-300 font-bold">
                        {moduleData.principles.length} Principles
                      </span>
                    </div>
                    <div className="h-6 w-px bg-white/10" />
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">
                        Rules
                      </span>
                      <span className="text-emerald-400 font-bold">
                        {moduleData.rules.length} Directives
                      </span>
                    </div>
                    <div className="h-6 w-px bg-white/10" />
                    <div>
                      <span className="text-slate-500 block text-[10px] uppercase">
                        File Path
                      </span>
                      <span className="text-slate-300">
                        {moduleData.file_path || `${moduleData.slug}.md`}
                      </span>
                    </div>
                  </div>

                  {/* Rendered Markdown Typography Container */}
                  <div className="prose prose-invert max-w-none rounded-2xl border border-white/5 bg-[#151b2d]/60 p-8 leading-relaxed text-slate-200">
                    <ReactMarkdown
                      components={{
                        h1: ({ children }) => (
                          <h1 className="text-2xl font-bold text-white border-b border-white/10 pb-3 mb-6">
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className="text-xl font-semibold text-[#b8c4ff] mt-8 mb-4">
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className="text-base font-semibold text-slate-100 mt-6 mb-2">
                            {children}
                          </h3>
                        ),
                        p: ({ children }) => (
                          <p className="text-sm text-slate-300 leading-relaxed mb-4">
                            {children}
                          </p>
                        ),
                        ul: ({ children }) => (
                          <ul className="list-disc list-inside space-y-1.5 text-sm text-slate-300 mb-4">
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-300 mb-4">
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-slate-300">{children}</li>
                        ),
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-4 border-[#6b89ff] bg-[#6b89ff]/10 pl-4 py-2 my-4 text-sm text-slate-200 rounded-r-lg">
                            {children}
                          </blockquote>
                        ),
                        code: ({ children }) => (
                          <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs font-mono text-[#b8c4ff]">
                            {children}
                          </code>
                        ),
                        pre: ({ children }) => (
                          <pre className="rounded-xl border border-white/10 bg-[#070d1f] p-4 text-xs font-mono text-slate-300 overflow-x-auto my-4 leading-relaxed">
                            {children}
                          </pre>
                        ),
                      }}
                    >
                      {moduleData.raw_content ||
                        `# ${moduleData.name}\n\n${moduleData.description}\n\n## Purpose\n${moduleData.purpose || "N/A"}`}
                    </ReactMarkdown>
                  </div>
                </div>
              )}

              {/* 2. STRUCTURED DIRECTIVES VIEW */}
              {viewMode === "structured" && (
                <div className="space-y-6">
                  {/* Purpose */}
                  {moduleData.purpose && (
                    <div className="p-4 bg-[#151b2d] rounded-xl border border-white/5">
                      <h4 className="text-xs font-mono uppercase text-slate-400 mb-1 font-bold">
                        Purpose
                      </h4>
                      <p className="text-sm text-slate-200 leading-relaxed">
                        {moduleData.purpose}
                      </p>
                    </div>
                  )}

                  {/* Rules */}
                  {moduleData.rules.length > 0 && (
                    <div>
                      <h4 className="text-xs font-mono uppercase text-slate-400 mb-3 font-bold">
                        Operational Directives ({moduleData.rules.length})
                      </h4>
                      <div className="space-y-2">
                        {moduleData.rules.map((rule, idx) => {
                          const isAlways =
                            rule.rule_type?.toLowerCase() === "always";
                          const isNever =
                            rule.rule_type?.toLowerCase() === "never";
                          const isAvoid =
                            rule.rule_type?.toLowerCase() === "avoid";

                          return (
                            <div
                              key={idx}
                              className={`p-3.5 rounded-xl border text-xs font-mono ${
                                isAlways
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                                  : isNever
                                  ? "bg-red-500/10 border-red-500/30 text-red-300"
                                  : isAvoid
                                  ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                                  : "bg-blue-500/10 border-blue-500/30 text-blue-300"
                              }`}
                            >
                              <span className="uppercase font-bold text-[10px] tracking-wider block mb-1">
                                [{rule.rule_type}]
                              </span>
                              <p className="font-sans text-slate-200 text-xs leading-relaxed">
                                {rule.statement}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Principles */}
                  {moduleData.principles.length > 0 && (
                    <div>
                      <h4 className="text-xs font-mono uppercase text-slate-400 mb-3 font-bold">
                        Extracted Principles ({moduleData.principles.length})
                      </h4>
                      <div className="space-y-2">
                        {moduleData.principles.map((p, idx) => (
                          <div
                            key={idx}
                            className="p-3.5 rounded-xl border border-white/5 bg-[#151b2d] text-xs"
                          >
                            <h5 className="font-bold text-[#b8c4ff] mb-1">
                              {p.title}
                            </h5>
                            <p className="text-slate-300 leading-relaxed">
                              {p.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. RAW MARKDOWN SOURCE VIEW */}
              {viewMode === "raw" && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase text-slate-400 font-bold">
                      Source Content ({moduleData.raw_content?.length || 0} bytes)
                    </span>
                  </div>
                  <pre className="p-5 bg-[#070d1f] rounded-2xl border border-white/10 font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-[60vh]">
                    {moduleData.raw_content ||
                      `# ${moduleData.name}\n\n${moduleData.description}`}
                  </pre>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
