"use client";

import { Brain, Search, Bell } from "lucide-react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-white/5 bg-surface-950/80 px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 md:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500/10 ring-1 ring-brand-500/20">
            <Brain className="h-4 w-4 text-brand-400" />
          </div>
          <span className="font-bold text-surface-50">BCOS</span>
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Link
          href="/search"
          className="flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-1.5 text-xs text-surface-200/50 hover:text-surface-200 ring-1 ring-white/5 transition-all"
        >
          <Search className="h-3.5 w-3.5" />
          <span>Quick search...</span>
          <kbd className="rounded bg-white/5 px-1.5 py-0.5 text-[10px]">⌘K</kbd>
        </Link>
      </div>
    </header>
  );
}
