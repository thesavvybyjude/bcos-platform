"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { apiRequest } from "@/lib/api";
import {
  BookOpen,
  Edit3,
  Archive,
  CheckCircle,
  Search,
  Filter,
  Loader2,
  ExternalLink,
} from "lucide-react";

interface ModuleSummary {
  id: string;
  name: string;
  slug: string;
  department: string;
  status: string;
  updated_at: string;
}

export default function AdminModulesPage() {
  const [modules, setModules] = useState<ModuleSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("");

  const fetchModules = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<ModuleSummary[]>("/api/modules");
      setModules(data);
    } catch (err: any) {
      console.error("Failed to load modules", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const handleArchive = async (slug: string) => {
    try {
      await apiRequest(`/api/admin/modules/${slug}/archive`, { method: "POST" });
      setModules(modules.map((m) => (m.slug === slug ? { ...m, status: "archived" } : m)));
    } catch (err: any) {
      alert(`Failed to archive module: ${err.message}`);
    }
  };

  const handlePublish = async (slug: string) => {
    try {
      await apiRequest(`/api/admin/modules/${slug}/publish`, { method: "POST" });
      setModules(modules.map((m) => (m.slug === slug ? { ...m, status: "active" } : m)));
    } catch (err: any) {
      alert(`Failed to publish module: ${err.message}`);
    }
  };

  const filteredModules = modules.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(searchTerm.toLowerCase()) || m.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = deptFilter ? m.department === deptFilter : true;
    return matchesSearch && matchesDept;
  });

  const departments = Array.from(new Set(modules.map((m) => m.department))).sort();

  return (
    <ProtectedRoute roles={["admin", "editor"]}>
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-100">
                Module Management Catalog
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Edit Markdown content, publish, or archive knowledge base modules
              </p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search modules by name or slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="relative w-full sm:w-64">
              <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 text-sm focus:outline-none"
              >
                <option value="">All Departments ({departments.length})</option>
                {departments.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Modules Table */}
          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-400">Loading module directory...</p>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Module Name</th>
                      <th className="px-6 py-4">Department</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredModules.map((m) => (
                      <tr key={m.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-100">{m.name}</div>
                          <div className="text-xs font-mono text-slate-400">{m.slug}</div>
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-indigo-300">
                          {m.department}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              m.status === "active"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            }`}
                          >
                            {m.status || "active"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right flex justify-end gap-2">
                          <Link
                            href={`/admin/modules/${m.slug}/edit`}
                            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors"
                            title="Edit Raw Content"
                          >
                            <Edit3 className="w-4 h-4 text-indigo-400" /> Edit
                          </Link>
                          {m.status === "active" ? (
                            <button
                              onClick={() => handleArchive(m.slug)}
                              className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition-colors"
                              title="Archive"
                            >
                              <Archive className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handlePublish(m.slug)}
                              className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10 rounded-lg transition-colors"
                              title="Publish"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
