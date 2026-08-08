"use client";

import React, { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { apiRequest } from "@/lib/api";
import {
  FileCheck,
  AlertOctagon,
  AlertTriangle,
  Info,
  RotateCw,
  Loader2,
  CheckCircle2,
} from "lucide-react";

interface ValidationIssue {
  module_slug: string;
  module_name: string;
  severity: "ERROR" | "WARNING" | "INFO";
  category: string;
  message: string;
}

interface ValidationReport {
  total_modules: number;
  health_score: number;
  total_errors: number;
  total_warnings: number;
  issues: ValidationIssue[];
}

export default function AdminValidatePage() {
  const [report, setReport] = useState<ValidationReport | null>(null);
  const [loading, setLoading] = useState(true);

  const runValidation = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<ValidationReport>("/api/admin/modules/validate", {
        method: "POST",
      });
      setReport(data);
    } catch (err: any) {
      alert(`Validation failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runValidation();
  }, []);

  return (
    <ProtectedRoute roles={["admin"]}>
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
                <FileCheck className="w-8 h-8 text-indigo-400" /> Knowledge Base Validation
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Automated schema structure checks, missing section reports, and broken link detection
              </p>
            </div>

            <button
              onClick={runValidation}
              disabled={loading}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50"
            >
              <RotateCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Re-run Diagnostics
            </button>
          </div>

          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-400">Scanning 249 modules for schema issues...</p>
            </div>
          ) : report ? (
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                  <div className="text-xs text-slate-400 font-semibold uppercase mb-1">Health Score</div>
                  <div className="text-3xl font-extrabold text-slate-100">{report.health_score}%</div>
                </div>
                <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-2xl">
                  <div className="text-xs text-slate-400 font-semibold uppercase mb-1">Total Modules</div>
                  <div className="text-3xl font-extrabold text-slate-100">{report.total_modules}</div>
                </div>
                <div className="bg-slate-900/60 border border-red-500/20 bg-red-500/5 p-5 rounded-2xl">
                  <div className="text-xs text-red-400 font-semibold uppercase mb-1">Errors</div>
                  <div className="text-3xl font-extrabold text-red-400">{report.total_errors}</div>
                </div>
                <div className="bg-slate-900/60 border border-amber-500/20 bg-amber-500/5 p-5 rounded-2xl">
                  <div className="text-xs text-amber-400 font-semibold uppercase mb-1">Warnings</div>
                  <div className="text-3xl font-extrabold text-amber-400">{report.total_warnings}</div>
                </div>
              </div>

              {/* Issues List */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
                <h3 className="text-lg font-bold text-slate-100 mb-4">
                  Diagnostic Findings ({report.issues.length})
                </h3>

                {report.issues.length === 0 ? (
                  <div className="py-12 text-center text-emerald-400 font-semibold flex flex-col items-center gap-2">
                    <CheckCircle2 className="w-10 h-10" />
                    No validation issues detected! Knowledge base is 100% compliant.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {report.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl border flex items-start gap-3 text-xs ${
                          issue.severity === "ERROR"
                            ? "bg-red-500/10 border-red-500/20 text-red-200"
                            : issue.severity === "WARNING"
                            ? "bg-amber-500/10 border-amber-500/20 text-amber-200"
                            : "bg-slate-800/40 border-slate-700/50 text-slate-300"
                        }`}
                      >
                        {issue.severity === "ERROR" ? (
                          <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        ) : issue.severity === "WARNING" ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between font-semibold mb-1">
                            <span className="text-slate-100">{issue.module_name}</span>
                            <span className="font-mono text-[10px] uppercase opacity-75">{issue.category}</span>
                          </div>
                          <p>{issue.message}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </ProtectedRoute>
  );
}
