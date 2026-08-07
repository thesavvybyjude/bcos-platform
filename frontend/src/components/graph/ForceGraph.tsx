"use client";

import { GraphData } from "@/lib/api";

export default function ForceGraph({ data }: { data: GraphData }) {
  return (
    <div className="flex h-64 items-center justify-center rounded-xl bg-white/[0.02] border border-white/5 text-surface-200/40">
      ForceGraph (Rendered via D3 / SVG in graph page)
    </div>
  );
}
