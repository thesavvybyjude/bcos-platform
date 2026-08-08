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
  FolderKanban,
  Star,
  Clock,
  Layers,
  Sliders,
  Users,
  Terminal,
} from "lucide-react";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/modules", label: "Modules", icon: BookOpen },
  { href: "/search", label: "Search", icon: Search },
  { href: "/graph", label: "Knowledge Graph", icon: GitBranch },
  { href: "/orchestrator", label: "Orchestrator", icon: Compass },
  { href: "/context", label: "Context Builder", icon: Package },
];

const collectionItems = [
  { href: "/graph?collection=all", label: "All Domains", count: 12, icon: Layers },
  { href: "/graph?collection=mine", label: "My Collections", count: 8, icon: FolderKanban },
  { href: "/graph?collection=fav", label: "Favorites", count: 23, icon: Star },
  { href: "/graph?collection=recent", label: "Recent", count: 15, icon: Clock },
];

const systemItems = [
  { href: "/modules", label: "Settings", icon: Settings },
  { href: "/orchestrator", label: "Integrations", icon: Sliders },
  { href: "/search", label: "Users", icon: Users },
  { href: "/context", label: "Logs", icon: Terminal },
];

import { useAuth } from "@/lib/auth-context";
import { LogOut, LogIn, Shield, User } from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-white/5 bg-[#0c1324]/95 backdrop-blur-2xl select-none">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-white/5 px-6">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#b8c4ff]/10 ring-1 ring-[#b8c4ff]/20">
          <Brain className="h-5 w-5 text-[#b8c4ff]" />
        </div>
        <div>
          <span className="text-sm font-bold tracking-tight text-[#dce1fb]">
            BCOS
          </span>
          <span className="ml-1 text-xs text-slate-400">Platform</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-6 px-3 py-4 custom-scrollbar">
        {/* Navigation */}
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Navigation
          </p>
          <div className="space-y-1">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-[#b8c4ff]/15 text-[#b8c4ff] ring-1 ring-[#b8c4ff]/20 font-semibold"
                      : "text-slate-400 hover:bg-white/[0.03] hover:text-white"
                  }`}
                >
                  <Icon
                    className={`h-4 w-4 ${
                      isActive ? "text-[#b8c4ff]" : "text-slate-400 group-hover:text-slate-200"
                    }`}
                  />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Administration link (if Admin) */}
        {user && (user.is_superuser || user.role === "admin") && (
          <div>
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-amber-400/90 font-mono">
              Administration
            </p>
            <div className="space-y-1">
              <Link
                href="/admin/users"
                className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                  pathname === "/admin/users"
                    ? "bg-indigo-600/20 text-indigo-300 ring-1 ring-indigo-500/30 font-semibold"
                    : "text-slate-300 hover:bg-white/[0.03] hover:text-white"
                }`}
              >
                <Shield className="h-4 w-4 text-indigo-400" />
                User & API Keys
              </Link>
            </div>
          </div>
        )}

        {/* Collections */}
        <div>
          <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-wider text-slate-400 font-mono">
            Collections
          </p>
          <div className="space-y-1">
            {collectionItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="group flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium text-slate-400 hover:bg-white/[0.03] hover:text-white transition-all"
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-slate-400 group-hover:text-slate-200" />
                    <span>{item.label}</span>
                  </div>
                  <span className="font-mono text-[10px] text-slate-400">{item.count}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer / User Session */}
      <div className="border-t border-white/5 p-4 space-y-3">
        {user ? (
          <div className="flex items-center justify-between gap-2 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 flex items-center justify-center text-xs font-bold shrink-0">
                {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-semibold text-slate-200 truncate">
                  {user.full_name || user.email}
                </p>
                <span className="text-[10px] text-indigo-400 font-mono capitalize">
                  {user.role}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <Link
            href="/login"
            className="flex items-center justify-center gap-2 py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs rounded-xl shadow-md transition-all"
          >
            <LogIn className="w-4 h-4" /> Sign In
          </Link>
        )}

        <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono px-1">
          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>System Operational</span>
        </div>
      </div>
    </aside>
  );
}
