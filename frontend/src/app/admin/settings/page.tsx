"use client";

import React, { useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { apiRequest } from "@/lib/api";
import { Sliders, Database, RefreshCw, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function AdminSettingsPage() {
  const [maintenance, setMaintenance] = useState(false);
  const [reindexing, setReindexing] = useState(false);
  const [msg, setMsg] = useState("");

  const handleReindex = async () => {
    setReindexing(true);
    setMsg("");
    try {
      await apiRequest("/api/admin/modules/reload", { method: "POST" });
      setMsg("Vector index and Neo4j graph successfully re-indexed!");
    } catch (err: any) {
      alert(`Re-indexing failed: ${err.message}`);
    } finally {
      setReindexing(false);
    }
  };

  return (
    <ProtectedRoute roles={["admin"]}>
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="border-b border-slate-800 pb-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
              <Sliders className="w-8 h-8 text-indigo-400" /> Platform System Settings
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Global system configurations, indexing controls, and operational maintenance
            </p>
          </div>

          {msg && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {msg}
            </div>
          )}

          <div className="space-y-4">
            {/* Maintenance Mode Card */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center justify-between backdrop-blur-xl">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-400" /> System Maintenance Mode
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Temporarily restrict user traffic while performing database schema updates
                </p>
              </div>
              <button
                onClick={() => setMaintenance(!maintenance)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition-colors ${
                  maintenance
                    ? "bg-amber-500 text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {maintenance ? "Maintenance Enabled" : "Disabled"}
              </button>
            </div>

            {/* Reindex Trigger */}
            <div className="bg-slate-900/60 border border-slate-800 p-6 rounded-2xl flex items-center justify-between backdrop-blur-xl">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Database className="w-4 h-4 text-indigo-400" /> Reindex Chroma & Neo4j Data
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Re-generate vector embeddings for 249 modules and sync Knowledge Graph relationships
                </p>
              </div>
              <button
                onClick={handleReindex}
                disabled={reindexing}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${reindexing ? "animate-spin" : ""}`} />
                Trigger Reindex
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
