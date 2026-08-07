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
  Compass,
} from "lucide-react";
import { type GraphData, type GraphNode, type GraphLink, api } from "@/lib/api";

// ── Node Type Palette Specification ──
const NODE_TYPES = [
  { id: "concept", label: "Concepts", color: "#60a5fa" },
  { id: "person", label: "People", color: "#c084fc" },
  { id: "organization", label: "Organizations", color: "#34d399" },
  { id: "document", label: "Documents", color: "#fb923c" },
  { id: "event", label: "Events", color: "#f87171" },
  { id: "task", label: "Tasks & Rules", color: "#facc15" },
  { id: "metadata", label: "Metadata", color: "#94a3b8" },
];

const DOMAINS = [
  "Marketing",
  "Business",
  "Technology",
  "Operations",
  "Product",
  "Psychology",
  "Retail",
  "Sales",
  "Sourcing",
  "Strategy",
];

const RELATIONSHIP_LABELS = [
  "depends on",
  "contains",
  "created by",
  "references",
  "belongs to",
  "implements",
  "uses",
  "supports",
  "conflicts with",
];

const SAMPLE_TAGS = ["#RAG", "#AI-Routing", "#Pricing", "#Scale", "#GDPR", "#Architecture", "#Growth"];

export function KnowledgeGraphStudio() {
  // Data State
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);

  // Interaction State
  const [searchQuery, setSearchQuery] = useState("");
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(NODE_TYPES.map((t) => t.id));
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: GraphNode } | null>(null);

  // UI Panels State
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(true);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "relationships" | "documents" | "history" | "analytics">("overview");
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([]);
  const [chatInput, setChatInput] = useState("");

  // Canvas Viewport & Zoom State
  const [viewMode, setViewMode] = useState<"canvas" | "timeline" | "cluster">("canvas");
  const [analyticsOverlay, setAnalyticsOverlay] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
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
        if (data.nodes.length > 0) {
          setSelectedNode(data.nodes[0]);
        }
      } catch (err) {
        console.error("Failed to load knowledge graph data:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  // Theme Switcher Sync
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    } else {
      document.documentElement.classList.add("light");
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  // Keyboard Shortcuts (Ctrl+F, Esc)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === "Escape") {
        setContextMenu(null);
        setHoveredNode(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Cursor-Centered Mouse Wheel Zooming
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newZoom = Math.min(Math.max(zoomLevel * zoomFactor, 0.15), 3.0);

      // Focus zoom on cursor position
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

  // Filtered nodes
  const filteredNodes = useMemo(() => {
    if (!graphData) return [];
    return graphData.nodes.filter((node) => {
      const queryMatch =
        searchQuery === "" ||
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.department?.toLowerCase().includes(searchQuery.toLowerCase());

      const domainMatch = selectedDomain === "all" || node.department === selectedDomain;
      const tagMatch = !selectedTag || (selectedTag === "#RAG" && node.label.toLowerCase().includes("ai"));

      return queryMatch && domainMatch && tagMatch;
    });
  }, [graphData, searchQuery, selectedDomain, selectedTag]);

  // AI Chat Handler
  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || chatInput;
    if (!query.trim()) return;

    setAiMessages((prev) => [...prev, { sender: "user", text: query }]);
    setChatInput("");

    setTimeout(() => {
      let reply = "Based on the BCOS Knowledge Graph, ";
      if (selectedNode) {
        reply += `for node **${selectedNode.label}**: it has direct dependencies across 4 linked modules and 12 operational rules. Removal would impact downstream execution flow.`;
      } else {
        reply += `the cluster contains ${filteredNodes.length} interconnected modules across key enterprise domains.`;
      }
      setAiMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    }, 600);
  };

  const handleNaturalLanguageSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalLanguageQuery.trim()) return;
    setSearchQuery(naturalLanguageQuery);
    setAiDrawerOpen(true);
    handleSendMessage(`Show everything related to "${naturalLanguageQuery}"`);
  };

  // Node Color Helper
  const getNodeColor = (type?: string) => {
    switch (type?.toLowerCase()) {
      case "department":
      case "concept":
        return "#60a5fa";
      case "person":
        return "#c084fc";
      case "organization":
        return "#34d399";
      case "module":
      case "document":
        return "#fb923c";
      case "event":
        return "#f87171";
      case "task":
      case "rule":
        return "#facc15";
      default:
        return "#94a3b8";
    }
  };

  // Canvas Mouse Pan Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && !contextMenu) {
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

  // Context Menu Handler
  const handleContextMenu = (e: React.MouseEvent, node: GraphNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  // Export Snapshot Helper
  const exportJSON = () => {
    if (!graphData) return;
    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bcos_knowledge_graph.json";
    a.click();
  };

  return (
    <div
      className="flex h-[calc(100vh-5rem)] w-full overflow-hidden bg-var-bg-primary text-var-text-primary rounded-xl border border-white/5 shadow-2xl relative select-none"
      onClick={() => setContextMenu(null)}
    >
      {/* ── 1. LEFT SIDEBAR: KNOWLEDGE EXPLORER ── */}
      <aside
        className={`transition-all duration-300 flex flex-col border-r border-white/5 bg-[#151b2d]/80 backdrop-blur-xl z-20 ${
          leftSidebarOpen ? "w-72" : "w-12"
        }`}
      >
        {/* Toggle Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/5">
          {leftSidebarOpen && (
            <div className="flex items-center gap-2">
              <FolderTree className="h-4 w-4 text-[#b8c4ff]" />
              <span className="font-semibold text-sm tracking-tight text-[#dce1fb]">
                Knowledge Explorer
              </span>
            </div>
          )}
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors ml-auto"
            title={leftSidebarOpen ? "Collapse Explorer" : "Expand Explorer"}
          >
            {leftSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>

        {leftSidebarOpen && (
          <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
            {/* Search Input with Ctrl+F Hint */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search graph (Ctrl + F)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#191f31] border border-white/5 rounded-lg py-2 pl-9 pr-8 text-xs text-[#dce1fb] placeholder:text-slate-500 focus:outline-none focus:border-[#b8c4ff]/50 focus:ring-1 focus:ring-[#b8c4ff]/30 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              )}
            </div>

            {/* Node Types Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Node Types
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{NODE_TYPES.length}</span>
              </div>
              <div className="space-y-1">
                {NODE_TYPES.map((type) => (
                  <button
                    key={type.id}
                    onClick={() => {
                      if (selectedTypes.includes(type.id)) {
                        setSelectedTypes(selectedTypes.filter((t) => t !== type.id));
                      } else {
                        setSelectedTypes([...selectedTypes, type.id]);
                      }
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-all ${
                      selectedTypes.includes(type.id)
                        ? "bg-white/5 text-[#dce1fb]"
                        : "text-slate-500 opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: type.color }} />
                      <span>{type.label}</span>
                    </div>
                    <span className="font-mono text-[10px] text-slate-500">
                      {graphData?.nodes.filter((n) => n.type === type.id || (type.id === "document" && n.type === "module")).length || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Domains / Departments Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Domains
                </span>
              </div>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedDomain("all")}
                  className={`w-full text-left px-2.5 py-1.5 rounded text-xs transition-all ${
                    selectedDomain === "all" ? "bg-[#b8c4ff]/15 text-[#b8c4ff] font-semibold" : "text-slate-400 hover:bg-white/5"
                  }`}
                >
                  All Domains
                </button>
                {DOMAINS.map((domain) => (
                  <button
                    key={domain}
                    onClick={() => setSelectedDomain(domain)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-all ${
                      selectedDomain === domain
                        ? "bg-[#b8c4ff]/15 text-[#b8c4ff] font-semibold"
                        : "text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    <span>{domain}</span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {graphData?.nodes.filter((n) => n.department === domain).length || 0}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags Filter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
                  Tags & Collections
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {SAMPLE_TAGS.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                      selectedTag === tag
                        ? "bg-[#b8c4ff] text-[#002585] font-semibold"
                        : "bg-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Saved Views & Favorites */}
            <div className="pt-2 border-t border-white/5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 font-mono block mb-2">
                Favorites & Views
              </span>
              <div className="space-y-1">
                <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
                  <Star className="h-3.5 w-3.5 text-amber-400" />
                  <span>Core Architecture</span>
                </button>
                <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
                  <Activity className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Critical Hubs</span>
                </button>
                <button className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-xs text-slate-400 hover:bg-white/5 hover:text-white transition-colors">
                  <Clock className="h-3.5 w-3.5 text-blue-400" />
                  <span>Recently Viewed</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* ── 2. CENTER: INFINITE CANVAS WORKSPACE ── */}
      <main
        ref={canvasRef}
        className="flex-1 flex flex-col relative overflow-hidden bg-[#0c1324]"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Top Control Toolbar */}
        <div className="h-12 border-b border-white/5 bg-[#151b2d]/60 backdrop-blur-md px-4 flex items-center justify-between z-10">
          {/* Natural Language Query Bar */}
          <form onSubmit={handleNaturalLanguageSearch} className="flex items-center gap-2 flex-1 max-w-md">
            <div className="relative w-full">
              <Sparkles className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#b8c4ff]" />
              <input
                type="text"
                placeholder='AI Ask: "Show everything related to Retrieval Augmented Generation"'
                value={naturalLanguageQuery}
                onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                className="w-full bg-[#070d1f] border border-white/10 rounded-full py-1.5 pl-8 pr-8 text-xs text-[#dce1fb] placeholder:text-slate-500 focus:outline-none focus:border-[#b8c4ff] focus:ring-1 focus:ring-[#b8c4ff]/30 transition-all"
              />
            </div>
          </form>

          {/* View Modes, Theme & Action Tools */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle (Light / Dark Mode) */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 bg-[#191f31] border border-white/5 hover:bg-white/5 text-slate-300 hover:text-white rounded-lg transition-colors"
              title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            >
              {isDarkMode ? <Sun className="h-3.5 w-3.5 text-amber-400" /> : <Moon className="h-3.5 w-3.5 text-blue-400" />}
            </button>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#070d1f] p-1 rounded-lg border border-white/5 text-xs font-mono">
              <button
                onClick={() => setViewMode("canvas")}
                className={`px-2.5 py-1 rounded transition-colors ${
                  viewMode === "canvas" ? "bg-[#b8c4ff] text-[#002585] font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                Canvas
              </button>
              <button
                onClick={() => setViewMode("cluster")}
                className={`px-2.5 py-1 rounded transition-colors ${
                  viewMode === "cluster" ? "bg-[#b8c4ff] text-[#002585] font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                Clusters
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`px-2.5 py-1 rounded transition-colors ${
                  viewMode === "timeline" ? "bg-[#b8c4ff] text-[#002585] font-semibold" : "text-slate-400 hover:text-white"
                }`}
              >
                Timeline
              </button>
            </div>

            {/* Analytics Overlay Toggle */}
            <button
              onClick={() => setAnalyticsOverlay(!analyticsOverlay)}
              className={`p-2 rounded-lg border text-xs transition-colors flex items-center gap-1.5 ${
                analyticsOverlay
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                  : "bg-[#191f31] text-slate-400 border-white/5 hover:text-white"
              }`}
              title="Toggle Hub & Analytics Overlay"
            >
              <BarChart2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Analytics</span>
            </button>

            {/* Export Menu */}
            <button
              onClick={exportJSON}
              className="p-2 bg-[#191f31] border border-white/5 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg transition-colors"
              title="Export Graph Snapshot JSON"
            >
              <Download className="h-3.5 w-3.5" />
            </button>

            {/* Canvas Zoom Actions & Level Percentage Display */}
            <div className="flex items-center gap-1 bg-[#191f31] p-1 rounded-lg border border-white/5">
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 3.0))}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-400 px-1">{Math.round(zoomLevel * 100)}%</span>
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.15))}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  setZoomLevel(1);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors"
                title="Reset Camera"
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* AI Assistant Button */}
            <button
              onClick={() => setAiDrawerOpen(!aiDrawerOpen)}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#6b89ff] to-[#b8c4ff] text-[#002585] font-semibold text-xs flex items-center gap-1.5 hover:shadow-[0_0_15px_rgba(184,196,255,0.4)] transition-all"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Ask Graph</span>
            </button>
          </div>
        </div>

        {/* Infinite Canvas Viewport */}
        <div className="flex-1 relative overflow-hidden cursor-grab active:cursor-grabbing">
          {/* Thin Grid Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              backgroundImage: `radial-gradient(circle, #8e90a0 1px, transparent 1px)`,
              backgroundSize: `${24 * zoomLevel}px ${24 * zoomLevel}px`,
              backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
            }}
          />

          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <GitBranch className="h-10 w-10 text-[#b8c4ff] animate-pulse" />
                <p className="text-xs text-slate-400 font-mono">Initializing Knowledge Ecosystem...</p>
              </div>
            </div>
          ) : (
            <div
              className="w-full h-full relative transition-transform duration-75 ease-out"
              style={{
                transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
                transformOrigin: "center center",
              }}
            >
              {/* SVG Curved Link Layer with Relationship Labels */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {graphData?.links.map((link, idx) => {
                  const sourceNode = graphData.nodes.find((n) => n.id === link.source);
                  const targetNode = graphData.nodes.find((n) => n.id === link.target);
                  if (!sourceNode || !targetNode) return null;

                  const isConnected =
                    selectedNode && (selectedNode.id === sourceNode.id || selectedNode.id === targetNode.id);

                  const relLabel = RELATIONSHIP_LABELS[idx % RELATIONSHIP_LABELS.length];
                  const x1 = (idx * 45 + 100) % 900;
                  const y1 = (idx * 30 + 100) % 600;
                  const x2 = (idx * 65 + 200) % 900;
                  const y2 = (idx * 40 + 200) % 600;

                  return (
                    <g key={idx}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke={isConnected ? "#b8c4ff" : "rgba(142, 144, 160, 0.15)"}
                        strokeWidth={isConnected ? 2 : 1}
                        strokeDasharray={isConnected ? "4" : "none"}
                        className={isConnected ? "animate-pulse" : ""}
                      />
                      {/* Progressive Disclosure: Reveal Relationship Labels at Zoom >= 100% */}
                      {zoomLevel >= 1.0 && (
                        <text
                          x={(x1 + x2) / 2}
                          y={(y1 + y2) / 2}
                          fill="#b8c4ff"
                          fontSize="9"
                          fontFamily="JetBrains Mono, monospace"
                          textAnchor="middle"
                          className="bg-[#0c1324]/80 px-1"
                        >
                          {relLabel}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* Progressive Disclosure Node Cards */}
              <div className="p-12 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 max-w-6xl mx-auto">
                {filteredNodes.slice(0, 30).map((node) => {
                  const isSelected = selectedNode?.id === node.id;
                  const isHovered = hoveredNode?.id === node.id;
                  const nodeColor = getNodeColor(node.type);

                  return (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      onContextMenu={(e) => handleContextMenu(e, node)}
                      onMouseEnter={() => setHoveredNode(node)}
                      onMouseLeave={() => setHoveredNode(null)}
                      className={`group relative p-3.5 rounded-xl backdrop-blur-xl transition-all duration-300 cursor-pointer ${
                        isSelected
                          ? "bg-[#191f31] border-2 border-[#b8c4ff] shadow-[0_0_30px_rgba(184,196,255,0.25)] translate-y-[-2px]"
                          : isHovered
                          ? "bg-[#191f31]/90 border border-white/20 shadow-[0_0_20px_rgba(184,196,255,0.1)]"
                          : "bg-white/[0.03] border border-white/5 hover:border-white/15"
                      }`}
                    >
                      {/* Node Header Pill */}
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider font-semibold"
                          style={{
                            backgroundColor: `${nodeColor}15`,
                            color: nodeColor,
                          }}
                        >
                          {node.type || "module"}
                        </span>
                        <div
                          className="h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]"
                          style={{ backgroundColor: nodeColor, color: nodeColor }}
                        />
                      </div>

                      {/* Title */}
                      <h4 className="text-xs font-semibold text-[#dce1fb] group-hover:text-white line-clamp-2 mb-2">
                        {node.label}
                      </h4>

                      {/* Progressive Disclosure: Reveal Descriptions at Zoom >= 60% */}
                      {zoomLevel >= 0.6 && (
                        <p className="text-[11px] text-slate-400 line-clamp-2 mb-2 leading-relaxed">
                          Module defining operational standards & governance.
                        </p>
                      )}

                      {/* Department Tag & Metadata Count */}
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-2 border-t border-white/5">
                        <span>{node.department || "General"}</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Activity className="h-2.5 w-2.5 text-[#b8c4ff]" />
                          <span>98%</span>
                        </span>
                      </div>

                      {/* Analytics Overlay Badge */}
                      {analyticsOverlay && (
                        <div className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 rounded-full flex items-center justify-center text-[9px] font-mono">
                          H
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Context Menu Modal */}
          {contextMenu && (
            <div
              className="fixed bg-[#191f31] border border-white/10 rounded-xl p-1.5 shadow-2xl z-50 w-48 text-xs font-mono animate-fade-in"
              style={{ top: contextMenu.y, left: contextMenu.x }}
            >
              <button
                onClick={() => {
                  setSelectedNode(contextMenu.node);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <Eye className="h-3.5 w-3.5 text-[#b8c4ff]" />
                <span>Inspect Node</span>
              </button>
              <button
                onClick={() => {
                  setAiDrawerOpen(true);
                  handleSendMessage(`What would break if node "${contextMenu.node.label}" disappeared?`);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-amber-400" />
                <span>Impact Analysis</span>
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(contextMenu.node.slug || contextMenu.node.id);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                  setContextMenu(null);
                }}
                className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <Copy className="h-3.5 w-3.5 text-emerald-400" />
                <span>Copy Slug</span>
              </button>
            </div>
          )}

          {/* Mini Map Component */}
          <div className="absolute bottom-4 right-4 w-48 h-32 bg-[#070d1f]/90 border border-white/10 rounded-lg p-2 backdrop-blur-xl shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">Mini Map</span>
              <span className="text-[9px] font-mono text-[#b8c4ff]">{filteredNodes.length} Nodes</span>
            </div>
            <div className="w-full h-22 bg-[#151b2d] rounded relative overflow-hidden border border-white/5">
              {/* Mini Map Viewport indicator */}
              <div className="absolute inset-2 border border-[#b8c4ff]/60 bg-[#b8c4ff]/10 rounded" />
              <div className="absolute top-3 left-6 h-1.5 w-1.5 rounded-full bg-blue-400" />
              <div className="absolute top-8 left-12 h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <div className="absolute top-12 left-20 h-1.5 w-1.5 rounded-full bg-purple-400" />
              <div className="absolute top-5 left-32 h-1.5 w-1.5 rounded-full bg-orange-400" />
            </div>
          </div>
        </div>
      </main>

      {/* ── 3. RIGHT SIDEBAR: INSPECTOR PANEL ── */}
      <aside
        className={`transition-all duration-300 flex flex-col border-l border-white/5 bg-[#151b2d]/90 backdrop-blur-xl z-20 ${
          rightSidebarOpen ? "w-80" : "w-12"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/5">
          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 transition-colors"
            title={rightSidebarOpen ? "Collapse Inspector" : "Expand Inspector"}
          >
            {rightSidebarOpen ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
          {rightSidebarOpen && (
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-[#b8c4ff]" />
              <span className="font-semibold text-sm tracking-tight text-[#dce1fb]">
                Node Inspector
              </span>
            </div>
          )}
        </div>

        {rightSidebarOpen && (
          <div className="flex-1 flex flex-col overflow-hidden">
            {selectedNode ? (
              <>
                {/* Selected Node Hero Header */}
                <div className="p-4 border-b border-white/5 bg-[#070d1f]/40">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold"
                        style={{
                          backgroundColor: `${getNodeColor(selectedNode.type)}20`,
                          color: getNodeColor(selectedNode.type),
                        }}
                      >
                        {selectedNode.type || "Module"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {selectedNode.department || "General"}
                      </span>
                    </div>

                    {/* Favorite Toggle Button */}
                    <button
                      onClick={() => {
                        if (favorites.includes(selectedNode.id)) {
                          setFavorites(favorites.filter((id) => id !== selectedNode.id));
                        } else {
                          setFavorites([...favorites, selectedNode.id]);
                        }
                      }}
                      className="text-slate-400 hover:text-amber-400 transition-colors"
                    >
                      <Star className={`h-4 w-4 ${favorites.includes(selectedNode.id) ? "fill-amber-400 text-amber-400" : ""}`} />
                    </button>
                  </div>
                  <h3 className="text-base font-bold text-[#dce1fb] mb-2">{selectedNode.label}</h3>

                  {/* Confidence Score & Date Tag */}
                  <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
                    <div className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>98.5% Confidence</span>
                    </div>
                    <span>•</span>
                    <div className="flex items-center gap-1 text-[#b8c4ff]">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>Aug 2026</span>
                    </div>
                  </div>
                </div>

                {/* Inspector Tabs */}
                <div className="flex items-center border-b border-white/5 bg-[#191f31]/60 px-2 text-xs font-mono">
                  {(["overview", "relationships", "documents", "history", "analytics"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`py-2 px-2.5 transition-colors border-b-2 capitalize ${
                        activeTab === tab
                          ? "border-[#b8c4ff] text-[#b8c4ff] font-semibold"
                          : "border-transparent text-slate-400 hover:text-white"
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Inspector Tab Contents */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs custom-scrollbar">
                  {activeTab === "overview" && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                          AI Executive Summary
                        </span>
                        <p className="text-slate-300 leading-relaxed bg-[#070d1f] p-3 rounded-lg border border-white/5">
                          {selectedNode.label} forms a core foundational module in the BCOS Business Context Operating System. It defines operational standards, governance principles, and automated AI routing rules.
                        </p>
                      </div>

                      <div>
                        <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
                          Embeddings Vector Preview (384-d)
                        </span>
                        <div className="bg-[#070d1f] p-2.5 rounded-lg border border-white/5 font-mono text-[10px] text-[#b8c4ff] truncate">
                          [0.0241, -0.1982, 0.4410, 0.0821, -0.3104, 0.1198, ...]
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "relationships" && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-mono uppercase text-slate-400 block mb-2">
                        Connected Entities ({RELATIONSHIP_LABELS.length})
                      </span>
                      {RELATIONSHIP_LABELS.map((rel, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded bg-[#070d1f] border border-white/5"
                        >
                          <span className="text-[#b8c4ff] font-mono text-[11px]">{rel}</span>
                          <span className="text-slate-300">Module #{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "analytics" && (
                    <div className="space-y-3 font-mono">
                      <div className="p-3 bg-[#070d1f] rounded-lg border border-white/5 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Degree Centrality:</span>
                          <span className="text-emerald-400 font-bold">14 Edges</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Eigenvector Score:</span>
                          <span className="text-[#b8c4ff] font-bold">0.892</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Cluster Group:</span>
                          <span className="text-purple-400 font-bold">Core Architecture</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center text-slate-500 text-xs">
                Select any node on the infinite canvas to inspect details, relationships, and AI analytics.
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ── 4. FLOATING AI ASK GRAPH CHAT DRAWER ── */}
      {aiDrawerOpen && (
        <div className="absolute top-16 right-84 w-96 bg-[#151b2d]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-30 flex flex-col overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="p-3.5 border-b border-white/10 bg-[#070d1f]/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#b8c4ff]" />
              <span className="font-semibold text-xs text-[#dce1fb]">Ask Knowledge Graph AI</span>
            </div>
            <button onClick={() => setAiDrawerOpen(false)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Quick AI Prompts */}
          <div className="p-3 border-b border-white/5 bg-[#191f31]/40 flex flex-wrap gap-1.5">
            <button
              onClick={() => handleSendMessage("What documents created this knowledge?")}
              className="px-2 py-1 bg-white/5 hover:bg-[#b8c4ff]/20 text-[10px] text-[#b8c4ff] rounded border border-white/5 transition-colors"
            >
              What created this?
            </button>
            <button
              onClick={() => handleSendMessage("What would break if this node disappeared?")}
              className="px-2 py-1 bg-white/5 hover:bg-[#b8c4ff]/20 text-[10px] text-[#b8c4ff] rounded border border-white/5 transition-colors"
            >
              Impact analysis?
            </button>
            <button
              onClick={() => handleSendMessage("Summarize this cluster.")}
              className="px-2 py-1 bg-white/5 hover:bg-[#b8c4ff]/20 text-[10px] text-[#b8c4ff] rounded border border-white/5 transition-colors"
            >
              Summarize cluster
            </button>
          </div>

          {/* Messages Feed */}
          <div className="h-64 overflow-y-auto p-3 space-y-3 text-xs custom-scrollbar">
            {aiMessages.length === 0 ? (
              <p className="text-slate-500 text-center py-8 text-[11px]">
                Ask questions about graph dependencies, critical paths, or cluster summaries.
              </p>
            ) : (
              aiMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg max-w-[85%] ${
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

          {/* Input Bar */}
          <div className="p-3 border-t border-white/10 bg-[#070d1f] flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask the knowledge graph..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
              className="flex-1 bg-[#151b2d] border border-white/10 rounded-lg px-3 py-1.5 text-xs text-[#dce1fb] focus:outline-none focus:border-[#b8c4ff]"
            />
            <button
              onClick={() => handleSendMessage()}
              className="p-2 bg-[#b8c4ff] text-[#002585] rounded-lg hover:bg-white transition-colors"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
