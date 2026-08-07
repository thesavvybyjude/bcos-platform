"use client";

interface FilterPanelProps {
  departments: string[];
  selectedDepartment: string | null;
  onSelectDepartment: (dept: string | null) => void;
}

export default function FilterPanel({
  departments,
  selectedDepartment,
  onSelectDepartment,
}: FilterPanelProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => onSelectDepartment(null)}
        className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
          !selectedDepartment
            ? "bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/30"
            : "bg-white/[0.03] text-surface-200/50 hover:text-surface-200"
        }`}
      >
        All
      </button>
      {departments.map((dept) => (
        <button
          key={dept}
          onClick={() => onSelectDepartment(dept)}
          className={`rounded-full px-3 py-1 text-xs font-medium transition-all ${
            selectedDepartment === dept
              ? "bg-brand-500/20 text-brand-300 ring-1 ring-brand-500/30"
              : "bg-white/[0.03] text-surface-200/50 hover:text-surface-200"
          }`}
        >
          {dept}
        </button>
      ))}
    </div>
  );
}
