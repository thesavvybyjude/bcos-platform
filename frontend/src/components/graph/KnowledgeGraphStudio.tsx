"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  Search,
  FolderTree,
  Star,
  Clock,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Download,
  Sparkles,
  Activity,
  GitBranch,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  Calendar,
  ShieldAlert,
  BarChart2,
  CheckCircle2,
  Info,
  Send,
  Copy,
  Sun,
  Moon,
  Brain,
  Share2,
  Layers,
  MousePointer,
  Hand,
  Grid,
  Crop,
  Link as LinkIcon,
  FileText,
  Filter,
  History,
  Maximize2,
  ExternalLink,
  Lightbulb,
  Code2,
  AlertTriangle,
  BookOpen,
  Boxes,
  Network,
} from "lucide-react";
import { type GraphData, type GraphNode, type GraphLink, api } from "@/lib/api";

// ── Mind Map Node Data Structure ──
interface MindMapConcept {
  id: string;
  label: string;
  type: "root" | "branch" | "leaf";
  color: string;
  icon?: any;
  x: number;
  y: number;
  parentId?: string;
  children?: MindMapConcept[];
}

export function KnowledgeGraphStudio() {
  // Data State
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);

  // Interaction State
  const [searchQuery, setSearchQuery] = useState("");
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [hoveredNode, setHoveredNode] = useState<any | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeTool, setActiveTool] = useState<"select" | "pan" | "grid" | "crop" | "link">("select");
  const [favorites, setFavorites] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  // UI Panels State
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "relationships" | "documents" | "history">("overview");
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([]);
  const [chatInput, setChatInput] = useState("");

  // Canvas Viewport & Infinite Zoom State
  const [zoomLevel, setZoomLevel] = useState(0.65);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const searchInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Load Graph Data
  useEffect(() => {
    async function load() {
      try {
        const data = await api.getGraphData();
        setGraphData(data);
      } catch (err) {
        console.error("Failed to load knowledge graph data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Keyboard Shortcuts (⌘K / Ctrl+K, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        setHoveredNode(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── REFERENCE MIND MAP DATA TREE STRUCTURE ──
  const mindMapTree = useMemo(() => {
    const rootX = 1000;
    const rootY = 700;

    const root: MindMapConcept = {
      id: "rag-root",
      label: "Retrieval Augmented Generation",
      type: "root",
      color: "#b8c4ff",
      icon: Brain,
      x: rootX,
      y: rootY,
      children: [
        {
          id: "core-concepts",
          label: "Core Concepts",
          type: "branch",
          color: "#60a5fa",
          icon: Lightbulb,
          x: rootX - 320,
          y: rootY - 180,
          children: [
            { id: "rag-1", label: "What is RAG?", type: "leaf", color: "#60a5fa", x: rootX - 580, y: rootY - 260 },
            { id: "rag-2", label: "How it Works", type: "leaf", color: "#60a5fa", x: rootX - 580, y: rootY - 210 },
            { id: "rag-3", label: "Key Components", type: "leaf", color: "#60a5fa", x: rootX - 580, y: rootY - 160 },
            { id: "rag-4", label: "RAG vs Fine-tuning", type: "leaf", color: "#60a5fa", x: rootX - 580, y: rootY - 110 },
          ],
        },
        {
          id: "tech-stack",
          label: "Tech Stack",
          type: "branch",
          color: "#fb923c",
          icon: Code2,
          x: rootX - 360, y: rootY + 40,
          children: [
            { id: "tech-1", label: "LLMs", type: "leaf", color: "#fb923c", x: rootX - 620, y: rootY - 60 },
            { id: "tech-2", label: "Vector Databases", type: "leaf", color: "#fb923c", x: rootX - 620, y: rootY - 10 },
            { id: "tech-3", label: "Embeddings", type: "leaf", color: "#fb923c", x: rootX - 620, y: rootY + 40 },
            { id: "tech-4", label: "Frameworks", type: "leaf", color: "#fb923c", x: rootX - 620, y: rootY + 90 },
            { id: "tech-5", label: "APIs & Tools", type: "leaf", color: "#fb923c", x: rootX - 620, y: rootY + 140 },
          ],
        },
        {
          id: "best-practices",
          label: "Best Practices",
          type: "branch",
          color: "#f472b6",
          icon: Star,
          x: rootX - 280, y: rootY + 260,
          children: [
            { id: "bp-1", label: "Chunking Strategies", type: "leaf", color: "#f472b6", x: rootX - 540, y: rootY + 190 },
            { id: "bp-2", label: "Indexing Methods", type: "leaf", color: "#f472b6", x: rootX - 540, y: rootY + 240 },
            { id: "bp-3", label: "Re-ranking", type: "leaf", color: "#f472b6", x: rootX - 540, y: rootY + 290 },
            { id: "bp-4", label: "Prompt Engineering", type: "leaf", color: "#f472b6", x: rootX - 540, y: rootY + 340 },
            { id: "bp-5", label: "Evaluation", type: "leaf", color: "#f472b6", x: rootX - 540, y: rootY + 390 },
          ],
        },
        {
          id: "related-topics",
          label: "Related Topics",
          type: "branch",
          color: "#facc15",
          icon: Network,
          x: rootX - 40, y: rootY + 320,
          children: [
            { id: "rel-1", label: "Prompt Engineering", type: "leaf", color: "#facc15", x: rootX - 220, y: rootY + 440 },
            { id: "rel-2", label: "Fine-tuning", type: "leaf", color: "#facc15", x: rootX - 80, y: rootY + 470 },
            { id: "rel-3", label: "Knowledge Graphs", type: "leaf", color: "#facc15", x: rootX + 80, y: rootY + 470 },
            { id: "rel-4", label: "Semantic Search", type: "leaf", color: "#facc15", x: rootX + 240, y: rootY + 440 },
          ],
        },
        {
          id: "applications",
          label: "Applications",
          type: "branch",
          color: "#34d399",
          icon: Boxes,
          x: rootX + 320, y: rootY - 180,
          children: [
            { id: "app-1", label: "Enterprise Search", type: "leaf", color: "#34d399", x: rootX + 580, y: rootY - 260 },
            { id: "app-2", label: "AI Assistants", type: "leaf", color: "#34d399", x: rootX + 580, y: rootY - 210 },
            { id: "app-3", label: "Content Generation", type: "leaf", color: "#34d399", x: rootX + 580, y: rootY - 160 },
            { id: "app-4", label: "Decision Support", type: "leaf", color: "#34d399", x: rootX + 580, y: rootY - 110 },
          ],
        },
        {
          id: "challenges",
          label: "Challenges",
          type: "branch",
          color: "#c084fc",
          icon: AlertTriangle,
          x: rootX + 360, y: rootY + 40,
          children: [
            { id: "chal-1", label: "Hallucination", type: "leaf", color: "#c084fc", x: rootX + 620, y: rootY - 60 },
            { id: "chal-2", label: "Latency", type: "leaf", color: "#c084fc", x: rootX + 620, y: rootY - 10 },
            { id: "chal-3", label: "Data Quality", type: "leaf", color: "#c084fc", x: rootX + 620, y: rootY + 40 },
            { id: "chal-4", label: "Cost", type: "leaf", color: "#c084fc", x: rootX + 620, y: rootY + 90 },
            { id: "chal-5", label: "Security", type: "leaf", color: "#c084fc", x: rootX + 620, y: rootY + 140 },
          ],
        },
        {
          id: "resources",
          label: "Resources",
          type: "branch",
          color: "#38bdf8",
          icon: BookOpen,
          x: rootX + 300, y: rootY + 260,
          children: [
            { id: "res-1", label: "Research Papers", type: "leaf", color: "#38bdf8", x: rootX + 560, y: rootY + 190 },
            { id: "res-2", label: "Documentation", type: "leaf", color: "#38bdf8", x: rootX + 560, y: rootY + 240 },
            { id: "res-3", label: "Tutorials", type: "leaf", color: "#38bdf8", x: rootX + 560, y: rootY + 290 },
            { id: "res-4", label: "Open Source", type: "leaf", color: "#38bdf8", x: rootX + 560, y: rootY + 340 },
            { id: "res-5", label: "Communities", type: "leaf", color: "#38bdf8", x: rootX + 560, y: rootY + 390 },
          ],
        },
      ],
    };

    return root;
  }, []);

  // Set initial selected node
  useEffect(() => {
    if (mindMapTree && !selectedNode) {
      setSelectedNode(mindMapTree);
    }
  }, [mindMapTree, selectedNode]);

  // Cursor-Centered Mouse Wheel Zooming
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.08 : 0.92;
      const newZoom = Math.min(Math.max(zoomLevel * zoomFactor, 0.15), 3.0);

      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        const cursorX = e.clientX - rect.left - rect.width / 2;
        const cursorY = e.clientY - rect.top - rect.height / 2;

        setPanOffset((prev) => ({
          x: prev.x - (cursorX / zoomLevel) * (newZoom - zoomLevel),
          y: prev.y - (cursorY / zoomLevel) * (newZoom - zoomLevel),
        }));
      }

      setZoomLevel(newZoom);
    },
    [zoomLevel]
  );

  // Canvas Mouse Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (activeTool === "pan" || e.spaceKey)) {
      setIsPanning(true);
      setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // AI Chat Handler
  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || chatInput;
    if (!query.trim()) return;

    setAiMessages((prev) => [...prev, { sender: "user", text: query }]);
    setChatInput("");

    setTimeout(() => {
      const reply = `Based on the BCOS Knowledge Brain, **${selectedNode?.label || "Retrieval Augmented Generation"}** combines external knowledge vector retrieval with LLM generation to improve accuracy and reduce hallucination.`;
      setAiMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    }, 600);
  };

  const handleNaturalLanguageSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalLanguageQuery.trim()) return;
    setSearchQuery(naturalLanguageQuery);
    setAiDrawerOpen(true);
    handleSendMessage(`Explain mind map thoughts on "${naturalLanguageQuery}"`);
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(mindMapTree, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bcos_mindmap_rag.json";
    a.click();
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#0c1324] text-[#dce1fb] rounded-2xl border border-white/5 shadow-2xl relative select-none">
      {/* ── 1. LEFT FLOATING TOOL DOCK (CANVAS TOOLBAR) ── */}
      <div className="absolute top-20 left-4 z-30 flex flex-col items-center gap-1.5 p-1.5 rounded-2xl bg-[#151b2d]/90 backdrop-blur-2xl border border-white/10 shadow-2xl">
        <button
          onClick={() => setActiveTool("select")}
          className={`p-2.5 rounded-xl transition-all ${
            activeTool === "select" ? "bg-[#6b89ff] text-white shadow-[0_0_15px_rgba(107,137,255,0.5)]" : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
          title="Select (Cursor)"
        >
          <MousePointer className="h-4 w-4" />
        </button>
        <button
          onClick={() => setActiveTool("pan")}
          className={`p-2.5 rounded-xl transition-all ${
            activeTool === "pan" ? "bg-[#6b89ff] text-white shadow-[0_0_15px_rgba(107,137,255,0.5)]" : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
          title="Pan Canvas (Hand)"
        >
          <Hand className="h-4 w-4" />
        </button>
        <button
          onClick={() => setActiveTool("grid")}
          className={`p-2.5 rounded-xl transition-all ${
            activeTool === "grid" ? "bg-[#6b89ff] text-white shadow-[0_0_15px_rgba(107,137,255,0.5)]" : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
          title="Grid & Nodes"
        >
          <Grid className="h-4 w-4" />
        </button>
        <button
          onClick={() => setActiveTool("crop")}
          className={`p-2.5 rounded-xl transition-all ${
            activeTool === "crop" ? "bg-[#6b89ff] text-white shadow-[0_0_15px_rgba(107,137,255,0.5)]" : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
          title="Box Select"
        >
          <Crop className="h-4 w-4" />
        </button>
        <button
          onClick={() => setActiveTool("link")}
          className={`p-2.5 rounded-xl transition-all ${
            activeTool === "link" ? "bg-[#6b89ff] text-white shadow-[0_0_15px_rgba(107,137,255,0.5)]" : "text-slate-400 hover:bg-white/5 hover:text-white"
          }`}
          title="Connection Link"
        >
          <LinkIcon className="h-4 w-4" />
        </button>
        <div className="h-px w-6 bg-white/10 my-0.5" />
        <button className="p-2.5 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors" title="Filter Nodes">
          <Filter className="h-4 w-4" />
        </button>
        <button className="p-2.5 text-slate-400 hover:bg-white/5 hover:text-white rounded-xl transition-colors" title="History Log">
          <History className="h-4 w-4" />
        </button>
      </div>

      {/* ── 2. CENTER: 85-90% INFINITE THINKING CANVAS ── */}
      <main
        ref={canvasRef}
        className="flex-1 flex flex-col relative overflow-hidden bg-[#0c1324]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Floating Top Control Toolbar */}
        <div className="absolute top-4 left-20 right-4 z-20 flex items-center justify-between pointer-events-none">
          {/* Natural Language Query Bar */}
          <form
            onSubmit={handleNaturalLanguageSearch}
            className="pointer-events-auto flex items-center gap-2 flex-1 max-w-xl"
          >
            <div className="relative w-full shadow-2xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder='Ask Mind Map: "Show thoughts on Retrieval Augmented Generation"'
                value={naturalLanguageQuery}
                onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                className="w-full bg-[#151b2d]/90 backdrop-blur-2xl border border-white/10 rounded-full py-2.5 pl-10 pr-12 text-xs text-[#dce1fb] placeholder:text-slate-500 focus:outline-none focus:border-[#b8c4ff] shadow-2xl"
              />
              <span className="absolute right-3.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-white/5 border border-white/10">
                ⌘K
              </span>
            </div>
          </form>

          {/* Top Actions */}
          <div className="pointer-events-auto flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2.5 bg-[#151b2d]/90 border border-white/10 backdrop-blur-2xl text-slate-300 hover:text-white rounded-xl shadow-xl transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-400" />}
            </button>

            <button
              onClick={exportJSON}
              className="p-2.5 bg-[#151b2d]/90 border border-white/10 backdrop-blur-2xl text-slate-300 hover:text-white rounded-xl shadow-xl transition-colors"
              title="Export Snapshot"
            >
              <Download className="h-4 w-4" />
            </button>

            {/* Zoom Control Pill */}
            <div className="flex items-center gap-1 bg-[#151b2d]/90 border border-white/10 backdrop-blur-2xl p-1 rounded-xl shadow-xl">
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.15, 3.0))}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <span className="text-[11px] font-mono text-[#b8c4ff] px-2 font-bold">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.15, 0.15))}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setZoomLevel(0.65);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Reset Camera"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            <button
              onClick={() => setZoomLevel(0.65)}
              className="p-2.5 bg-[#151b2d]/90 border border-white/10 backdrop-blur-2xl text-slate-300 hover:text-white rounded-xl shadow-xl transition-colors"
              title="Fit to Screen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>

            <button
              onClick={() => setAiDrawerOpen(!aiDrawerOpen)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6b89ff] to-[#b8c4ff] text-[#002585] font-bold text-xs flex items-center gap-2 shadow-[0_0_25px_rgba(184,196,255,0.4)] hover:shadow-[0_0_35px_rgba(184,196,255,0.6)] transition-all"
            >
              <Brain className="h-4 w-4" />
              <span>Ask Brain</span>
            </button>
          </div>
        </div>

        {/* Dynamic Canvas Viewport */}
        <div className="w-full h-full relative">
          {/* Subtle Grid Dot Pattern Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle, #8e90a0 1px, transparent 1px)`,
              backgroundSize: `${36 * zoomLevel}px ${36 * zoomLevel}px`,
              backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
            }}
          />

          <div
            className="w-full h-full relative transition-transform duration-75 ease-out"
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: "center center",
            }}
          >
            {/* SVG BEZIER CURVED LINKS LAYER */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
              {mindMapTree.children?.map((branch) => {
                // Root -> Branch Link
                const dx = branch.x - mindMapTree.x;
                const dy = branch.y - mindMapTree.y;
                const cx1 = mindMapTree.x + dx * 0.5;
                const cy1 = mindMapTree.y;
                const cx2 = mindMapTree.x + dx * 0.5;
                const cy2 = branch.y;
                const rootBranchPath = `M ${mindMapTree.x} ${mindMapTree.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${branch.x} ${branch.y}`;

                return (
                  <g key={branch.id}>
                    <path
                      d={rootBranchPath}
                      fill="none"
                      stroke={branch.color}
                      strokeWidth={2}
                      strokeOpacity={0.4}
                    />
                    {/* Branch -> Leaf Links */}
                    {branch.children?.map((leaf) => {
                      const ldx = leaf.x - branch.x;
                      const ldy = leaf.y - branch.y;
                      const lcx1 = branch.x + ldx * 0.5;
                      const lcy1 = branch.y;
                      const lcx2 = branch.x + ldx * 0.5;
                      const lcy2 = leaf.y;
                      const leafPath = `M ${branch.x} ${branch.y} C ${lcx1} ${lcy1}, ${lcx2} ${lcy2}, ${leaf.x} ${leaf.y}`;

                      return (
                        <path
                          key={leaf.id}
                          d={leafPath}
                          fill="none"
                          stroke={leaf.color}
                          strokeWidth={1.5}
                          strokeOpacity={0.25}
                        />
                      );
                    })}
                  </g>
                );
              })}
            </svg>

            {/* 1. ROOT CONCEPT NODE (CENTER HERO CARD) */}
            <div
              onClick={() => setSelectedNode(mindMapTree)}
              style={{
                position: "absolute",
                left: `${mindMapTree.x}px`,
                top: `${mindMapTree.y}px`,
                transform: "translate(-50%, -50%)",
              }}
              className="z-30 cursor-pointer group flex items-center gap-3 px-6 py-4 rounded-2xl bg-[#151b2d] border-2 border-[#6b89ff] shadow-[0_0_50px_rgba(107,137,255,0.4)] hover:shadow-[0_0_70px_rgba(107,137,255,0.6)] transition-all duration-300"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6b89ff]/20 text-[#b8c4ff] ring-1 ring-[#6b89ff]/40">
                <Brain className="h-6 w-6" />
              </div>
              <span className="text-base font-bold text-white tracking-tight">
                {mindMapTree.label}
              </span>
            </div>

            {/* 2. FIRST-LEVEL BRANCH CATEGORIES */}
            {mindMapTree.children?.map((branch) => {
              const BranchIcon = branch.icon || Lightbulb;
              const isSelected = selectedNode?.id === branch.id;

              return (
                <g key={branch.id}>
                  <div
                    onClick={() => setSelectedNode(branch)}
                    style={{
                      position: "absolute",
                      left: `${branch.x}px`,
                      top: `${branch.y}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                    className={`z-20 cursor-pointer group flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-[#191f31] border transition-all duration-300 ${
                      isSelected
                        ? "border-[#b8c4ff] ring-2 ring-[#b8c4ff]/40 shadow-[0_0_30px_rgba(184,196,255,0.3)] scale-105"
                        : "border-white/10 hover:border-white/30 hover:scale-105 shadow-xl"
                    }`}
                  >
                    <div
                      className="flex h-7 w-7 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${branch.color}20`,
                        color: branch.color,
                      }}
                    >
                      <BranchIcon className="h-4 w-4" />
                    </div>
                    <span className="text-xs font-semibold text-[#dce1fb] group-hover:text-white whitespace-nowrap">
                      {branch.label}
                    </span>
                  </div>

                  {/* 3. SECOND-LEVEL LEAF THOUGHTS */}
                  {branch.children?.map((leaf) => {
                    const isLeafSelected = selectedNode?.id === leaf.id;

                    return (
                      <div
                        key={leaf.id}
                        onClick={() => setSelectedNode(leaf)}
                        style={{
                          position: "absolute",
                          left: `${leaf.x}px`,
                          top: `${leaf.y}px`,
                          transform: "translate(-50%, -50%)",
                        }}
                        className={`z-10 cursor-pointer group flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#070d1f] border transition-all duration-200 ${
                          isLeafSelected
                            ? "border-[#b8c4ff] ring-2 ring-[#b8c4ff]/30 scale-110"
                            : "border-white/10 hover:border-white/30 hover:scale-105"
                        }`}
                      >
                        <span
                          className="h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]"
                          style={{
                            backgroundColor: leaf.color,
                            color: leaf.color,
                          }}
                        />
                        <span className="text-[11px] font-medium text-slate-300 group-hover:text-white whitespace-nowrap">
                          {leaf.label}
                        </span>
                      </div>
                    );
                  })}
                </g>
              );
            })}
          </div>

          {/* Bottom-Left Floating Mini Map Component */}
          <div className="absolute bottom-4 left-4 w-56 h-36 bg-[#070d1f]/90 border border-white/10 rounded-2xl p-2.5 backdrop-blur-2xl shadow-2xl pointer-events-auto flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Universe Map</span>
              <span className="text-[9px] font-mono text-[#b8c4ff]">378 Thoughts</span>
            </div>
            <div className="w-full flex-1 bg-[#151b2d] rounded-xl relative overflow-hidden border border-white/5 my-1.5">
              <div className="absolute inset-3 border border-[#b8c4ff]/60 bg-[#b8c4ff]/10 rounded-lg" />
              <div className="absolute top-7 left-24 h-2.5 w-2.5 rounded-full bg-[#6b89ff] shadow-[0_0_10px_#6b89ff]" />
            </div>
            <div className="flex items-center justify-end gap-1">
              <button onClick={() => setZoomLevel(0.65)} className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5">
                <Maximize2 className="h-3 w-3" />
              </button>
              <button onClick={() => setZoomLevel((z) => Math.min(z + 0.1, 3.0))} className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5">
                <ZoomIn className="h-3 w-3" />
              </button>
              <button onClick={() => setZoomLevel((z) => Math.max(z - 0.1, 0.15))} className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5">
                <ZoomOut className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* ── 3. RIGHT SIDEBAR: INSPECTOR PANEL (MATCHING REFERENCE UI) ── */}
      <aside
        className={`transition-all duration-300 flex flex-col border-l border-white/5 bg-[#151b2d]/95 backdrop-blur-2xl z-30 ${
          rightSidebarOpen ? "w-96" : "w-12"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3.5 border-b border-white/5">
          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            title={rightSidebarOpen ? "Collapse Inspector" : "Expand Inspector"}
          >
            {rightSidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          {rightSidebarOpen && (
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-[#b8c4ff]" />
              <span className="font-semibold text-xs tracking-tight text-[#dce1fb] font-mono uppercase">
                Thought Inspector
              </span>
            </div>
          )}
        </div>

        {rightSidebarOpen && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Selected Node Hero Header */}
            <div className="p-5 border-b border-white/5 bg-[#070d1f]/40">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-[#6b89ff]/20 text-[#b8c4ff] border border-[#6b89ff]/30">
                  {selectedNode?.type?.toUpperCase() || "DOMAIN"}
                </span>
                <button className="text-slate-400 hover:text-amber-400 transition-colors">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                {selectedNode?.label || "Retrieval Augmented Generation"}
              </h3>

              <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                <div className="flex items-center gap-1 text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>98.5% Relevance</span>
                </div>
                <span>•</span>
                <div className="flex items-center gap-1 text-[#b8c4ff]">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Aug 2026</span>
                </div>
              </div>
            </div>

            {/* Inspector Tabs */}
            <div className="flex items-center border-b border-white/5 bg-[#191f31]/60 px-3 text-xs font-mono">
              {(["overview", "relationships", "documents", "history"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-2.5 px-3 transition-colors border-b-2 capitalize ${
                    activeTab === tab
                      ? "border-[#b8c4ff] text-[#b8c4ff] font-bold"
                      : "border-transparent text-slate-400 hover:text-white"
                  }`}
                >
                  {tab}
                  {tab === "relationships" && <span className="ml-1 text-[10px] opacity-60">24</span>}
                  {tab === "documents" && <span className="ml-1 text-[10px] opacity-60">156</span>}
                </button>
              ))}
            </div>

            {/* Inspector Scroll Content */}
            <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs custom-scrollbar">
              {activeTab === "overview" && (
                <>
                  {/* AI Summary Box */}
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5 font-bold">
                      AI Summary
                    </span>
                    <p className="text-slate-300 leading-relaxed bg-[#070d1f] p-3.5 rounded-xl border border-white/5 font-sans">
                      Retrieval Augmented Generation (RAG) combines the power of large language models with external knowledge retrieval to generate more accurate, factual, and up-to-date responses. It reduces hallucinations and improves reliability by grounding outputs in trusted data sources.
                    </p>
                  </div>

                  {/* Key Attributes Table */}
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2 font-bold">
                      Key Attributes
                    </span>
                    <div className="bg-[#070d1f] rounded-xl border border-white/5 divide-y divide-white/5 font-mono text-xs">
                      <div className="flex justify-between p-2.5">
                        <span className="text-slate-400">Type</span>
                        <span className="text-white font-semibold">Concept</span>
                      </div>
                      <div className="flex justify-between p-2.5">
                        <span className="text-slate-400">Confidence</span>
                        <span className="text-emerald-400 font-semibold">98.5%</span>
                      </div>
                      <div className="flex justify-between p-2.5">
                        <span className="text-slate-400">First Seen</span>
                        <span className="text-slate-300">Mar 12, 2025</span>
                      </div>
                      <div className="flex justify-between p-2.5">
                        <span className="text-slate-400">Last Updated</span>
                        <span className="text-slate-300">Aug 20, 2026</span>
                      </div>
                      <div className="flex justify-between p-2.5">
                        <span className="text-slate-400">Connections</span>
                        <span className="text-[#b8c4ff] font-semibold">24</span>
                      </div>
                      <div className="flex justify-between p-2.5">
                        <span className="text-slate-400">Documents</span>
                        <span className="text-[#b8c4ff] font-semibold">156</span>
                      </div>
                      <div className="flex justify-between p-2.5">
                        <span className="text-slate-400">Domain</span>
                        <span className="text-blue-400 font-semibold">AI & Machine Learning</span>
                      </div>
                    </div>
                  </div>

                  {/* Vector Embeddings Preview */}
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1.5 font-bold">
                      Embedding Preview (384-D)
                    </span>
                    <div className="bg-[#070d1f] p-3 rounded-xl border border-white/5 font-mono text-[10px] text-[#b8c4ff] truncate">
                      [0.0241, -0.1982, 0.4410, 0.0821, -0.3104, 0.1102, ...]
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2 font-bold">
                      Tags
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {["AI", "RAG", "LLM", "Retrieval", "Knowledge"].map((t) => (
                        <span key={t} className="px-2.5 py-1 rounded-lg bg-white/5 border border-white/10 text-[10px] font-mono text-slate-300">
                          {t}
                        </span>
                      ))}
                      <button className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-mono text-slate-400">
                        +
                      </button>
                    </div>
                  </div>

                  {/* Primary CTA Button */}
                  <button className="w-full py-3 px-4 rounded-xl bg-[#b8c4ff] text-[#002585] font-bold text-xs flex items-center justify-center gap-2 hover:bg-white shadow-[0_0_20px_rgba(184,196,255,0.3)] transition-all">
                    <span>Open in Knowledge Base</span>
                    <ExternalLink className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </aside>

      {/* ── 4. FLOATING AI ASK BRAIN DRAWER ── */}
      {aiDrawerOpen && (
        <div className="absolute top-16 right-96 w-96 bg-[#151b2d]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden animate-slide-up">
          <div className="p-3.5 border-b border-white/10 bg-[#070d1f]/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-[#b8c4ff]" />
              <span className="font-semibold text-xs text-[#dce1fb]">Ask Knowledge Brain AI</span>
            </div>
            <button onClick={() => setAiDrawerOpen(false)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="h-64 overflow-y-auto p-3.5 space-y-3 text-xs custom-scrollbar">
            {aiMessages.length === 0 ? (
              <p className="text-slate-500 text-center py-8 text-[11px]">
                Ask questions about thought dependencies, critical paths, or cluster summaries.
              </p>
            ) : (
              aiMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl max-w-[85%] ${
                    msg.sender === "user"
                      ? "bg-[#6b89ff]/20 text-[#dce1fb] border border-[#6b89ff]/30 ml-auto"
                      : "bg-[#070d1f] text-slate-300 border border-white/5"
                  }`}
                >
                  {msg.text}
                </div>
              ))
            )}
          </div>

          <div className="p-3 border-t border-white/10 bg-[#070d1f] flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask the knowledge brain..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 bg-[#151b2d] border border-white/10 rounded-xl px-3 py-2 text-xs text-[#dce1fb] focus:outline-none focus:border-[#b8c4ff]"
            />
            <button
              onClick={() => handleSendMessage()}
              className="p-2 bg-[#b8c4ff] text-[#002585] rounded-xl hover:bg-white transition-colors"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
