"use client";

import React, { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { apiRequest } from "@/lib/api";
import { History, Shield, User, Clock, Loader2 } from "lucide-react";

interface AuditEntry {
  id: string;
  user_email: string;
  action: string;
  target_slug?: string;
  details?: string;
  timestamp: string;
}

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<AuditEntry[]>("/api/admin/audit/logs");
      setLogs(data);
    } catch (err: any) {
      console.error("Failed to load audit logs", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <ProtectedRoute roles={["admin"]}>
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="border-b border-slate-800 pb-6">
            <h1 className="text-3xl font-bold tracking-tight text-slate-100 flex items-center gap-3">
              <History className="w-8 h-8 text-amber-400" /> Platform Security & Audit Trail
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Real-time administrative log of content edits, user access, and system configurations
            </p>
          </div>

          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
              <p className="text-sm text-slate-400">Loading audit history...</p>
            </div>
          ) : (
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">Timestamp</th>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {logs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4 text-xs font-mono text-slate-400">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-slate-200">
                          {log.user_email}
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2.5 py-1 bg-amber-500/10 text-amber-300 border border-amber-500/20 rounded-full text-[10px] font-mono uppercase tracking-wider">
                            {log.action}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-300">
                          {log.details || log.target_slug || "—"}
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
