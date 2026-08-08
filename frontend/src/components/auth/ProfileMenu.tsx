"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { User, LogOut, Shield, Settings, Key, ChevronDown } from "lucide-react";

export function ProfileMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 bg-slate-900 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl transition-colors text-xs font-medium text-slate-200"
      >
        <div className="w-6 h-6 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30 flex items-center justify-center font-bold text-[10px]">
          {user.full_name ? user.full_name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
        </div>
        <span className="truncate max-w-[120px]">{user.full_name || user.email}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl p-1.5 shadow-2xl z-50 text-xs space-y-1"
        >
          <div className="px-3 py-2 border-b border-slate-800">
            <p className="font-semibold text-slate-100 truncate">{user.full_name || user.email}</p>
            <span className="text-[10px] text-indigo-400 font-mono capitalize">{user.role} role</span>
          </div>

          {(user.is_superuser || user.role === "admin") && (
            <Link
              href="/admin/users"
              className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
            >
              <Shield className="w-3.5 h-3.5 text-indigo-400" /> Admin Users
            </Link>
          )}

          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors text-left"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
