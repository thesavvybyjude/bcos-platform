"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { apiRequest } from "@/lib/api";
import { Save, ArrowLeft, Eye, Edit3, Loader2, CheckCircle2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function EditModulePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [rawContent, setRawContent] = useState("");
  const [moduleName, setModuleName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mode, setMode] = useState<"split" | "edit" | "preview">("split");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (!slug) return;
    const fetchContent = async () => {
      setLoading(true);
      try {
        const data = await apiRequest<{ name: string; raw_content: string }>(
          `/api/admin/modules/${slug}/edit`
        );
        setModuleName(data.name);
        setRawContent(data.raw_content || "");
      } catch (err: any) {
        alert(`Failed to load module content: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchContent();
  }, [slug]);

  const handleSave = async () => {
    setSaving(true);
    setSuccessMsg("");
    try {
      await apiRequest(`/api/admin/modules/${slug}`, {
        method: "PUT",
        body: JSON.stringify({ raw_content: rawContent }),
      });
      setSuccessMsg("Module saved successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (err: any) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <ProtectedRoute roles={["admin", "editor"]}>
      <div className="min-h-screen bg-slate-950 text-slate-100 p-6 flex flex-col">
        <div className="max-w-7xl mx-auto w-full space-y-4 flex-1 flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/admin/modules")}
                className="p-2 bg-slate-900 border border-slate-800 rounded-xl text-slate-400 hover:text-slate-200"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                  <Edit3 className="w-5 h-5 text-indigo-400" /> Edit {moduleName || slug}
                </h1>
                <p className="text-xs font-mono text-slate-400">{slug}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Mode Toggle */}
              <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1 text-xs">
                <button
                  onClick={() => setMode("edit")}
                  className={`px-3 py-1.5 rounded-lg ${mode === "edit" ? "bg-indigo-600 text-white font-semibold" : "text-slate-400"}`}
                >
                  Edit Only
                </button>
                <button
                  onClick={() => setMode("split")}
                  className={`px-3 py-1.5 rounded-lg ${mode === "split" ? "bg-indigo-600 text-white font-semibold" : "text-slate-400"}`}
                >
                  Split View
                </button>
                <button
                  onClick={() => setMode("preview")}
                  className={`px-3 py-1.5 rounded-lg ${mode === "preview" ? "bg-indigo-600 text-white font-semibold" : "text-slate-400"}`}
                >
                  Preview Only
                </button>
              </div>

              <button
                onClick={handleSave}
                disabled={saving || loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-600/20 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Changes
              </button>
            </div>
          </div>

          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" /> {successMsg}
            </div>
          )}

          {/* Editor Workspace */}
          {loading ? (
            <div className="py-35 text-center flex flex-col items-center gap-3 my-auto">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-sm text-slate-400">Loading raw module content...</p>
            </div>
          ) : (
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-[600px]">
              {(mode === "edit" || mode === "split") && (
                <div className={`flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl ${mode === "edit" ? "lg:col-span-2" : ""}`}>
                  <div className="bg-slate-950/80 px-4 py-2 text-xs font-mono text-slate-400 border-b border-slate-800">
                    RAW MARKDOWN SOURCE
                  </div>
                  <textarea
                    value={rawContent}
                    onChange={(e) => setRawContent(e.target.value)}
                    className="w-full flex-1 p-4 bg-transparent text-slate-100 font-mono text-xs focus:outline-none resize-none leading-relaxed"
                    placeholder="# Module Title..."
                  />
                </div>
              )}

              {(mode === "preview" || mode === "split") && (
                <div className={`flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl overflow-hidden backdrop-blur-xl ${mode === "preview" ? "lg:col-span-2" : ""}`}>
                  <div className="bg-slate-950/80 px-4 py-2 text-xs font-mono text-slate-400 border-b border-slate-800 flex items-center gap-2">
                    <Eye className="w-3.5 h-3.5 text-indigo-400" /> LIVE PREVIEW
                  </div>
                  <div className="w-full flex-1 p-6 overflow-y-auto prose prose-invert max-w-none text-slate-300 text-sm">
                    <ReactMarkdown>{rawContent}</ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
