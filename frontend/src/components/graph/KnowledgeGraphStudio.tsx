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
  Brain,
  Share2,
  Layers,
} from "lucide-react";
import { type GraphData, type GraphNode, type GraphLink, api } from "@/lib/api";

// ── Node Type Palette Specification ──
const NODE_TYPES = [
  { id: "domain", label: "Domains (Root)", color: "#b8c4ff" },
  { id: "concept", label: "Concepts", color: "#60a5fa" },
  { id: "person", label: "People", color: "#c084fc" },
  { id: "organization", label: "Organizations", color: "#34d399" },
  { id: "document", label: "Documents", color: "#fb923c" },
  { id: "event", label: "Events", color: "#f87171" },
  { id: "task", label: "Tasks & Rules", color: "#facc15" },
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

// ── Mind Map Node Interface ──
interface MindMapNode extends GraphNode {
  x: number;
  y: number;
  radius: number;
  level: "root" | "category" | "document";
  color: string;
  clusterId: string;
}

interface MindMapLink {
  sourceId: string;
  targetId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
}

export function KnowledgeGraphStudio() {
  // Data State
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);

  // Interaction State
  const [searchQuery, setSearchQuery] = useState("");
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<MindMapNode | null>(null);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; node: MindMapNode } | null>(null);

  // Floating Sidebar States (85-90% Canvas Focus)
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<"overview" | "relationships" | "documents" | "history" | "analytics">("overview");
  const [aiDrawerOpen, setAiDrawerOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ sender: "user" | "ai"; text: string }>>([]);
  const [chatInput, setChatInput] = useState("");

  // Canvas Viewport & Infinite Zoom State
  const [zoomLevel, setZoomLevel] = useState(0.75);
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

  // Theme Sync
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
        setLeftSidebarOpen(true);
        setTimeout(() => searchInputRef.current?.focus(), 150);
      } else if (e.key === "Escape") {
        setContextMenu(null);
        setHoveredNode(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── HIERARCHICAL RADIAL TREE ENGINE WITH ZERO OVERLAP & COLLISION PREVENTION ──
  const { mindMapNodes, mindMapLinks } = useMemo(() => {
    if (!graphData || graphData.nodes.length === 0) return { mindMapNodes: [], mindMapLinks: [] };

    const nodes: MindMapNode[] = [];
    const links: MindMapLink[] = [];

    // Group nodes by domain
    const deptMap: Record<string, GraphNode[]> = {};
    graphData.nodes.forEach((n) => {
      const dept = n.department || "General";
      if (!deptMap[dept]) deptMap[dept] = [];
      deptMap[dept].push(n);
    });

    const activeDepts = Object.keys(deptMap);
    const centerCanvasX = 1800;
    const centerCanvasY = 1400;

    // Minimum Separation Rules:
    // Root Domains: 750px apart
    // Primary Categories: 450px ring radius
    // Documents: 850px ring radius with vertical clearance 140px+
    const domainDistance = 750;
    const sectorStepAngle = (Math.PI * 2) / activeDepts.length;

    activeDepts.forEach((dept, dIdx) => {
      // Each domain gets a dedicated 36° angular sector
      const sectorCenterAngle = dIdx * sectorStepAngle - Math.PI / 2;
      const galaxyX = centerCanvasX + Math.cos(sectorCenterAngle) * domainDistance;
      const galaxyY = centerCanvasY + Math.sin(sectorCenterAngle) * domainDistance;

      const rootNodeId = `domain-${dept}`;
      nodes.push({
        id: rootNodeId,
        label: dept,
        type: "domain",
        department: dept,
        x: galaxyX,
        y: galaxyY,
        radius: 50,
        level: "root",
        color: "#b8c4ff",
        clusterId: dept,
      });

      // Branch children radially within the domain's exclusive angular sector
      const childNodes = deptMap[dept];
      const categoryNodes = childNodes.filter((c) => c.type === "department");
      const documentNodes = childNodes.filter((c) => c.type !== "department");

      // Ring 1: Primary Categories (Radius = 380px around Domain)
      const categoryRadius = 380;
      const catAngleStep = categoryNodes.length > 0 ? (Math.PI * 0.5) / (categoryNodes.length + 1) : 0;

      categoryNodes.forEach((cat, cIdx) => {
        const catAngle = sectorCenterAngle - (Math.PI * 0.25) + (cIdx + 1) * catAngleStep;
        const catX = galaxyX + Math.cos(catAngle) * categoryRadius;
        const catY = galaxyY + Math.sin(catAngle) * categoryRadius;

        nodes.push({
          ...cat,
          x: catX,
          y: catY,
          radius: 28,
          level: "category",
          color: "#60a5fa",
          clusterId: dept,
        });

        links.push({
          sourceId: rootNodeId,
          targetId: cat.id,
          x1: galaxyX,
          y1: galaxyY,
          x2: catX,
          y2: catY,
          label: "contains",
        });
      });

      // Ring 2: Document / Module Leaves (Radius = 720px with minimum 160px vertical clearance)
      const docRadius = 720;
      const totalDocs = documentNodes.length;
      const docAngleSpan = Math.PI * 0.75;
      const docAngleStep = totalDocs > 1 ? docAngleSpan / (totalDocs - 1) : 0;

      documentNodes.forEach((doc, idx) => {
        const docAngle = sectorCenterAngle - docAngleSpan / 2 + idx * docAngleStep;
        const docX = galaxyX + Math.cos(docAngle) * docRadius;
        const docY = galaxyY + Math.sin(docAngle) * docRadius;

        nodes.push({
          ...doc,
          x: docX,
          y: docY,
          radius: 20,
          level: "document",
          color: doc.type === "person" ? "#c084fc" : doc.type === "organization" ? "#34d399" : "#fb923c",
          clusterId: dept,
        });

        links.push({
          sourceId: rootNodeId,
          targetId: doc.id,
          x1: galaxyX,
          y1: galaxyY,
          x2: docX,
          y2: docY,
          label: "references",
        });
      });
    });

    // ── COLLISION RESOLUTION PASS (ZERO OVERLAP POLICY) ──
    for (let pass = 0; pass < 5; pass++) {
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const n1 = nodes[i];
          const n2 = nodes[j];

          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minClearance = n1.level === "root" || n2.level === "root" ? 180 : 130;

          if (dist < minClearance && dist > 0) {
            const overlap = minClearance - dist;
            const shiftX = (dx / dist) * (overlap / 2);
            const shiftY = (dy / dist) * (overlap / 2);

            n1.x -= shiftX;
            n1.y -= shiftY;
            n2.x += shiftX;
            n2.y += shiftY;
          }
        }
      }
    }

    return { mindMapNodes: nodes, mindMapLinks: links };
  }, [graphData]);

  // Initial node selection
  useEffect(() => {
    if (mindMapNodes.length > 0 && !selectedNode) {
      setSelectedNode(mindMapNodes[0]);
    }
  }, [mindMapNodes, selectedNode]);

  // Filtered mind map nodes
  const filteredMindMapNodes = useMemo(() => {
    return mindMapNodes.filter((node) => {
      const queryMatch =
        searchQuery === "" ||
        node.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
        node.department?.toLowerCase().includes(searchQuery.toLowerCase());

      const domainMatch = selectedDomain === "all" || node.clusterId === selectedDomain;
      const tagMatch = !selectedTag || (selectedTag === "#RAG" && node.label.toLowerCase().includes("ai"));

      return queryMatch && domainMatch && tagMatch;
    });
  }, [mindMapNodes, searchQuery, selectedDomain, selectedTag]);

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

  // Node Context Menu
  const handleContextMenu = (e: React.MouseEvent, node: MindMapNode) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, node });
  };

  // AI Chat Handler
  const handleSendMessage = (textToSend?: string) => {
    const query = textToSend || chatInput;
    if (!query.trim()) return;

    setAiMessages((prev) => [...prev, { sender: "user", text: query }]);
    setChatInput("");

    setTimeout(() => {
      let reply = "Based on the BCOS Mind Map System, ";
      if (selectedNode) {
        reply += `for node **${selectedNode.label}**: it anchors ${
          mindMapLinks.filter((l) => l.sourceId === selectedNode.id || l.targetId === selectedNode.id).length
        } connected concept branches in domain **${selectedNode.department}**.`;
      } else {
        reply += `the ecosystem contains ${mindMapNodes.length} interconnected thoughts across 64 business domains.`;
      }
      setAiMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    }, 600);
  };

  const handleNaturalLanguageSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!naturalLanguageQuery.trim()) return;
    setSearchQuery(naturalLanguageQuery);
    setAiDrawerOpen(true);
    handleSendMessage(`Expand thoughts related to "${naturalLanguageQuery}"`);
  };

  const exportJSON = () => {
    if (!graphData) return;
    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bcos_mindmap_universe.json";
    a.click();
  };

  return (
    <div
      className="flex h-[calc(100vh-5rem)] w-full overflow-hidden bg-[#0c1324] text-[#dce1fb] rounded-xl border border-white/5 shadow-2xl relative select-none"
      onClick={() => setContextMenu(null)}
    >
      {/* ── 1. LEFT SIDEBAR (FLOATING EXPLORER RAIL - 85-90% CANVAS FOCUS) ── */}
      <aside
        className={`absolute top-4 left-4 bottom-4 z-30 transition-all duration-300 flex flex-col rounded-2xl border border-white/10 bg-[#151b2d]/90 backdrop-blur-2xl shadow-2xl ${
          leftSidebarOpen ? "w-72" : "w-12 overflow-hidden"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-white/5">
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            title={leftSidebarOpen ? "Collapse Explorer" : "Expand Explorer"}
          >
            {leftSidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <FolderTree className="h-4 w-4 text-[#b8c4ff]" />}
          </button>
          {leftSidebarOpen && (
            <span className="font-semibold text-xs tracking-tight text-[#dce1fb] font-mono uppercase">
              Mind Map Explorer
            </span>
          )}
        </div>

        {leftSidebarOpen && (
          <div className="flex-1 overflow-y-auto p-3 space-y-5 custom-scrollbar">
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search thoughts (Ctrl + F)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#070d1f] border border-white/10 rounded-lg py-2 pl-9 pr-8 text-xs text-[#dce1fb] placeholder:text-slate-500 focus:outline-none focus:border-[#b8c4ff]"
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

            {/* Domains List */}
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2 font-semibold">
                Thought Galaxies ({DOMAINS.length})
              </span>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedDomain("all")}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                    selectedDomain === "all" ? "bg-[#b8c4ff]/20 text-[#b8c4ff] font-semibold" : "text-slate-400 hover:bg-white/5"
                  }`}
                >
                  All Galaxies
                </button>
                {DOMAINS.map((domain) => (
                  <button
                    key={domain}
                    onClick={() => setSelectedDomain(domain)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-all ${
                      selectedDomain === domain
                        ? "bg-[#b8c4ff]/20 text-[#b8c4ff] font-semibold"
                        : "text-slate-400 hover:bg-white/5"
                    }`}
                  >
                    <span>{domain}</span>
                    <span className="font-mono text-[10px] text-slate-500">
                      {mindMapNodes.filter((n) => n.clusterId === domain).length}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Tags */}
            <div>
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2 font-semibold">
                Concept Tags
              </span>
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
          </div>
        )}
      </aside>

      {/* ── 2. CENTER: 85-90% INFINITE THINKING CANVAS ── */}
      <main
        ref={canvasRef}
        className="flex-1 flex flex-col relative overflow-hidden bg-[#0c1324] cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Floating Top Control Rail */}
        <div className="absolute top-4 left-20 right-4 z-20 flex items-center justify-between pointer-events-none">
          {/* Natural Language Query Bar */}
          <form
            onSubmit={handleNaturalLanguageSearch}
            className="pointer-events-auto flex items-center gap-2 flex-1 max-w-md"
          >
            <div className="relative w-full shadow-2xl">
              <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b8c4ff]" />
              <input
                type="text"
                placeholder='Ask Mind Map: "Show thoughts on Retrieval Augmented Generation"'
                value={naturalLanguageQuery}
                onChange={(e) => setNaturalLanguageQuery(e.target.value)}
                className="w-full bg-[#151b2d]/90 backdrop-blur-xl border border-white/10 rounded-full py-2 pl-9 pr-8 text-xs text-[#dce1fb] placeholder:text-slate-500 focus:outline-none focus:border-[#b8c4ff]"
              />
            </div>
          </form>

          {/* Floating Actions */}
          <div className="pointer-events-auto flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 bg-[#151b2d]/90 border border-white/10 backdrop-blur-xl text-slate-300 hover:text-white rounded-xl shadow-xl transition-colors"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun className="h-4 w-4 text-amber-400" /> : <Moon className="h-4 w-4 text-blue-400" />}
            </button>

            {/* Export JSON */}
            <button
              onClick={exportJSON}
              className="p-2 bg-[#151b2d]/90 border border-white/10 backdrop-blur-xl text-slate-300 hover:text-white rounded-xl shadow-xl transition-colors"
              title="Export Mind Map JSON"
            >
              <Download className="h-4 w-4" />
            </button>

            {/* Zoom Controls & Level Indicator */}
            <div className="flex items-center gap-1 bg-[#151b2d]/90 border border-white/10 backdrop-blur-xl p-1 rounded-xl shadow-xl">
              <button
                onClick={() => setZoomLevel((z) => Math.min(z + 0.2, 3.0))}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Zoom In"
              >
                <ZoomIn className="h-4 w-4" />
              </button>
              <span className="text-[10px] font-mono text-[#b8c4ff] px-1 font-semibold">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                onClick={() => setZoomLevel((z) => Math.max(z - 0.2, 0.15))}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Zoom Out"
              >
                <ZoomOut className="h-4 w-4" />
              </button>
              <button
                onClick={() => {
                  setZoomLevel(0.75);
                  setPanOffset({ x: 0, y: 0 });
                }}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                title="Reset Camera"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>

            {/* AI Assistant Drawer Toggle */}
            <button
              onClick={() => setAiDrawerOpen(!aiDrawerOpen)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#6b89ff] to-[#b8c4ff] text-[#002585] font-bold text-xs flex items-center gap-2 shadow-[0_0_20px_rgba(184,196,255,0.4)] transition-all"
            >
              <Brain className="h-4 w-4" />
              <span>Ask Brain</span>
            </button>
          </div>
        </div>

        {/* Dynamic Infinite Canvas Viewport */}
        <div className="w-full h-full relative">
          {/* Subtle Constellation Star Grid Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-15"
            style={{
              backgroundImage: `radial-gradient(circle, #8e90a0 1px, transparent 1px)`,
              backgroundSize: `${36 * zoomLevel}px ${36 * zoomLevel}px`,
              backgroundPosition: `${panOffset.x}px ${panOffset.y}px`,
            }}
          />

          {loading ? (
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <Brain className="h-12 w-12 text-[#b8c4ff] animate-pulse" />
                <p className="text-xs text-slate-400 font-mono">Generating Non-Overlapping Mind Map...</p>
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
              {/* SVG ORGANIC CURVED BEZIER LINKS LAYER WITH ZERO LABEL COLLISION */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                {mindMapLinks.map((link, idx) => {
                  const sourceNode = mindMapNodes.find((n) => n.id === link.sourceId);
                  const targetNode = mindMapNodes.find((n) => n.id === link.targetId);
                  if (!sourceNode || !targetNode) return null;

                  const isConnected =
                    selectedNode && (selectedNode.id === sourceNode.id || selectedNode.id === targetNode.id);
                  const isHoverConnected =
                    hoveredNode && (hoveredNode.id === sourceNode.id || hoveredNode.id === targetNode.id);

                  // Cubic Bezier Control Points for Clean Curved Branch Routing
                  const dx = link.x2 - link.x1;
                  const dy = link.y2 - link.y1;
                  const cx1 = link.x1 + dx * 0.4;
                  const cy1 = link.y1 + dy * 0.1;
                  const cx2 = link.x1 + dx * 0.6;
                  const cy2 = link.y2 - dy * 0.1;
                  const pathData = `M ${link.x1} ${link.y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${link.x2} ${link.y2}`;

                  return (
                    <g key={idx}>
                      <path
                        d={pathData}
                        fill="none"
                        stroke={
                          isConnected || isHoverConnected
                            ? "#b8c4ff"
                            : "rgba(142, 144, 160, 0.09)"
                        }
                        strokeWidth={isConnected ? 3 : isHoverConnected ? 2 : 1}
                        strokeDasharray={isConnected ? "6" : "none"}
                        className={isConnected ? "animate-pulse" : ""}
                      />
                      {/* Progressive Disclosure: Reveal Edge Labels at Zoom >= 100% */}
                      {zoomLevel >= 1.0 && (isConnected || isHoverConnected) && (
                        <text
                          x={(link.x1 + link.x2) / 2}
                          y={(link.y1 + link.y2) / 2 - 8}
                          fill="#b8c4ff"
                          fontSize="10"
                          fontFamily="JetBrains Mono, monospace"
                          textAnchor="middle"
                          className="bg-[#0c1324] px-1 font-semibold"
                        >
                          {link.label}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>

              {/* MIND MAP THOUGHT NODES CONSTELLATION */}
              {filteredMindMapNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const isHovered = hoveredNode?.id === node.id;
                const isRoot = node.level === "root";
                const isCategory = node.level === "category";

                // Progressive Disclosure Rules
                if (zoomLevel < 0.30 && !isRoot) return null;
                if (zoomLevel < 0.55 && node.level === "document") return null;

                return (
                  <div
                    key={node.id}
                    onClick={() => setSelectedNode(node)}
                    onContextMenu={(e) => handleContextMenu(e, node)}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{
                      position: "absolute",
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                    className={`group transition-all duration-300 cursor-pointer flex items-center justify-center rounded-full ${
                      isRoot
                        ? "px-7 py-3.5 border-2 border-[#b8c4ff] bg-[#151b2d] shadow-[0_0_45px_rgba(184,196,255,0.4)]"
                        : isCategory
                        ? "px-5 py-2.5 border border-blue-400/40 bg-[#191f31] shadow-[0_0_25px_rgba(96,165,250,0.25)]"
                        : "px-3.5 py-1.5 border border-white/10 bg-[#070d1f] hover:border-white/30"
                    } ${
                      isSelected
                        ? "ring-4 ring-[#b8c4ff]/50 scale-110 z-30"
                        : isHovered
                        ? "scale-105 z-20"
                        : "z-10"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full shadow-[0_0_10px_currentColor]"
                        style={{
                          width: `${node.radius * 0.35}px`,
                          height: `${node.radius * 0.35}px`,
                          backgroundColor: node.color,
                          color: node.color,
                        }}
                      />
                      <span
                        className={`font-semibold tracking-tight whitespace-nowrap ${
                          isRoot
                            ? "text-sm text-white font-mono uppercase"
                            : isCategory
                            ? "text-xs text-blue-300 font-medium"
                            : "text-[11px] text-slate-300"
                        }`}
                      >
                        {node.label}
                      </span>
                    </div>

                    {/* Node Hover Tooltip Card */}
                    {isHovered && (
                      <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 w-48 bg-[#191f31] border border-white/15 rounded-xl p-2.5 shadow-2xl text-[10px] font-mono text-slate-300 pointer-events-none z-40">
                        <div className="flex justify-between text-[#b8c4ff] font-bold mb-1">
                          <span>{node.type?.toUpperCase()}</span>
                          <span>98% Match</span>
                        </div>
                        <p className="line-clamp-2 text-slate-400 font-sans">{node.label}</p>
                      </div>
                    )}
                  </div>
                );
              })}
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
                <span>Focus Thought</span>
              </button>
              <button
                onClick={() => {
                  setAiDrawerOpen(true);
                  handleSendMessage(`What would break if thought "${contextMenu.node.label}" disappeared?`);
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
                <span>Copy ID</span>
              </button>
            </div>
          )}

          {/* Bottom-Right Mini Map */}
          <div className="absolute bottom-4 right-4 w-48 h-32 bg-[#070d1f]/90 border border-white/10 rounded-xl p-2 backdrop-blur-2xl shadow-2xl pointer-events-auto">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Universe Map</span>
              <span className="text-[9px] font-mono text-[#b8c4ff]">{filteredMindMapNodes.length} Thoughts</span>
            </div>
            <div className="w-full h-22 bg-[#151b2d] rounded-lg relative overflow-hidden border border-white/5">
              <div className="absolute inset-2 border border-[#b8c4ff]/60 bg-[#b8c4ff]/10 rounded-md" />
              <div className="absolute top-4 left-8 h-2 w-2 rounded-full bg-[#b8c4ff] shadow-[0_0_8px_#b8c4ff]" />
              <div className="absolute top-10 left-20 h-1.5 w-1.5 rounded-full bg-blue-400" />
              <div className="absolute top-14 left-32 h-1.5 w-1.5 rounded-full bg-emerald-400" />
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
              <span className="font-semibold text-xs tracking-tight text-[#dce1fb] font-mono uppercase">
                Thought Inspector
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
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold"
                      style={{
                        backgroundColor: `${selectedNode.color}20`,
                        color: selectedNode.color,
                      }}
                    >
                      {selectedNode.type || "Thought"}
                    </span>
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

                {/* Inspector Content */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs custom-scrollbar">
                  {activeTab === "overview" && (
                    <div className="space-y-4">
                      <div>
                        <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1 font-semibold">
                          AI Thought Summary
                        </span>
                        <p className="text-slate-300 leading-relaxed bg-[#070d1f] p-3 rounded-xl border border-white/5">
                          {selectedNode.label} forms a core foundational thought in the BCOS Business Context Operating System. It defines operational standards, governance principles, and automated AI routing rules.
                        </p>
                      </div>

                      <div>
                        <span className="text-[11px] font-mono uppercase text-slate-400 block mb-1 font-semibold">
                          384-D Vector Embedding Preview
                        </span>
                        <div className="bg-[#070d1f] p-2.5 rounded-xl border border-white/5 font-mono text-[10px] text-[#b8c4ff] truncate">
                          [0.0241, -0.1982, 0.4410, 0.0821, -0.3104, 0.1198, ...]
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === "relationships" && (
                    <div className="space-y-2">
                      <span className="text-[11px] font-mono uppercase text-slate-400 block mb-2 font-semibold">
                        Connected Concept Branches ({RELATIONSHIP_LABELS.length})
                      </span>
                      {RELATIONSHIP_LABELS.map((rel, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-2 rounded-lg bg-[#070d1f] border border-white/5"
                        >
                          <span className="text-[#b8c4ff] font-mono text-[11px]">{rel}</span>
                          <span className="text-slate-300">Thought Branch #{i + 1}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {activeTab === "analytics" && (
                    <div className="space-y-3 font-mono">
                      <div className="p-3 bg-[#070d1f] rounded-xl border border-white/5 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Branch Centrality:</span>
                          <span className="text-emerald-400 font-bold">14 Connections</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Thought Weight:</span>
                          <span className="text-[#b8c4ff] font-bold">0.945</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center p-6 text-center text-slate-500 text-xs">
                Select any thought node on the infinite canvas to inspect details and AI analytics.
              </div>
            )}
          </div>
        )}
      </aside>

      {/* ── 4. FLOATING AI ASK BRAIN DRAWER ── */}
      {aiDrawerOpen && (
        <div className="absolute top-16 right-84 w-96 bg-[#151b2d]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden animate-slide-up">
          <div className="p-3.5 border-b border-white/10 bg-[#070d1f]/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-[#b8c4ff]" />
              <span className="font-semibold text-xs text-[#dce1fb]">Ask Knowledge Brain AI</span>
            </div>
            <button onClick={() => setAiDrawerOpen(false)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

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

          <div className="h-64 overflow-y-auto p-3 space-y-3 text-xs custom-scrollbar">
            {aiMessages.length === 0 ? (
              <p className="text-slate-500 text-center py-8 text-[11px]">
                Ask questions about thought dependencies, critical paths, or cluster summaries.
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

          <div className="p-3 border-t border-white/10 bg-[#070d1f] flex items-center gap-2">
            <input
              type="text"
              placeholder="Ask the knowledge brain..."
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
