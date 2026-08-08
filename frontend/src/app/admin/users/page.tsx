"use client";

import React, { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { apiRequest } from "@/lib/api";
import { User, UserRole } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Key,
  Plus,
  Shield,
  Trash2,
  Copy,
  Check,
  X,
  AlertTriangle,
  Loader2,
  UserCheck,
  UserX,
} from "lucide-react";

interface APIKey {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string;
  is_active: boolean;
  created_at: string;
  last_used_at?: string;
}

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState<"users" | "api_keys">("users");
  const [users, setUsers] = useState<User[]>([]);
  const [apiKeys, setApiKeys] = useState<APIKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // API Key creation state
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [keyScopes, setKeyScopes] = useState("read,write");
  const [generatedRawKey, setGeneratedRawKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [creatingKey, setCreatingKey] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [userData, keyData] = await Promise.all([
        apiRequest<User[]>("/api/users"),
        apiRequest<APIKey[]>("/api/api-keys"),
      ]);
      setUsers(userData);
      setApiKeys(keyData);
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRoleChange = async (userId: string, newRole: UserRole) => {
    try {
      const updated = await apiRequest<User>(`/api/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify({ role: newRole }),
      });
      setUsers(users.map((u) => (u.id === userId ? updated : u)));
    } catch (err: any) {
      alert(`Error updating role: ${err.message}`);
    }
  };

  const handleToggleActive = async (user: User) => {
    try {
      const updated = await apiRequest<User>(`/api/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({ is_active: !user.is_active }),
      });
      setUsers(users.map((u) => (u.id === user.id ? updated : u)));
    } catch (err: any) {
      alert(`Error toggling status: ${err.message}`);
    }
  };

  const handleCreateAPIKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyName) return;
    setCreatingKey(true);
    try {
      const res = await apiRequest<{ raw_api_key: string } & APIKey>(
        "/api/api-keys",
        {
          method: "POST",
          body: JSON.stringify({ name: keyName, scopes: keyScopes }),
        }
      );
      setGeneratedRawKey(res.raw_api_key);
      setApiKeys([res, ...apiKeys]);
    } catch (err: any) {
      alert(`Failed to create API key: ${err.message}`);
    } finally {
      setCreatingKey(false);
    }
  };

  const handleRevokeAPIKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API Key?")) return;
    try {
      await apiRequest(`/api/api-keys/${keyId}`, { method: "DELETE" });
      setApiKeys(apiKeys.filter((k) => k.id !== keyId));
    } catch (err: any) {
      alert(`Failed to revoke key: ${err.message}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <ProtectedRoute roles={["admin"]}>
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-12">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <div className="flex items-center gap-2 text-indigo-400 text-sm font-semibold tracking-wider uppercase mb-1">
                <Shield className="w-4 h-4" /> Administration
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-100">
                User Management & API Keys
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Manage system users, role-based permissions, and programmatic access keys
              </p>
            </div>

            {/* Tab selector */}
            <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl gap-1">
              <button
                onClick={() => setActiveTab("users")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "users"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Users className="w-4 h-4" /> Users ({users.length})
              </button>
              <button
                onClick={() => setActiveTab("api_keys")}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === "api_keys"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                <Key className="w-4 h-4" /> API Keys ({apiKeys.length})
              </button>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-300 text-sm flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {loading ? (
            <div className="py-20 text-center flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-400">Loading user directory...</p>
            </div>
          ) : activeTab === "users" ? (
            /* Users Table */
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Joined</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-semibold text-slate-100">
                            {u.full_name || "—"}
                          </div>
                          <div className="text-xs text-slate-400 font-mono">{u.email}</div>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={u.role}
                            onChange={(e) =>
                              handleRoleChange(u.id, e.target.value as UserRole)
                            }
                            className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-3 py-1.5 focus:border-indigo-500 focus:outline-none"
                          >
                            <option value="admin">Admin</option>
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                              u.is_active
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.is_active ? "bg-emerald-400" : "bg-rose-400"
                              }`}
                            />
                            {u.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                          {new Date(u.created_at).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleActive(u)}
                            title={u.is_active ? "Deactivate User" : "Activate User"}
                            className={`p-2 rounded-lg transition-colors ${
                              u.is_active
                                ? "text-slate-400 hover:text-amber-400 hover:bg-amber-400/10"
                                : "text-slate-400 hover:text-emerald-400 hover:bg-emerald-400/10"
                            }`}
                          >
                            {u.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* API Keys List */
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-lg font-bold text-slate-200">Programmatic API Keys</h2>
                  <p className="text-xs text-slate-400">
                    Keys used by custom agents, scripts, and CI/CD pipelines
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowKeyModal(true);
                    setGeneratedRawKey(null);
                    setKeyName("");
                  }}
                  className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-600/25 transition-all"
                >
                  <Plus className="w-4 h-4" /> Generate New API Key
                </button>
              </div>

              <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-xl shadow-xl">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                      <tr>
                        <th className="px-6 py-4">Key Name</th>
                        <th className="px-6 py-4">Prefix</th>
                        <th className="px-6 py-4">Scopes</th>
                        <th className="px-6 py-4">Created</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {apiKeys.map((k) => (
                        <tr key={k.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-100">{k.name}</td>
                          <td className="px-6 py-4 font-mono text-xs text-indigo-400">
                            {k.key_prefix}...
                          </td>
                          <td className="px-6 py-4 text-xs">
                            <span className="bg-slate-800 border border-slate-700 text-slate-300 px-2.5 py-1 rounded-md font-mono">
                              {k.scopes}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">
                            {new Date(k.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleRevokeAPIKey(k.id)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                              title="Revoke Key"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {apiKeys.length === 0 && (
                        <tr>
                          <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                            No API keys generated yet. Click "Generate New API Key" above.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Generate API Key Modal */}
        <AnimatePresence>
          {showKeyModal && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-lg w-full shadow-2xl relative"
              >
                <button
                  onClick={() => setShowKeyModal(false)}
                  className="absolute top-6 right-6 text-slate-500 hover:text-slate-300"
                >
                  <X className="w-5 h-5" />
                </button>

                {!generatedRawKey ? (
                  <>
                    <h2 className="text-xl font-bold text-slate-100 mb-1">
                      Generate New API Key
                    </h2>
                    <p className="text-xs text-slate-400 mb-6">
                      Keys grant programmatic access to BCOS modules and context engine.
                    </p>

                    <form onSubmit={handleCreateAPIKey} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                          Key Name / Label
                        </label>
                        <input
                          type="text"
                          required
                          value={keyName}
                          onChange={(e) => setKeyName(e.target.value)}
                          placeholder="e.g. GitHub Actions CI / Claude Desktop"
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 placeholder-slate-600 text-sm focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                          Access Scopes
                        </label>
                        <input
                          type="text"
                          value={keyScopes}
                          onChange={(e) => setKeyScopes(e.target.value)}
                          placeholder="read,write"
                          className="w-full px-4 py-3 bg-slate-950 border border-slate-800 focus:border-indigo-500 rounded-xl text-slate-100 text-sm font-mono focus:outline-none"
                        />
                      </div>

                      <div className="pt-4 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setShowKeyModal(false)}
                          className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-medium rounded-xl transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={creatingKey}
                          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/20 transition-all flex items-center gap-2"
                        >
                          {creatingKey && <Loader2 className="w-4 h-4 animate-spin" />}
                          Generate Key
                        </button>
                      </div>
                    </form>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mb-4 text-emerald-400">
                      <Check className="w-6 h-6" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-100 mb-1">
                      API Key Generated Successfully
                    </h2>
                    <p className="text-xs text-amber-400/90 mb-4 bg-amber-500/10 border border-amber-500/20 p-3 rounded-xl">
                      <strong>Important:</strong> Copy your key now. It will never be shown again!
                    </p>

                    <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl flex items-center justify-between gap-3 mb-6">
                      <code className="text-xs font-mono text-indigo-300 break-all select-all">
                        {generatedRawKey}
                      </code>
                      <button
                        onClick={() => copyToClipboard(generatedRawKey)}
                        className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium shrink-0 flex items-center gap-1.5 transition-colors"
                      >
                        {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        {copied ? "Copied" : "Copy"}
                      </button>
                    </div>

                    <button
                      onClick={() => setShowKeyModal(false)}
                      className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold rounded-xl transition-colors"
                    >
                      Done
                    </button>
                  </>
                )}
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </ProtectedRoute>
  );
}
