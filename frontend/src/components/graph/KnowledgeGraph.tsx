"use client";

import { GraphData } from "@/lib/api";

export default function KnowledgeGraph({ data }: { data: GraphData }) {
  return (
    <div className="glass-card p-4">
      <h3 className="font-semibold text-surface-50 mb-2">Knowledge Graph Summary</h3>
      <p className="text-sm text-surface-200/60">
        Nodes: {data.total_nodes} | Connections: {data.total_links}
      </p>
    </div>
  );
}
