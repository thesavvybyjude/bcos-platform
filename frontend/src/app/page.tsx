"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type PlatformStats, type ModuleSummary } from "@/lib/api";
import {
  BookOpen,
  Brain,
  Search,
  GitBranch,
  ArrowRight,
  Zap,
  Layers,
  Shield,
} from "lucide-react";

export default function DashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [recentModules, setRecentModules] = useState<ModuleSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [statsData, modulesData] = await Promise.all([
          api.getStats(),
          api.getModules({ limit: 6 }),
        ]);
        setStats(statsData);
        setRecentModules(modulesData);
      } catch (err) {
        console.error("Failed to load dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="animate-fade-in space-y-8">
      {/* Hero header */}
      <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-gradient-to-br from-brand-950/50 via-surface-900 to-surface-950 p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(92,124,250,0.15),transparent)]" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-500/10 ring-1 ring-brand-500/20">
              <Brain className="h-6 w-6 text-brand-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                <span className="gradient-text">BCOS Platform</span>
              </h1>
              <p className="text-sm text-surface-200/60">
                Business Context Operating System
              </p>
            </div>
          </div>
          <p className="mt-4 max-w-2xl text-lg text-surface-200/70">
            Your knowledge base is loaded and ready. Browse modules, search for
            insights, or compile AI-ready context packages.
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Modules"
          value={stats?.total_modules ?? "—"}
          icon={<BookOpen className="h-5 w-5" />}
          color="brand"
          loading={loading}
        />
        <StatCard
          label="Principles"
          value={stats?.total_principles ?? "—"}
          icon={<Layers className="h-5 w-5" />}
          color="purple"
          loading={loading}
        />
        <StatCard
          label="Rules"
          value={stats?.total_rules ?? "—"}
          icon={<Shield className="h-5 w-5" />}
          color="emerald"
          loading={loading}
        />
        <StatCard
          label="Departments"
          value={stats?.departments?.length ?? "—"}
          icon={<GitBranch className="h-5 w-5" />}
          color="amber"
          loading={loading}
        />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <QuickAction
          title="Browse Modules"
          description="Explore all knowledge modules organized by department"
          href="/modules"
          icon={<BookOpen className="h-6 w-6" />}
        />
        <QuickAction
          title="Search Knowledge"
          description="Find principles, rules, and decision frameworks"
          href="/search"
          icon={<Search className="h-6 w-6" />}
        />
        <QuickAction
          title="Knowledge Graph"
          description="Visualize module relationships and dependencies"
          href="/graph"
          icon={<GitBranch className="h-6 w-6" />}
        />
      </div>

      {/* Recent modules */}
      {recentModules.length > 0 && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-surface-200">
              Knowledge Modules
            </h2>
            <Link
              href="/modules"
              className="flex items-center gap-1 text-sm text-brand-400 hover:text-brand-300 transition-colors"
            >
              View all <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {recentModules.map((mod) => (
              <ModuleCard key={mod.slug} module={mod} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
  loading,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
}) {
  const colorClasses: Record<string, string> = {
    brand: "text-brand-400 bg-brand-500/10 ring-brand-500/20",
    purple: "text-purple-400 bg-purple-500/10 ring-purple-500/20",
    emerald: "text-emerald-400 bg-emerald-500/10 ring-emerald-500/20",
    amber: "text-amber-400 bg-amber-500/10 ring-amber-500/20",
  };

  return (
    <div className="stat-card group">
      <div className="flex items-center justify-between">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg ring-1 ${colorClasses[color]}`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-4">
        <p className="text-3xl font-bold tracking-tight text-surface-50">
          {loading ? (
            <span className="inline-block h-8 w-16 animate-pulse rounded bg-white/5" />
          ) : (
            value
          )}
        </p>
        <p className="mt-1 text-sm text-surface-200/50">{label}</p>
      </div>
    </div>
  );
}

function QuickAction({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: React.ReactNode;
}) {
  return (
    <Link href={href}>
      <div className="glass-card group flex items-start gap-4 p-6 transition-all duration-300 hover:border-brand-500/30 cursor-pointer">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/20 group-hover:bg-brand-500/20 transition-colors">
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-surface-50 group-hover:text-brand-300 transition-colors">
            {title}
          </h3>
          <p className="mt-1 text-sm text-surface-200/50">{description}</p>
        </div>
      </div>
    </Link>
  );
}

function ModuleCard({ module }: { module: ModuleSummary }) {
  const deptBadge: Record<string, string> = {
    Marketing: "badge-marketing",
    Business: "badge-business",
    CEO: "badge-ceo",
    Technology: "badge-technology",
  };

  return (
    <Link href={`/modules/${module.slug}`}>
      <div className="glass-card group p-6 transition-all duration-300 hover:border-brand-500/20 cursor-pointer h-full">
        <div className="flex items-start justify-between mb-3">
          <span
            className={`badge ${deptBadge[module.department] || "badge-business"}`}
          >
            {module.department}
          </span>
          <Zap className="h-4 w-4 text-surface-200/30 group-hover:text-brand-400 transition-colors" />
        </div>
        <h3 className="font-semibold text-surface-50 group-hover:text-brand-300 transition-colors line-clamp-2">
          {module.name}
        </h3>
        <p className="mt-2 text-sm text-surface-200/50 line-clamp-2">
          {module.description || "No description available"}
        </p>
        <div className="mt-4 flex gap-4 text-xs text-surface-200/40">
          <span>{module.principle_count} principles</span>
          <span>{module.rule_count} rules</span>
        </div>
      </div>
    </Link>
  );
}
