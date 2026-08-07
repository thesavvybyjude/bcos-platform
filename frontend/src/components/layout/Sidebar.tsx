"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Brain,
  LayoutDashboard,
  BookOpen,
  Search,
  GitBranch,
  Compass,
  Package,
  Settings,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/modules", label: "Modules", icon: BookOpen },
  { href: "/search", label: "Search", icon: Search },
  { href: "/graph", label: "Knowledge Graph", icon: GitBranch },
  { href: "/orchestrator", label: "Orchestrator", icon: Compass },
  { href: "/context", label: "Context Builder", icon: Package },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/5 bg-surface-950/80 backdrop-blur-xl">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/5 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 ring-1 ring-brand-500/20">
          <Brain className="h-5 w-5 text-brand-400" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight text-surface-50">
            BCOS
          </span>
          <span className="ml-1 text-xs text-surface-200/40">Platform</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-surface-200/30">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? "bg-brand-500/10 text-brand-400 ring-1 ring-brand-500/10"
                    : "text-surface-200/50 hover:bg-white/[0.03] hover:text-surface-200"
                }`}
            >
              <Icon
                className={`h-4 w-4 ${isActive ? "text-brand-400" : "text-surface-200/30 group-hover:text-surface-200/60"}`}
              />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/5 p-4">
        <div className="flex items-center gap-2 text-xs text-surface-200/30">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse-slow" />
          <span>System Operational</span>
        </div>
        <p className="mt-1 text-[10px] text-surface-200/20">BCOS v1.0.0</p>
      </div>
    </aside>
  );
}
