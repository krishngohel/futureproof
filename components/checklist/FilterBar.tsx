"use client";

import type { FeedbackCategory, FeedbackPriority, FeedbackItemStatus } from "@/types";

export interface Filters {
  category: FeedbackCategory | "all";
  priority: FeedbackPriority | "all";
  statuses: FeedbackItemStatus[];
}

interface Props {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

const CATEGORIES: (FeedbackCategory | "all")[] = ["all", "copy", "layout", "color", "bug", "other"];
const PRIORITIES: (FeedbackPriority | "all")[] = ["all", "urgent", "normal", "low"];
const STATUSES: { value: FeedbackItemStatus; label: string }[] = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "done", label: "Done" },
];

export default function FilterBar({ filters, onChange }: Props) {
  function toggleStatus(status: FeedbackItemStatus) {
    const has = filters.statuses.includes(status);
    const next = has
      ? filters.statuses.filter((s) => s !== status)
      : [...filters.statuses, status];
    onChange({ ...filters, statuses: next });
  }

  const selectClass =
    "rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 capitalize";

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <select
        value={filters.category}
        onChange={(e) => onChange({ ...filters, category: e.target.value as Filters["category"] })}
        className={selectClass}
        aria-label="Filter by category"
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c === "all" ? "All categories" : c}
          </option>
        ))}
      </select>

      <select
        value={filters.priority}
        onChange={(e) => onChange({ ...filters, priority: e.target.value as Filters["priority"] })}
        className={selectClass}
        aria-label="Filter by priority"
      >
        {PRIORITIES.map((p) => (
          <option key={p} value={p}>
            {p === "all" ? "All priorities" : p}
          </option>
        ))}
      </select>

      <div className="flex gap-1">
        {STATUSES.map(({ value, label }) => {
          const active = filters.statuses.includes(value);
          return (
            <button
              key={value}
              onClick={() => toggleStatus(value)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                active
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-slate-300 bg-white text-slate-500 hover:border-slate-400"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
