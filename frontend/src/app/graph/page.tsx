"use client";

import { useEffect, useRef, useState } from "react";
import { api, type GraphData, type GraphNode, type GraphLink } from "@/lib/api";
import { GitBranch, Maximize2, ZoomIn, ZoomOut } from "lucide-react";

export default function GraphPage() {
  const svgRef = useRef<SVGSVGElement>(null);
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await api.getGraphData();
        setGraphData(data);
      } catch (err) {
        console.error("Failed to load graph:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    if (!graphData || !svgRef.current) return;
    renderGraph(graphData, svgRef.current, setHoveredNode);
  }, [graphData]);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-surface-50">
            Knowledge Graph
          </h1>
          <p className="mt-1 text-sm text-surface-200/50">
            {graphData
              ? `${graphData.total_nodes} nodes · ${graphData.total_links} connections`
              : "Loading graph..."}
          </p>
        </div>
      </div>

      {/* Graph container */}
      <div className="glass-card relative overflow-hidden" style={{ height: "70vh" }}>
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
              <GitBranch className="h-12 w-12 text-surface-200/20 animate-pulse" />
              <p className="text-sm text-surface-200/40">Building graph...</p>
            </div>
          </div>
        ) : graphData && graphData.nodes.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-center">
              <GitBranch className="h-16 w-16 text-surface-200/20" />
              <p className="text-lg font-medium text-surface-200/40">
                No graph data available
              </p>
              <p className="text-sm text-surface-200/30">
                Load knowledge modules first, then the graph will populate
              </p>
            </div>
          </div>
        ) : (
          <svg
            ref={svgRef}
            className="h-full w-full"
            style={{ background: "transparent" }}
          />
        )}

        {/* Tooltip */}
        {hoveredNode && (
          <div className="absolute bottom-4 left-4 rounded-lg border border-white/10 bg-surface-900/95 backdrop-blur-xl px-4 py-3 shadow-xl">
            <p className="text-sm font-semibold text-surface-50">
              {hoveredNode.label}
            </p>
            <p className="text-xs text-surface-200/50">
              Type: {hoveredNode.type}
              {hoveredNode.department && ` · ${hoveredNode.department}`}
            </p>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-4 right-4 rounded-lg border border-white/5 bg-surface-900/80 backdrop-blur-sm px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-surface-200/30 mb-2">
            Legend
          </p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-brand-500" />
              <span className="text-xs text-surface-200/50">Department</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-500" />
              <span className="text-xs text-surface-200/50">Module</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-px w-3 bg-surface-200/30" />
              <span className="text-xs text-surface-200/50">Connection</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Render force-directed graph using raw SVG (D3 loaded dynamically).
 * Falls back to a static layout if D3 is not available.
 */
function renderGraph(
  data: GraphData,
  svg: SVGSVGElement,
  onHover: (node: GraphNode | null) => void
) {
  // Clear existing
  svg.innerHTML = "";

  const width = svg.clientWidth || 800;
  const height = svg.clientHeight || 600;
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);

  if (data.nodes.length === 0) return;

  // Simple force layout without D3 (pure SVG fallback)
  // Position nodes in a circular layout by type
  const deptNodes = data.nodes.filter((n) => n.type === "department");
  const modNodes = data.nodes.filter((n) => n.type === "module");

  const centerX = width / 2;
  const centerY = height / 2;
  const deptRadius = Math.min(width, height) * 0.2;
  const modRadius = Math.min(width, height) * 0.38;

  const positions: Record<string, { x: number; y: number }> = {};

  // Position department nodes in inner circle
  deptNodes.forEach((node, i) => {
    const angle = (i / deptNodes.length) * Math.PI * 2 - Math.PI / 2;
    positions[node.id] = {
      x: centerX + Math.cos(angle) * deptRadius,
      y: centerY + Math.sin(angle) * deptRadius,
    };
  });

  // Position module nodes in outer circle, grouped by department
  const modulesByDept: Record<string, GraphNode[]> = {};
  modNodes.forEach((node) => {
    const dept = node.department || "Unknown";
    if (!modulesByDept[dept]) modulesByDept[dept] = [];
    modulesByDept[dept].push(node);
  });

  let modIndex = 0;
  const totalMods = modNodes.length;
  Object.entries(modulesByDept).forEach(([, mods]) => {
    mods.forEach((node) => {
      const angle = (modIndex / totalMods) * Math.PI * 2 - Math.PI / 2;
      positions[node.id] = {
        x: centerX + Math.cos(angle) * modRadius,
        y: centerY + Math.sin(angle) * modRadius,
      };
      modIndex++;
    });
  });

  // Defs for glow effect
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  const filter = document.createElementNS("http://www.w3.org/2000/svg", "filter");
  filter.setAttribute("id", "glow");
  const blur = document.createElementNS("http://www.w3.org/2000/svg", "feGaussianBlur");
  blur.setAttribute("stdDeviation", "3");
  blur.setAttribute("result", "glow");
  filter.appendChild(blur);
  const merge = document.createElementNS("http://www.w3.org/2000/svg", "feMerge");
  const m1 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
  m1.setAttribute("in", "glow");
  merge.appendChild(m1);
  const m2 = document.createElementNS("http://www.w3.org/2000/svg", "feMergeNode");
  m2.setAttribute("in", "SourceGraphic");
  merge.appendChild(m2);
  filter.appendChild(merge);
  defs.appendChild(filter);
  svg.appendChild(defs);

  // Draw links
  const linkGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  data.links.forEach((link) => {
    const s = positions[typeof link.source === "string" ? link.source : ""];
    const t = positions[typeof link.target === "string" ? link.target : ""];
    if (!s || !t) return;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", String(s.x));
    line.setAttribute("y1", String(s.y));
    line.setAttribute("x2", String(t.x));
    line.setAttribute("y2", String(t.y));
    line.setAttribute("stroke", "rgba(148, 163, 184, 0.1)");
    line.setAttribute("stroke-width", "1");
    linkGroup.appendChild(line);
  });
  svg.appendChild(linkGroup);

  // Draw nodes
  const nodeGroup = document.createElementNS("http://www.w3.org/2000/svg", "g");
  data.nodes.forEach((node) => {
    const pos = positions[node.id];
    if (!pos) return;

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.setAttribute("transform", `translate(${pos.x}, ${pos.y})`);
    g.style.cursor = "pointer";

    // Circle
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    const radius = node.type === "department" ? 16 : 8;
    const color =
      node.type === "department" ? "#5c7cfa" : "#34d399";
    circle.setAttribute("r", String(radius));
    circle.setAttribute("fill", color);
    circle.setAttribute("opacity", "0.8");
    circle.setAttribute("filter", "url(#glow)");
    g.appendChild(circle);

    // Label
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.textContent =
      node.label.length > 20
        ? node.label.substring(0, 18) + "..."
        : node.label;
    text.setAttribute("dy", String(radius + 14));
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("fill", "rgba(248, 250, 252, 0.5)");
    text.setAttribute("font-size", node.type === "department" ? "11" : "9");
    text.setAttribute("font-family", "Inter, sans-serif");
    g.appendChild(text);

    // Hover handlers
    g.addEventListener("mouseenter", () => {
      circle.setAttribute("opacity", "1");
      circle.setAttribute("r", String(radius + 3));
      onHover(node);
    });
    g.addEventListener("mouseleave", () => {
      circle.setAttribute("opacity", "0.8");
      circle.setAttribute("r", String(radius));
      onHover(null);
    });

    nodeGroup.appendChild(g);
  });
  svg.appendChild(nodeGroup);
}
