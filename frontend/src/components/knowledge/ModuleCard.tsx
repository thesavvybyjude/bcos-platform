"use client";

import Link from "next/link";
import { ModuleSummary } from "@/lib/api";
import { Layers, Shield, Zap } from "lucide-react";

export default function ModuleCard({ module }: { module: ModuleSummary }) {
  const deptBadge: Record<string, string> = {
    Marketing: "badge-marketing",
    Business: "badge-business",
    CEO: "badge-ceo",
    Technology: "badge-technology",
  };

  return (
    <Link href={`/modules/${module.slug}`}>
      <div className="glass-card group p-6 transition-all duration-300 hover:border-brand-500/20 cursor-pointer h-full">
        <div className="flex items-start justify-between mb-3">
          <span className={`badge ${deptBadge[module.department] || "badge-business"}`}>
            {module.department}
          </span>
          <Zap className="h-4 w-4 text-surface-200/20 group-hover:text-brand-400 transition-colors" />
        </div>
        <h3 className="font-semibold text-surface-50 group-hover:text-brand-300 transition-colors line-clamp-2">
          {module.name}
        </h3>
        <p className="mt-2 text-sm text-surface-200/50 line-clamp-2">
          {module.description || "No description available"}
        </p>
        <div className="mt-4 flex gap-4 text-xs text-surface-200/40">
          <span className="flex items-center gap-1"><Layers className="h-3 w-3" />{module.principle_count} principles</span>
          <span className="flex items-center gap-1"><Shield className="h-3 w-3" />{module.rule_count} rules</span>
        </div>
      </div>
    </Link>
  );
}
