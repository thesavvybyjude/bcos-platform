"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  FileText,
  Copy,
  Check,
  Download,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Info,
  Calendar,
  Tag,
} from "lucide-react";
import { api, type ModuleDetail } from "@/lib/api";

interface MarkdownReaderModalProps {
  slug: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MarkdownReaderModal({ slug, isOpen, onClose }: MarkdownReaderModalProps) {
  const [moduleData, setModuleData] = useState<ModuleDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen || !slug) return;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const cleanSlug = slug.replace(/^dept-/, "").replace(/\.md$/, "");
        const data = await api.getModule(cleanSlug);
        setModuleData(data);
      } catch (err: any) {
        console.error("Failed to load markdown module file:", err);
        setError("Could not load module file. Please verify module slug.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [isOpen, slug]);

  if (!isOpen) return null;

  const handleCopyPayload = () => {
    if (!moduleData) return;
    const content = moduleData.raw_content || `# ${moduleData.name}\n\n${moduleData.description}`;
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    if (!moduleData) return;
    const content = moduleData.raw_content || `# ${moduleData.name}\n\n${moduleData.description}`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${moduleData.slug || "module"}.md`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4 animate-fade-in select-none">
      <div
        className="w-full max-w-4xl max-h-[85vh] bg-[#151b2d] border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-[#dce1fb]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-white/10 bg-[#070d1f]/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-[#6b89ff]/20 text-[#b8c4ff] border border-[#6b89ff]/30">
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

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyPayload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-mono text-slate-300 border border-white/10 transition-colors"
              title="Copy Raw Markdown"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied" : "Copy Payload"}</span>
            </button>

            <button
              onClick={handleDownloadFile}
              className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 transition-colors"
              title="Download .md File"
            >
              <Download className="h-4 w-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors ml-2"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <FileText className="h-10 w-10 text-[#b8c4ff] animate-pulse" />
                <p className="text-xs text-slate-400 font-mono">Fetching Markdown Source File...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-xl text-center">
              <AlertTriangle className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <p className="text-sm text-red-300 font-medium">{error}</p>
            </div>
          ) : moduleData ? (
            <>
              {/* Module Metadata Stats Pill Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
                <div className="p-3 bg-[#070d1f] rounded-xl border border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase">Principles</span>
                  <span className="text-[#b8c4ff] font-bold text-sm">{moduleData.principle_count || 0} Principles</span>
                </div>
                <div className="p-3 bg-[#070d1f] rounded-xl border border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase">Rules</span>
                  <span className="text-emerald-400 font-bold text-sm">{moduleData.rule_count || 0} Directives</span>
                </div>
                <div className="p-3 bg-[#070d1f] rounded-xl border border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase">Decision Trees</span>
                  <span className="text-amber-400 font-bold text-sm">{moduleData.decision_tree_count || 0} Frameworks</span>
                </div>
                <div className="p-3 bg-[#070d1f] rounded-xl border border-white/5">
                  <span className="text-slate-400 block text-[10px] uppercase">Relevance</span>
                  <span className="text-purple-400 font-bold text-sm">98.5% Score</span>
                </div>
              </div>

              {/* Module Description */}
              <div className="p-4 bg-[#070d1f] rounded-xl border border-white/5">
                <h4 className="text-xs font-mono uppercase text-slate-400 mb-1 font-bold">Executive Purpose</h4>
                <p className="text-sm text-slate-200 leading-relaxed font-sans">{moduleData.description}</p>
              </div>

              {/* Principles & Rules Highlights */}
              {moduleData.rules && moduleData.rules.length > 0 && (
                <div>
                  <h4 className="text-xs font-mono uppercase text-slate-400 mb-3 font-bold">
                    Operational Directives ({moduleData.rules.length})
                  </h4>
                  <div className="space-y-2">
                    {moduleData.rules.map((rule, idx) => {
                      const isAlways = rule.rule_type?.toLowerCase() === "always";
                      const isNever = rule.rule_type?.toLowerCase() === "never";
                      const isAvoid = rule.rule_type?.toLowerCase() === "avoid";

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-xl border text-xs font-mono ${
                            isAlways
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                              : isNever
                              ? "bg-red-500/10 border-red-500/30 text-red-300"
                              : isAvoid
                              ? "bg-amber-500/10 border-amber-500/30 text-amber-300"
                              : "bg-blue-500/10 border-blue-500/30 text-blue-300"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="uppercase font-bold text-[10px] tracking-wider">
                              [{rule.rule_type}]
                            </span>
                          </div>
                          <p className="font-sans text-slate-200 text-xs leading-relaxed">{rule.statement}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Raw Markdown Source Content Display */}
              {moduleData.raw_content && (
                <div>
                  <h4 className="text-xs font-mono uppercase text-slate-400 mb-2 font-bold">
                    Raw Markdown Source Payload
                  </h4>
                  <pre className="p-4 bg-[#070d1f] rounded-xl border border-white/10 font-mono text-xs text-slate-300 whitespace-pre-wrap overflow-x-auto leading-relaxed max-h-96">
                    {moduleData.raw_content}
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
