"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api, type ModuleDetail } from "@/lib/api";
import {
  ArrowLeft,
  BookOpen,
  Layers,
  Shield,
  GitBranch,
  ChevronRight,
  FileText,
} from "lucide-react";

export default function ModuleDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [module, setModule] = useState<ModuleDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<
    "principles" | "rules" | "decisions" | "raw"
  >("principles");

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getModule(slug);
        setModule(data);
      } catch (err) {
        console.error("Failed to load module:", err);
      } finally {
        setLoading(false);
      }
    }
    if (slug) load();
  }, [slug]);

  if (loading) {
    return (
      <div className="animate-fade-in space-y-6">
        <div className="h-8 w-64 animate-pulse rounded bg-white/5" />
        <div className="h-32 w-full animate-pulse rounded-xl bg-white/5" />
        <div className="h-64 w-full animate-pulse rounded-xl bg-white/5" />
      </div>
    );
  }

  if (!module) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <BookOpen className="h-16 w-16 text-surface-200/20" />
        <h2 className="mt-4 text-xl font-semibold text-surface-200/50">
          Module not found
        </h2>
        <Link
          href="/modules"
          className="mt-4 text-sm text-brand-400 hover:text-brand-300"
        >
          ← Back to modules
        </Link>
      </div>
    );
  }

  const deptBadge: Record<string, string> = {
    Marketing: "badge-marketing",
    Business: "badge-business",
    CEO: "badge-ceo",
    Technology: "badge-technology",
  };

  const ruleTypeColor: Record<string, string> = {
    Always: "rule-always",
    Never: "rule-never",
    Avoid: "rule-avoid",
    Prefer: "rule-prefer",
  };

  const ruleTypeIcon: Record<string, string> = {
    Always: "✅",
    Never: "🚫",
    Avoid: "⚠️",
    Prefer: "💡",
  };

  const tabs = [
    {
      key: "principles" as const,
      label: "Principles",
      count: module.principles.length,
      icon: Layers,
    },
    {
      key: "rules" as const,
      label: "Rules",
      count: module.rules.length,
      icon: Shield,
    },
    {
      key: "decisions" as const,
      label: "Decision Trees",
      count: module.decision_trees.length,
      icon: GitBranch,
    },
    {
      key: "raw" as const,
      label: "Raw Content",
      count: 0,
      icon: FileText,
    },
  ];

  return (
    <div className="animate-fade-in space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-surface-200/40">
        <Link
          href="/modules"
          className="flex items-center gap-1 hover:text-brand-400 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Modules
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="text-surface-200/60">{module.department}</span>
        <ChevronRight className="h-3 w-3" />
        <span className="text-surface-50">{module.name}</span>
      </div>

      {/* Header */}
      <div className="glass-card p-8">
        <div className="flex items-start justify-between">
          <div>
            <span
              className={`badge ${deptBadge[module.department] || "badge-business"}`}
            >
              {module.department}
            </span>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-surface-50">
              {module.name}
            </h1>
            <p className="mt-2 max-w-3xl text-surface-200/60">
              {module.description}
            </p>
            {module.purpose && (
              <p className="mt-3 text-sm text-surface-200/40">
                <strong className="text-surface-200/60">Purpose:</strong>{" "}
                {module.purpose}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-6 flex gap-6 border-t border-white/5 pt-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-brand-400">
              {module.principles.length}
            </p>
            <p className="text-xs text-surface-200/40">Principles</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-400">
              {module.rules.length}
            </p>
            <p className="text-xs text-surface-200/40">Rules</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-400">
              {module.decision_trees.length}
            </p>
            <p className="text-xs text-surface-200/40">Decision Trees</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-cyan-400">
              {module.cross_references.length}
            </p>
            <p className="text-xs text-surface-200/40">Cross-References</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-white/[0.02] p-1 ring-1 ring-white/5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/20"
                  : "text-surface-200/40 hover:text-surface-200/70"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1 rounded-full bg-white/5 px-2 py-0.5 text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="animate-fade-in">
        {activeTab === "principles" && (
          <div className="space-y-3">
            {module.principles.length === 0 ? (
              <EmptyState label="No principles extracted" />
            ) : (
              module.principles
                .sort((a, b) => a.order_index - b.order_index)
                .map((p, idx) => (
                  <div
                    key={p.id}
                    className="glass-card p-5 transition-all duration-200 hover:border-brand-500/10"
                  >
                    <div className="flex items-start gap-4">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-sm font-bold text-brand-400 ring-1 ring-brand-500/20">
                        {idx + 1}
                      </span>
                      <div>
                        <h3 className="font-semibold text-surface-50">
                          {p.title}
                        </h3>
                        <p className="mt-1 text-sm text-surface-200/60 leading-relaxed">
                          {p.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === "rules" && (
          <div className="space-y-3">
            {module.rules.length === 0 ? (
              <EmptyState label="No rules extracted" />
            ) : (
              module.rules
                .sort((a, b) => a.order_index - b.order_index)
                .map((r) => (
                  <div
                    key={r.id}
                    className={`glass-card p-5 ${ruleTypeColor[r.rule_type] || ""}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-lg">
                        {ruleTypeIcon[r.rule_type] || "📌"}
                      </span>
                      <div>
                        <span className="inline-block rounded px-2 py-0.5 text-xs font-semibold uppercase tracking-wider text-surface-200/60 bg-white/5 mb-1">
                          {r.rule_type}
                        </span>
                        <p className="text-sm text-surface-200/70 leading-relaxed">
                          {r.statement}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        )}

        {activeTab === "decisions" && (
          <div className="space-y-3">
            {module.decision_trees.length === 0 ? (
              <EmptyState label="No decision trees extracted" />
            ) : (
              module.decision_trees.map((dt) => (
                <div key={dt.id} className="glass-card p-5">
                  <h3 className="font-semibold text-surface-50">{dt.name}</h3>
                  <div className="mt-3 space-y-2">
                    {dt.condition && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="shrink-0 rounded bg-blue-500/10 px-2 py-0.5 text-xs font-medium text-blue-400">
                          IF
                        </span>
                        <p className="text-surface-200/60">{dt.condition}</p>
                      </div>
                    )}
                    {dt.action && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="shrink-0 rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400">
                          THEN
                        </span>
                        <p className="text-surface-200/60">{dt.action}</p>
                      </div>
                    )}
                    {dt.otherwise && (
                      <div className="flex items-start gap-2 text-sm">
                        <span className="shrink-0 rounded bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-400">
                          ELSE
                        </span>
                        <p className="text-surface-200/60">{dt.otherwise}</p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "raw" && (
          <div className="glass-card p-6">
            <pre className="whitespace-pre-wrap text-sm text-surface-200/60 font-mono leading-relaxed max-h-[600px] overflow-y-auto">
              {module.raw_content || "No raw content available"}
            </pre>
          </div>
        )}
      </div>

      {/* Cross-references */}
      {module.cross_references.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="font-semibold text-surface-50 mb-4">
            Related Modules
          </h3>
          <div className="flex flex-wrap gap-2">
            {module.cross_references.map((ref) => (
              <Link
                key={ref.id}
                href={`/modules/${ref.target_module_slug}`}
                className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2 text-sm text-surface-200/60 ring-1 ring-white/5 hover:text-brand-300 hover:ring-brand-500/20 transition-all"
              >
                <GitBranch className="h-3 w-3" />
                {ref.target_module_slug}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="glass-card flex items-center justify-center p-12 text-surface-200/30">
      {label}
    </div>
  );
}
