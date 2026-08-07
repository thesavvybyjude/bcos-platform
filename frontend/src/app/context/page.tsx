"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Package, Send, Copy, Check } from "lucide-react";

export default function ContextPage() {
  const [query, setQuery] = useState("");
  const [compiledMarkdown, setCompiledMarkdown] = useState("");
  const [stats, setStats] = useState({ principles: 0, rules: 0, trees: 0 });
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCompile(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    try {
      const data = await api.compileContext({
        query: query.trim(),
        max_principles: 10,
        output_format: "markdown",
      });
      setCompiledMarkdown(data.compiled_markdown);
      setStats({
        principles: data.total_principles,
        rules: data.total_rules,
        trees: 0,
      });
    } catch (err) {
      console.error("Compilation failed:", err);
      setCompiledMarkdown("Error compiling context. Check the API.");
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(compiledMarkdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="animate-fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-surface-50">
          Context Builder
        </h1>
        <p className="mt-1 text-sm text-surface-200/50">
          Compile AI-ready context packages from your knowledge base
        </p>
      </div>

      <form onSubmit={handleCompile}>
        <div className="relative">
          <input
            type="text"
            placeholder="Describe your context need — e.g., 'Brand deal negotiation strategy for a tech sponsor'"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full rounded-xl border border-white/5 bg-white/[0.03] px-5 py-4 pl-12 text-base text-surface-50 placeholder:text-surface-200/30 focus:border-brand-500/30 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition-all"
            autoFocus
          />
          <Package className="absolute left-4 top-4.5 h-5 w-5 text-surface-200/30" />
          <button
            type="submit"
            disabled={loading}
            className="absolute right-3 top-2.5 flex items-center gap-2 rounded-lg bg-brand-500/20 px-4 py-2 text-sm font-medium text-brand-300 hover:bg-brand-500/30 transition-colors disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {loading ? "Compiling..." : "Compile"}
          </button>
        </div>
      </form>

      {compiledMarkdown && (
        <div className="space-y-4">
          {/* Stats bar */}
          <div className="flex items-center justify-between">
            <div className="flex gap-4 text-xs text-surface-200/40">
              <span>{stats.principles} principles</span>
              <span>{stats.rules} rules</span>
              <span>
                {compiledMarkdown.length.toLocaleString()} chars
              </span>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs text-surface-200/60 hover:text-surface-200 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy Markdown
                </>
              )}
            </button>
          </div>

          {/* Compiled output */}
          <div className="glass-card p-6 max-h-[600px] overflow-y-auto">
            <pre className="whitespace-pre-wrap text-sm text-surface-200/70 font-mono leading-relaxed">
              {compiledMarkdown}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
