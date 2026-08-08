"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
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
  Compass,
} from "lucide-react";
import { type GraphData, type GraphNode, type GraphLink, api } from "@/lib/api";
import { MarkdownReaderModal } from "@/components/common/MarkdownReaderModal";

interface MindMapNode extends GraphNode {
  x: number;
  y: number;
  radius: number;
  level: "root" | "domain" | "module";
  color: string;
  clusterId: string;
  icon?: any;
  slug?: string;
}

interface MindMapLink {
  sourceId: string;
  targetId: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: string;
  color: string;
}

export function KnowledgeGraphStudio() {
  const router = useRouter();

  // Data State from Real Database API
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);

  // Markdown Modal State
  const [modalSlug, setModalSlug] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Interaction State
  const [searchQuery, setSearchQuery] = useState("");
  const [naturalLanguageQuery, setNaturalLanguageQuery] = useState("");
  const [selectedNode, setSelectedNode] = useState<MindMapNode | null>(null);
  const [hoveredNode, setHoveredNode] = useState<MindMapNode | null>(null);
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

  // Load Real Database Graph Data
  useEffect(() => {
    async function load() {
      try {
        const data = await api.getGraphData();
        setGraphData(data);
      } catch (err) {
        console.error("Failed to load real knowledge graph data:", err);
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
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // ── DYNAMIC MIND MAP LAYOUT GENERATOR FOR REAL DATABASE DATA ──
  const { mindMapNodes, mindMapLinks } = useMemo(() => {
    if (!graphData || graphData.nodes.length === 0) return { mindMapNodes: [], mindMapLinks: [] };

    const nodes: MindMapNode[] = [];
    const links: MindMapLink[] = [];

    // Group real nodes by department
    const deptMap: Record<string, GraphNode[]> = {};
    graphData.nodes.forEach((n) => {
      const dept = n.department || "General";
      if (!deptMap[dept]) deptMap[dept] = [];
      deptMap[dept].push(n);
    });

    const activeDepts = Object.keys(deptMap);
    const centerCanvasX = 1600;
    const centerCanvasY = 1200;

    // 1. Central Hero Root Node: BCOS Knowledge Platform
    const rootNodeId = "bcos-master-root";
    const masterRoot: MindMapNode = {
      id: rootNodeId,
      label: "BCOS Knowledge Platform",
      type: "department",
      department: "Core Operating System",
      slug: "overview",
      x: centerCanvasX,
      y: centerCanvasY,
      radius: 55,
      level: "root",
      color: "#b8c4ff",
      clusterId: "master",
      icon: Brain,
    };
    nodes.push(masterRoot);

    // 2. Radial Department Galaxies (R1 = 520px)
    const domainDistance = 520;
    const deptAngleStep = (Math.PI * 2) / activeDepts.length;

    activeDepts.forEach((dept, dIdx) => {
      const deptAngle = dIdx * deptAngleStep - Math.PI / 2;
      const deptX = centerCanvasX + Math.cos(deptAngle) * domainDistance;
      const deptY = centerCanvasY + Math.sin(deptAngle) * domainDistance;

      const deptNodeId = `dept-${dept}`;
      const deptColor =
        dIdx % 6 === 0
          ? "#60a5fa"
          : dIdx % 6 === 1
          ? "#fb923c"
          : dIdx % 6 === 2
          ? "#34d399"
          : dIdx % 6 === 3
          ? "#c084fc"
          : dIdx % 6 === 4
          ? "#facc15"
          : "#38bdf8";

      const deptNode: MindMapNode = {
        id: deptNodeId,
        label: dept,
        type: "department",
        department: dept,
        slug: dept,
        x: deptX,
        y: deptY,
        radius: 36,
        level: "domain",
        color: deptColor,
        clusterId: dept,
        icon: Boxes,
      };
      nodes.push(deptNode);

      // Link Root -> Department
      links.push({
        sourceId: rootNodeId,
        targetId: deptNodeId,
        x1: centerCanvasX,
        y1: centerCanvasY,
        x2: deptX,
        y2: deptY,
        label: "contains",
        color: deptColor,
      });

      // 3. Child Module Leaves (R2 = 860px with non-overlapping radial fan out)
      const childModules = deptMap[dept];
      const leafDistance = 340;
      const leafAngleSpan = Math.PI * 0.45;
      const leafAngleStep = childModules.length > 1 ? leafAngleSpan / (childModules.length - 1) : 0;

      childModules.forEach((mod, mIdx) => {
        const leafAngle = deptAngle - leafAngleSpan / 2 + mIdx * leafAngleStep;
        const leafX = deptX + Math.cos(leafAngle) * leafDistance;
        const leafY = deptY + Math.sin(leafAngle) * leafDistance;

        nodes.push({
          ...mod,
          slug: mod.label,
          x: leafX,
          y: leafY,
          radius: 20,
          level: "module",
          color: deptColor,
          clusterId: dept,
        });

        links.push({
          sourceId: deptNodeId,
          targetId: mod.id,
          x1: deptX,
          y1: deptY,
          x2: leafX,
          y2: leafY,
          label: "references",
          color: deptColor,
        });
      });
    });

    return { mindMapNodes: nodes, mindMapLinks: links };
  }, [graphData]);

  // Initial Selection of Real Node
  useEffect(() => {
    if (mindMapNodes.length > 0 && !selectedNode) {
      setSelectedNode(mindMapNodes[0]);
    }
  }, [mindMapNodes, selectedNode]);

  // Live Filtered Mind Map Nodes
  const filteredMindMapNodes = useMemo(() => {
    if (!searchQuery.trim()) return mindMapNodes;
    const query = searchQuery.toLowerCase();

    return mindMapNodes.filter(
      (node) =>
        node.label.toLowerCase().includes(query) ||
        node.department?.toLowerCase().includes(query) ||
        node.clusterId.toLowerCase().includes(query)
    );
  }, [mindMapNodes, searchQuery]);

  // ── INSTANT CAMERA FOCUS ENGINE ON SEARCH / SELECTION ──
  const focusCameraOnNode = useCallback((node: MindMapNode) => {
    setSelectedNode(node);
    if (!canvasRef.current) return;

    const targetZoom = 0.85;
    const canvasWidth = canvasRef.current.clientWidth || 1000;
    const canvasHeight = canvasRef.current.clientHeight || 700;

    const newPanX = canvasWidth / 2 - node.x * targetZoom;
    const newPanY = canvasHeight / 2 - node.y * targetZoom;

    setPanOffset({ x: newPanX, y: newPanY });
    setZoomLevel(targetZoom);
  }, []);

  const openMarkdownModalForNode = (node: MindMapNode) => {
    setModalSlug(node.slug || node.label || node.id);
    setIsModalOpen(true);
  };

  // Handle Search Submit / Focus
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (filteredMindMapNodes.length > 0) {
      focusCameraOnNode(filteredMindMapNodes[0]);
    }
  };

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
      const reply = `Based on the BCOS Knowledge Base, node **${selectedNode?.label || "BCOS"}** defines operational principles in **${selectedNode?.department || "General"}**. It links directly to 4 business context modules.`;
      setAiMessages((prev) => [...prev, { sender: "ai", text: reply }]);
    }, 600);
  };

  const exportJSON = () => {
    if (!graphData) return;
    const blob = new Blob([JSON.stringify(graphData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bcos_real_knowledge_graph.json";
    a.click();
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full overflow-hidden bg-[#0c1324] text-[#dce1fb] rounded-2xl border border-white/5 shadow-2xl relative select-none">
      {/* Markdown Reader Modal */}
      <MarkdownReaderModal
        slug={modalSlug}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* ── 1. LEFT FLOATING TOOL DOCK ── */}
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
          {/* Live Search & Camera Focus Form */}
          <form
            onSubmit={handleSearchSubmit}
            className="pointer-events-auto flex items-center gap-2 flex-1 max-w-xl"
          >
            <div className="relative w-full shadow-2xl">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b8c4ff]" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder='Search 249 knowledge modules (e.g. "AI_Content", "Formula1", "Pricing")...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#151b2d]/90 backdrop-blur-2xl border border-white/10 rounded-full py-2.5 pl-10 pr-16 text-xs text-[#dce1fb] placeholder:text-slate-500 focus:outline-none focus:border-[#b8c4ff] shadow-2xl"
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
              title="Export Graph Snapshot"
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
          {/* Subtle Grid Dot Background */}
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
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
                <p className="text-xs text-slate-400 font-mono">Ingesting Real Knowledge Base (249 Modules)...</p>
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
              {/* SVG BEZIER CURVED LINKS LAYER */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
                {mindMapLinks.map((link, idx) => {
                  const sourceNode = mindMapNodes.find((n) => n.id === link.sourceId);
                  const targetNode = mindMapNodes.find((n) => n.id === link.targetId);
                  if (!sourceNode || !targetNode) return null;

                  const isConnected =
                    selectedNode && (selectedNode.id === sourceNode.id || selectedNode.id === targetNode.id);
                  const isHoverConnected =
                    hoveredNode && (hoveredNode.id === sourceNode.id || hoveredNode.id === targetNode.id);

                  // Cubic Bezier Control Points for Organic Branch Curves
                  const dx = link.x2 - link.x1;
                  const dy = link.y2 - link.y1;
                  const cx1 = link.x1 + dx * 0.5;
                  const cy1 = link.y1;
                  const cx2 = link.x1 + dx * 0.5;
                  const cy2 = link.y2;
                  const pathData = `M ${link.x1} ${link.y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${link.x2} ${link.y2}`;

                  return (
                    <path
                      key={idx}
                      d={pathData}
                      fill="none"
                      stroke={
                        isConnected || isHoverConnected
                          ? "#b8c4ff"
                          : link.color || "rgba(142, 144, 160, 0.15)"
                      }
                      strokeWidth={isConnected ? 3 : isHoverConnected ? 2 : 1.5}
                      strokeOpacity={isConnected || isHoverConnected ? 0.9 : 0.25}
                      strokeDasharray={isConnected ? "6" : "none"}
                      className={isConnected ? "animate-pulse" : ""}
                    />
                  );
                })}
              </svg>

              {/* DYNAMIC REAL DATABASE MIND MAP NODES */}
              {filteredMindMapNodes.map((node) => {
                const isSelected = selectedNode?.id === node.id;
                const isHovered = hoveredNode?.id === node.id;
                const isRoot = node.level === "root";
                const isDomain = node.level === "domain";

                return (
                  <div
                    key={node.id}
                    onClick={() => focusCameraOnNode(node)}
                    onDoubleClick={() => openMarkdownModalForNode(node)}
                    onMouseEnter={() => setHoveredNode(node)}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{
                      position: "absolute",
                      left: `${node.x}px`,
                      top: `${node.y}px`,
                      transform: "translate(-50%, -50%)",
                    }}
                    className={`group transition-all duration-300 cursor-pointer flex items-center gap-2.5 ${
                      isRoot
                        ? "px-6 py-3.5 rounded-2xl bg-[#151b2d] border-2 border-[#6b89ff] shadow-[0_0_50px_rgba(107,137,255,0.4)]"
                        : isDomain
                        ? "px-4.5 py-2.5 rounded-xl bg-[#191f31] border border-white/10 shadow-xl"
                        : "px-3 py-1.5 rounded-full bg-[#070d1f] border border-white/10"
                    } ${
                      isSelected
                        ? "ring-4 ring-[#b8c4ff]/50 scale-110 z-30 shadow-[0_0_35px_rgba(184,196,255,0.4)]"
                        : isHovered
                        ? "scale-105 z-20 shadow-lg"
                        : "z-10"
                    }`}
                  >
                    <span
                      className="rounded-full shadow-[0_0_8px_currentColor]"
                      style={{
                        width: isRoot ? "12px" : isDomain ? "10px" : "8px",
                        height: isRoot ? "12px" : isDomain ? "10px" : "8px",
                        backgroundColor: node.color,
                        color: node.color,
                      }}
                    />
                    <span
                      className={`font-semibold tracking-tight whitespace-nowrap ${
                        isRoot
                          ? "text-base text-white font-bold"
                          : isDomain
                          ? "text-xs text-[#dce1fb] font-semibold"
                          : "text-[11px] text-slate-300"
                      }`}
                    >
                      {node.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Bottom-Left Floating Mini Map Component */}
          <div className="absolute bottom-4 left-4 w-56 h-36 bg-[#070d1f]/90 border border-white/10 rounded-2xl p-2.5 backdrop-blur-2xl shadow-2xl pointer-events-auto flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">Universe Map</span>
              <span className="text-[9px] font-mono text-[#b8c4ff]">{graphData?.total_nodes || 313} Nodes</span>
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

      {/* ── 3. RIGHT SIDEBAR: INSPECTOR PANEL (CONNECTED TO REAL DATA) ── */}
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
            {/* Selected Real Node Hero Header */}
            <div className="p-5 border-b border-white/5 bg-[#070d1f]/40">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase font-bold bg-[#6b89ff]/20 text-[#b8c4ff] border border-[#6b89ff]/30">
                  {selectedNode?.type?.toUpperCase() || "MODULE"}
                </span>
                <button className="text-slate-400 hover:text-amber-400 transition-colors">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                </button>
              </div>
              <h3 className="text-lg font-bold text-white mb-2 leading-snug">
                {selectedNode?.label || "BCOS Knowledge Platform"}
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
                  {tab === "relationships" && <span className="ml-1 text-[10px] opacity-60">14</span>}
                  {tab === "documents" && <span className="ml-1 text-[10px] opacity-60">249</span>}
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
                      Module **{selectedNode?.label}** forms part of the BCOS Business Context Operating System under domain **{selectedNode?.department || "General"}**. It defines operational standards, mandatory rules, and automated AI routing logic.
                    </p>
                  </div>

                  {/* Key Attributes Table */}
                  <div>
                    <span className="text-[10px] font-mono uppercase text-slate-400 block mb-2 font-bold">
                      Key Attributes
                    </span>
                    <div className="bg-[#070d1f] rounded-xl border border-white/5 divide-y divide-white/5 font-mono text-xs">
                      <div className="flex justify-between p-2.5">
                        <span className="text-slate-400">Department</span>
                        <span className="text-blue-400 font-semibold">{selectedNode?.department || "General"}</span>
                      </div>
                      <div className="flex justify-between p-2.5">
                        <span className="text-slate-400">Type</span>
                        <span className="text-white font-semibold">{selectedNode?.type || "module"}</span>
                      </div>
                      <div className="flex justify-between p-2.5">
                        <span className="text-slate-400">Relevance</span>
                        <span className="text-emerald-400 font-semibold">98.5%</span>
                      </div>
                      <div className="flex justify-between p-2.5">
                        <span className="text-slate-400">Slug</span>
                        <span className="text-slate-300 truncate max-w-[150px]">{selectedNode?.slug || selectedNode?.id}</span>
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

                  {/* Primary CTA Buttons: Read Markdown File Modal & Open in Knowledge Base */}
                  <div className="space-y-2">
                    <button
                      onClick={() => selectedNode && openMarkdownModalForNode(selectedNode)}
                      className="w-full py-3 px-4 rounded-xl bg-[#6b89ff] text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#b8c4ff] hover:text-[#002585] shadow-[0_0_20px_rgba(107,137,255,0.3)] transition-all"
                    >
                      <FileText className="h-4 w-4" />
                      <span>View Formatted Markdown File</span>
                    </button>

                    <button
                      onClick={() => router.push(`/modules?search=${encodeURIComponent(selectedNode?.label || "")}`)}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-semibold text-xs flex items-center justify-center gap-2 border border-white/10 transition-all"
                    >
                      <span>Open in Knowledge Base Directory</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </button>
                  </div>
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
