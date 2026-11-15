import type { FeedbackItem, FeedbackItemStatus } from "@/types";

const STATUS_META: { status: FeedbackItemStatus; label: string; dot: string }[] = [
  { status: "open", label: "New", dot: "bg-slate-300" },
  { status: "in_progress", label: "In Progress", dot: "bg-yellow-400" },
  { status: "done", label: "Done", dot: "bg-green-500" },
];

const CATEGORY_STYLES: Record<FeedbackItem["category"], string> = {
  copy: "bg-blue-50 text-blue-700 border-blue-200",
  layout: "bg-purple-50 text-purple-700 border-purple-200",
  color: "bg-orange-50 text-orange-700 border-orange-200",
  bug: "bg-red-50 text-red-700 border-red-200",
  other: "bg-slate-100 text-slate-600 border-slate-200",
};

const PRIORITY_LABEL: Record<FeedbackItem["priority"], { text: string; className: string }> = {
  urgent: { text: "URGENT", className: "text-red-600 font-bold" },
  normal: { text: "Normal", className: "text-slate-500" },
  low: { text: "Low", className: "text-slate-400" },
};

/** Read-only checklist shown to the client on the public feedback page. */
export default function StatusView({ items }: { items: FeedbackItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
        No feedback items yet. Submit some feedback above.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {STATUS_META.map(({ status, label, dot }) => {
        const group = items.filter((i) => i.status === status);
        if (group.length === 0) return null;
        return (
          <section key={status}>
            <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-700">
              <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
              {label} ({group.length})
            </h3>
            <ul className="space-y-2">
              {group.map((item) => (
                <li
                  key={item.id}
                  className={`rounded-lg border border-slate-200 bg-white p-3 ${
                    status === "done" ? "opacity-70" : ""
                  }`}
                >
                  <div className="mb-1 flex flex-wrap items-center gap-2 text-xs">
                    <span
                      className={`rounded-full border px-2 py-0.5 font-medium capitalize ${CATEGORY_STYLES[item.category]}`}
                    >
                      {item.category}
                    </span>
                    <span className={PRIORITY_LABEL[item.priority].className}>
                      {PRIORITY_LABEL[item.priority].text}
                    </span>
                    <span className="text-slate-400">({item.section})</span>
                  </div>
                  <p className={`text-sm text-slate-800 ${status === "done" ? "line-through" : ""}`}>
                    {item.summary}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
