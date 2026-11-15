"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import ChecklistItem, { type SubmissionMeta } from "@/components/checklist/ChecklistItem";
import FilterBar, { type Filters } from "@/components/checklist/FilterBar";
import type { FeedbackItem, FeedbackItemStatus } from "@/types";

interface Props {
  initialItems: FeedbackItem[];
  submissions: Record<string, SubmissionMeta>;
}

const PRIORITY_RANK = { urgent: 0, normal: 1, low: 2 } as const;

export default function ChecklistView({ initialItems, submissions }: Props) {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<Filters>({
    category: "all",
    priority: "all",
    statuses: ["open", "in_progress"],
  });

  const visible = useMemo(() => {
    return items
      .filter((i) => filters.category === "all" || i.category === filters.category)
      .filter((i) => filters.priority === "all" || i.priority === filters.priority)
      .filter((i) => filters.statuses.length === 0 || filters.statuses.includes(i.status))
      .sort(
        (a, b) =>
          PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority] ||
          +new Date(b.createdAt) - +new Date(a.createdAt)
      );
  }, [items, filters]);

  async function handleStatusChange(id: string, status: FeedbackItemStatus) {
    setError("");
    const previous = items;
    // Optimistic update
    setItems((cur) => cur.map((i) => (i.id === id ? { ...i, status } : i)));

    const res = await fetch(`/api/feedback-items/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status }),
    });

    if (!res.ok) {
      setItems(previous);
      setError("Couldn't update the item — please try again.");
      return;
    }
    router.refresh();
  }

  async function handleDelete(id: string) {
    setError("");
    const previous = items;
    setItems((cur) => cur.filter((i) => i.id !== id));

    const res = await fetch(`/api/feedback-items/${id}`, { method: "DELETE" });
    if (!res.ok) {
      setItems(previous);
      setError("Couldn't delete the item — please try again.");
      return;
    }
    router.refresh();
  }

  const doneCount = items.filter((i) => i.status === "done").length;

  return (
    <div>
      <FilterBar filters={filters} onChange={setFilters} />

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-14 text-center">
          <div className="mb-3 text-3xl">💬</div>
          <h3 className="mb-1 font-semibold text-slate-900">No feedback yet</h3>
          <p className="text-sm text-slate-500">
            Copy the feedback link above and send it to your client. Their feedback
            will show up here as a checklist.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-sm text-slate-500">
          No items match the current filters.
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((item) => (
            <ChecklistItem
              key={item.id}
              item={item}
              submission={item.submissionId ? submissions[item.submissionId] : undefined}
              onStatusChange={handleStatusChange}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {items.length > 0 && (
        <p className="mt-6 text-center text-xs text-slate-400">
          {doneCount} of {items.length} item{items.length === 1 ? "" : "s"} done
        </p>
      )}
    </div>
  );
}
