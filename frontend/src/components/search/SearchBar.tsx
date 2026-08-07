"use client";

import { Search } from "lucide-react";

interface SearchBarProps {
  query: string;
  onChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  placeholder?: string;
}

export default function SearchBar({
  query,
  onChange,
  onSubmit,
  placeholder = "Search knowledge base...",
}: SearchBarProps) {
  return (
    <form onSubmit={onSubmit} className="relative w-full">
      <input
        type="text"
        value={query}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-white/5 bg-white/[0.03] px-5 py-4 pl-12 text-sm text-surface-50 placeholder:text-surface-200/30 focus:border-brand-500/30 focus:outline-none focus:ring-1 focus:ring-brand-500/20"
      />
      <Search className="absolute left-4 top-4 h-5 w-5 text-surface-200/30" />
    </form>
  );
}
