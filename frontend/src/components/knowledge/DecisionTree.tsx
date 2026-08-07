"use client";

import { DecisionTree } from "@/lib/api";

export default function DecisionTreeComponent({ tree }: { tree: DecisionTree }) {
  return (
    <div className="glass-card p-4">
      <h4 className="font-semibold text-surface-50 mb-2">{tree.name}</h4>
      <div className="space-y-1.5 text-sm">
        {tree.condition && (
          <div className="flex gap-2">
            <span className="font-bold text-blue-400">IF:</span>
            <span className="text-surface-200/80">{tree.condition}</span>
          </div>
        )}
        {tree.action && (
          <div className="flex gap-2">
            <span className="font-bold text-emerald-400">THEN:</span>
            <span className="text-surface-200/80">{tree.action}</span>
          </div>
        )}
        {tree.otherwise && (
          <div className="flex gap-2">
            <span className="font-bold text-amber-400">ELSE:</span>
            <span className="text-surface-200/80">{tree.otherwise}</span>
          </div>
        )}
      </div>
    </div>
  );
}
