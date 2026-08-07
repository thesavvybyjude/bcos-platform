"use client";

import { Principle } from "@/lib/api";

export default function PrincipleList({ principles }: { principles: Principle[] }) {
  if (!principles || principles.length === 0) {
    return <p className="text-sm text-surface-200/40">No principles listed.</p>;
  }

  return (
    <div className="space-y-3">
      {principles
        .sort((a, b) => a.order_index - b.order_index)
        .map((p, idx) => (
          <div key={p.id} className="glass-card p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-brand-500/10 text-xs font-bold text-brand-400">
                {idx + 1}
              </span>
              <div>
                <h4 className="font-semibold text-surface-50">{p.title}</h4>
                <p className="mt-1 text-sm text-surface-200/70">{p.description}</p>
              </div>
            </div>
          </div>
        ))}
    </div>
  );
}
