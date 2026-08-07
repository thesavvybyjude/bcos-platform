"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type ModuleSummary, type Department } from "@/lib/api";
import { BookOpen, Filter, Layers, Shield, Zap } from "lucide-react";

export default function ModulesPage() {
  const [modules, setModules] = useState<ModuleSummary[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [activeDept, setActiveDept] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [mods, depts] = await Promise.all([
          api.getModules({
            department: activeDept || undefined,
            search: searchTerm || undefined,
            limit: 100,
          }),
          api.getDepartments(),
        ]);
        setModules(mods);
        setDepartments(depts);
      } catch (err) {
        console.error("Failed to load modules:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [activeDept, searchTerm]);

  const deptColors: Record<string, string> = {
    Marketing: "from-purple-500/20 to-purple-500/5 border-purple-500/20",
    Business: "from-emerald-500/20 to-emerald-500/5 border-emerald-500/20",
    CEO: "from-amber-500/20 to-amber-500/5 border-amber-500/20",
    Technology: "from-cyan-500/20 to-cyan-500/5 border-cyan-500/20",
  };

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
          Knowledge Modules
        </h1>
        <p className="mt-1 text-sm text-surface-200/50">
          Browse {modules.length} modules across {departments.length} departments
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-surface-200/40">
          <Filter className="h-4 w-4" />
          <span className="text-xs font-medium">Filter:</span>
        </div>
        <button
          onClick={() => setActiveDept(null)}
          className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
            !activeDept
              ? "bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/30"
              : "bg-white/[0.03] text-surface-200/50 hover:text-surface-200 ring-1 ring-white/5"
          }`}
        >
          All
        </button>
        {departments.map((dept) => (
          <button
            key={dept.name}
            onClick={() => setActiveDept(dept.name)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-all duration-200 ${
              activeDept === dept.name
                ? "bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/30"
                : "bg-white/[0.03] text-surface-200/50 hover:text-surface-200 ring-1 ring-white/5"
            }`}
          >
            {dept.name} ({dept.module_count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search modules by name or description..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full rounded-xl border border-white/5 bg-white/[0.03] px-4 py-3 pl-10 text-sm text-surface-50 placeholder:text-surface-200/30 focus:border-brand-500/30 focus:outline-none focus:ring-1 focus:ring-brand-500/20 transition-all"
        />
        <BookOpen className="absolute left-3 top-3.5 h-4 w-4 text-surface-200/30" />
      </div>

      {/* Module grid */}
      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass-card animate-pulse p-6">
              <div className="h-4 w-20 rounded bg-white/5" />
              <div className="mt-3 h-5 w-3/4 rounded bg-white/5" />
              <div className="mt-2 h-12 w-full rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : modules.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center p-12 text-center">
          <BookOpen className="h-12 w-12 text-surface-200/20" />
          <p className="mt-4 text-lg font-medium text-surface-200/40">
            No modules found
          </p>
          <p className="mt-1 text-sm text-surface-200/30">
            Try a different filter or search term
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((mod) => (
            <Link key={mod.slug} href={`/modules/${mod.slug}`}>
              <div
                className={`glass-card group cursor-pointer p-6 transition-all duration-300 hover:border-brand-500/20 h-full bg-gradient-to-br ${
                  deptColors[mod.department] || "from-white/5 to-white/0"
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className={`badge ${deptBadge[mod.department] || "badge-business"}`}
                  >
                    {mod.department}
                  </span>
                  <Zap className="h-4 w-4 text-surface-200/20 group-hover:text-brand-400 transition-colors" />
                </div>
                <h3 className="font-semibold text-surface-50 group-hover:text-brand-300 transition-colors line-clamp-2">
                  {mod.name}
                </h3>
                <p className="mt-2 text-sm text-surface-200/40 line-clamp-3">
                  {mod.description || "No description available"}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs text-surface-200/30">
                  <span className="flex items-center gap-1">
                    <Layers className="h-3 w-3" />
                    {mod.principle_count} principles
                  </span>
                  <span className="flex items-center gap-1">
                    <Shield className="h-3 w-3" />
                    {mod.rule_count} rules
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
