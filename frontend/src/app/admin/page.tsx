"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { apiRequest } from "@/lib/api";
import { motion } from "framer-motion";
import {
  Shield,
  Activity,
  BookOpen,
  FileCheck,
  RotateCw,
  Sliders,
  History,
  AlertTriangle,
  CheckCircle2,
  Users,
  Loader2,
  ArrowUpRight,
} from "lucide-react";

interface AdminStats {
  total_modules: int;
  total_users: int;
  total_audit_events: int;
  health_score: float;
  validation_errors: int;
  validation_warnings: int;
  system_status: str;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [reloading, setReloading] = useState(false);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<AdminStats>("/api/admin/stats");
      setStats(data);
    } catch (err: any) {
      console.error("Failed to load admin stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleReloadModules = async () => {
    setReloading(true);
    try {
      const res = await apiRequest<{ modules_reloaded: number }>("/api/admin/modules/reload", {
        method: "POST",
      });
      alert(`Reloaded ${res.modules_reloaded} modules successfully!`);
      await fetchStats();
    } catch (err: any) {
      alert(`Reload failed: ${err.message}`);
    } finally {
      setReloading(false);
    }
  };

  return (
    <ProtectedRoute roles={["admin"]}>
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold tracking-wider uppercase mb-1">
                <Shield className="w-4 h-4" /> BCOS Admin Center
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-100">
                System Overview & Curation
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Monitor knowledge health, validate schema structure, and manage system operations
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleReloadModules}
                disabled={reloading}
                className="flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 text-sm font-medium rounded-xl transition-all"
              >
                <RotateCw className={`w-4 h-4 text-indigo-400 ${reloading ? "animate-spin" : ""}`} />
                Reload Modules
              </button>
              <Link
                href="/admin/validate"
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all"
              >
                <FileCheck className="w-4 h-4" /> Run Validation
              </Link>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-400">Loading system metrics...</p>
            </div>
          ) : stats ? (
            <>
              {/* Metrics Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <span>Platform Health</span>
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-100 mb-1">
                    {stats.health_score}%
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Operational Status
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <span>Total Modules</span>
                    <BookOpen className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-100 mb-1">
                    {stats.total_modules}
                  </div>
                  <div className="text-xs text-slate-400">Across 64+ Departments</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <span>System Users</span>
                    <Users className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-100 mb-1">
                    {stats.total_users}
                  </div>
                  <div className="text-xs text-slate-400">Registered Accounts</div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                    <span>Validation Issues</span>
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-3xl font-extrabold text-slate-100 mb-1">
                    {stats.validation_errors + stats.validation_warnings}
                  </div>
                  <div className="text-xs text-amber-400/90 font-mono">
                    {stats.validation_errors} Errors • {stats.validation_warnings} Warnings
                  </div>
                </div>
              </div>

              {/* Quick Navigation Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
                <Link
                  href="/admin/modules"
                  className="group bg-slate-900/40 border border-slate-800/80 hover:border-indigo-500/50 p-6 rounded-2xl backdrop-blur-xl transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-200 mb-1">Module Catalog & Status</h3>
                  <p className="text-xs text-slate-400">
                    Publish, archive, or edit raw Markdown content across all 249 knowledge modules.
                  </p>
                </Link>

                <Link
                  href="/admin/validate"
                  className="group bg-slate-900/40 border border-slate-800/80 hover:border-purple-500/50 p-6 rounded-2xl backdrop-blur-xl transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center">
                      <FileCheck className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-200 mb-1">Validation Reports</h3>
                  <p className="text-xs text-slate-400">
                    Inspect schema compliance, missing sections, and broken cross-references.
                  </p>
                </Link>

                <Link
                  href="/admin/audit"
                  className="group bg-slate-900/40 border border-slate-800/80 hover:border-amber-500/50 p-6 rounded-2xl backdrop-blur-xl transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
                      <History className="w-5 h-5" />
                    </div>
                    <ArrowUpRight className="w-5 h-5 text-slate-500 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-200 mb-1">System Audit Trail</h3>
                  <p className="text-xs text-slate-400">
                    Review administrative actions, security logins, and content updates in real-time.
                  </p>
                </Link>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  );
}
