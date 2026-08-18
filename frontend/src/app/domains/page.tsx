"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, type PlatformStats, type ModuleSummary } from "@/lib/api";
import {
  Layers,
  Search,
  BookOpen,
  ArrowRight,
  GitBranch,
  Sparkles,
  Filter,
  BarChart3,
  TrendingUp,
  FolderTree,
} from "lucide-react";

export default function DomainsPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [modules, setModules] = useState<ModuleSummary[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, modulesData] = await Promise.all([
          api.getStats(),
          api.getModules({ limit: 300 }),
        ]);
        setStats(statsData);
        setModules(modulesData);
      } catch (err) {
        console.error("Failed to load domains data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const departmentCounts = stats?.department_counts || {};
  const departments = Object.keys(departmentCounts).sort();

  // Group departments into domain categories
  const categoryMap: Record<string, string[]> = {
    "Strategy & Leadership": [
      "Strategy",
      "Leadership",
      "CEO",
      "Culture",
      "Founder_Psychology",
      "Psychology",
      "Systems",
    ],
    "Marketing & Growth": [
      "Marketing",
      "Growth",
      "Performance_Marketing",
      "Influencer_Marketing",
      "Content_Strategy",
      "Short_Form_Content",
      "YouTube_Strategy",
      "Personal_Branding_Systems",
      "Brand_Marketing_Sponsorship",
      "Branding",
      "Scarcity",
    ],
    "Sales & Negotiation": [
      "Sales",
      "Negotiation",
      "Negotiation_Tactics",
      "Partnership_Strategy",
      "Partnerships",
      "Lead_Generation",
    ],
    "E-Commerce & Retail": [
      "Retail",
      "Retail_Attribution",
      "D2C_Ecommerce_Strategy",
      "D2C_Marketing_Mix",
      "D2C_Product_Innovation",
      "D2C_Bootstrapping",
      "D2C_Exit_Strategy",
      "D2C_International",
      "Ecom_Channel_Strategy",
      "Ecom_Financial_Planning",
      "Ecom_Inventory_Management",
      "Ecom_Metrics",
      "Ecom_Product_Strategy",
      "Ecom_Team_Structure",
      "Retention_Subscription",
    ],
    "Operations & Finance": [
      "Operations",
      "Finance",
      "Business",
      "Fundraising",
      "Franchising",
      "Hiring",
      "Hospitality",
      "Sourcing",
      "Sourcing_Supply_Chain",
      "Data",
    ],
    "Technology & AI": [
      "Technology",
      "AI_Content",
      "AI_MCP",
      "AI_Tools",
      "Prompting",
      "Communication_Methodology",
    ],
  };

  const categories = ["All", ...Object.keys(categoryMap)];

  // Filter departments based on search and selected category
  const filteredDepartments = departments.filter((dept) => {
    const matchesSearch = dept.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (selectedCategory === "All") return true;
    const categoryDepts = categoryMap[selectedCategory] || [];
    return categoryDepts.some(
      (cd) => cd.toLowerCase() === dept.toLowerCase()
    );
  });

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-[#151b2d]/90 via-[#0c1324]/90 to-[#191f31]/90 p-8 shadow-2xl backdrop-blur-xl">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-[#6b89ff]/10 blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#b8c4ff]/30 bg-[#b8c4ff]/10 px-3 py-1 text-xs font-semibold text-[#b8c4ff]">
              <Layers className="h-3.5 w-3.5" />
              <span>Knowledge Taxonomy</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#dce1fb]">
              Business Domains & Departments
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl">
              Explore the entire operational knowledge base structured across 64 specialized business departments, 249 functional modules, and 3,700+ actionable principles.
            </p>
          </div>

          {/* Quick Metrics Badge Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
              <span className="text-2xl font-bold text-[#b8c4ff]">
                {stats?.departments?.length || 64}
              </span>
              <p className="text-[11px] text-slate-400">Domains</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
              <span className="text-2xl font-bold text-indigo-300">
                {stats?.total_modules || 249}
              </span>
              <p className="text-[11px] text-slate-400">Modules</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
              <span className="text-2xl font-bold text-emerald-400">
                {stats?.total_principles || 3731}
              </span>
              <p className="text-[11px] text-slate-400">Principles</p>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/[0.03] p-3 text-center">
              <span className="text-2xl font-bold text-amber-400">
                {stats?.total_rules || 881}
              </span>
              <p className="text-[11px] text-slate-400">Rules</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search domain or department..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-[#151b2d]/80 py-2.5 pl-10 pr-4 text-sm text-[#dce1fb] placeholder-slate-500 focus:border-[#b8c4ff] focus:outline-none focus:ring-1 focus:ring-[#b8c4ff]"
          />
        </div>

        {/* Domain Graph Link */}
        <Link
          href="/graph"
          className="inline-flex items-center gap-2 rounded-xl border border-[#b8c4ff]/30 bg-[#b8c4ff]/10 px-4 py-2.5 text-xs font-semibold text-[#b8c4ff] hover:bg-[#b8c4ff]/20 transition-all"
        >
          <GitBranch className="h-4 w-4" />
          <span>Interactive Knowledge Graph</span>
        </Link>
      </div>

      {/* Category Pills */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all ${
              selectedCategory === cat
                ? "bg-[#6b89ff] text-white shadow-lg shadow-[#6b89ff]/25 ring-1 ring-[#6b89ff]"
                : "bg-white/[0.04] text-slate-400 hover:bg-white/[0.08] hover:text-slate-200 border border-white/5"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Domains Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-48 animate-pulse rounded-2xl border border-white/5 bg-white/[0.02]"
            />
          ))}
        </div>
      ) : filteredDepartments.length === 0 ? (
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-12 text-center">
          <FolderTree className="mx-auto h-12 w-12 text-slate-600 mb-3" />
          <h3 className="text-base font-semibold text-slate-300">
            No matching domains found
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Try adjusting your search term or selecting a different category.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDepartments.map((dept) => {
            const count = departmentCounts[dept] || 0;
            const deptModules = modules.filter(
              (m) => m.department.toLowerCase() === dept.toLowerCase()
            );

            return (
              <div
                key={dept}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-white/5 bg-[#151b2d]/70 p-6 backdrop-blur-xl transition-all duration-300 hover:border-[#b8c4ff]/30 hover:bg-[#191f31]/90 hover:shadow-xl hover:shadow-[#0c1324]/50"
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6b89ff]/10 text-[#b8c4ff] ring-1 ring-[#6b89ff]/20 group-hover:bg-[#6b89ff]/20 transition-colors">
                        <BookOpen className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-base text-[#dce1fb] group-hover:text-white transition-colors">
                          {dept.replace(/_/g, " ")}
                        </h3>
                        <p className="text-xs text-slate-400">
                          {count} {count === 1 ? "Module" : "Modules"}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Module Preview Tags */}
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {deptModules.slice(0, 3).map((m) => (
                      <Link
                        key={m.id}
                        href={`/modules/${m.slug}`}
                        className="rounded-md bg-white/[0.04] px-2 py-1 text-[11px] font-medium text-slate-300 hover:bg-[#6b89ff]/15 hover:text-[#b8c4ff] border border-white/5 transition-colors truncate max-w-[200px]"
                      >
                        {m.name}
                      </Link>
                    ))}
                    {deptModules.length > 3 && (
                      <span className="rounded-md bg-white/[0.02] px-2 py-1 text-[11px] text-slate-500 font-mono">
                        +{deptModules.length - 3} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                  <Link
                    href={`/modules?department=${encodeURIComponent(dept)}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#b8c4ff] hover:text-white transition-colors"
                  >
                    <span>Browse Modules</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </Link>

                  <Link
                    href={`/graph?department=${encodeURIComponent(dept)}`}
                    className="text-[11px] text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1"
                    title="View Subgraph"
                  >
                    <GitBranch className="h-3 w-3" />
                    <span>Subgraph</span>
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
