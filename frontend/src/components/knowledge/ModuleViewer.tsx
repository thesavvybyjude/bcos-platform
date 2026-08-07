"use client";

import { ModuleDetail } from "@/lib/api";
import PrincipleList from "./PrincipleList";
import DecisionTreeComponent from "./DecisionTree";

export default function ModuleViewer({ module }: { module: ModuleDetail }) {
  return (
    <div className="space-y-8">
      <div className="glass-card p-6">
        <h2 className="text-xl font-bold text-surface-50">{module.name}</h2>
        <p className="mt-2 text-surface-200/70">{module.description}</p>
        {module.purpose && (
          <div className="mt-4 rounded-lg bg-white/5 p-4 text-sm text-surface-200/80">
            <strong>Purpose:</strong> {module.purpose}
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold text-surface-50 mb-4">Principles</h3>
        <PrincipleList principles={module.principles} />
      </div>

      {module.decision_trees.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-surface-50 mb-4">Decision Trees</h3>
          <div className="space-y-3">
            {module.decision_trees.map((dt) => (
              <DecisionTreeComponent key={dt.id} tree={dt} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
