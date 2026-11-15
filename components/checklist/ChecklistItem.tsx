"use client";

import { useState } from "react";
import { timeAgo } from "@/lib/time";
import AnnotationViewer from "@/components/feedback/AnnotationViewer";
import type { FeedbackItem, FeedbackItemStatus, Annotation } from "@/types";

export const CATEGORY_STYLES: Record<FeedbackItem["category"], string> = {
  copy: "bg-blue-50 text-blue-700 border-blue-200",
  layout: "bg-purple-50 text-purple-700 border-purple-200",
  color: "bg-orange-50 text-orange-700 border-orange-200",
  bug: "bg-red-50 text-red-700 border-red-200",
  other: "bg-slate-100 text-slate-600 border-slate-200",
};

export const PRIORITY_STYLES: Record<FeedbackItem["priority"], string> = {
  urgent: "text-red-600 font-bold",
  normal: "text-slate-900",
  low: "text-slate-400",
};

const NEXT_STATUS: Record<FeedbackItemStatus, FeedbackItemStatus> = {
  open: "in_progress",
  in_progress: "done",
  done: "open",
};

const STATUS_DOT: Record<FeedbackItemStatus, string> = {
  open: "bg-slate-300",
  in_progress: "bg-yellow-400",
  done: "bg-green-500",
};

export interface SubmissionMeta {
  screenshotUrl: string | null;
  annotations: Annotation[] | null;
}

interface Props {
  item: FeedbackItem;
  submission?: SubmissionMeta;
  onStatusChange: (id: string, status: FeedbackItemStatus) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function ChecklistItem({ item, submission, onStatusChange, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [busy, setBusy] = useState(false);

  async function cycleStatus() {
    if (busy) return;
    setBusy(true);
    try {
      await onStatusChange(item.id, NEXT_STATUS[item.status]);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!window.confirm("Delete this feedback item?")) return;
    setBusy(true);
    try {
      await onDelete(item.id);
    } finally {
      setBusy(false);
    }
  }

  const hasDetail = Boolean(item.rawFeedback || submission?.screenshotUrl);

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-opacity ${
        item.status === "done" ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={cycleStatus}
          disabled={busy}
          title={`Status: ${item.status.replace("_", " ")} — click to change`}
          className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 transition-colors hover:border-indigo-400 disabled:opacity-50"
          aria-label={`Change status (currently ${item.status.replace("_", " ")})`}
        >
          <span className={`h-3.5 w-3.5 rounded-full ${STATUS_DOT[item.status]}`} />
        </button>

        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${CATEGORY_STYLES[item.category]}`}
            >
              {item.category}
            </span>
            <span className={`text-xs uppercase tracking-wide ${PRIORITY_STYLES[item.priority]}`}>
              {item.priority === "urgent" ? "URGENT" : item.priority}
            </span>
            <span className="text-xs text-slate-400">({item.section})</span>
          </div>

          <p
            className={`text-sm text-slate-900 ${item.status === "done" ? "line-through" : ""}`}
          >
            {item.summary}
          </p>

          <div className="mt-1.5 flex items-center gap-3 text-xs text-slate-400">
            <span>{timeAgo(item.createdAt)}</span>
            {hasDetail && (
              <button
                onClick={() => setExpanded((v) => !v)}
                className="font-medium text-indigo-500 hover:text-indigo-700"
              >
                {expanded ? "Hide original feedback" : "Show original feedback"}
              </button>
            )}
          </div>

          {expanded && (
            <div className="mt-3 space-y-3 rounded-lg bg-slate-50 p-3">
              {item.rawFeedback && (
                <blockquote className="border-l-2 border-slate-300 pl-3 text-sm italic text-slate-600">
                  “{item.rawFeedback}”
                </blockquote>
              )}
              {submission?.screenshotUrl && (
                <AnnotationViewer
                  screenshotUrl={submission.screenshotUrl}
                  annotations={submission.annotations}
                />
              )}
            </div>
          )}
        </div>

        <button
          onClick={handleDelete}
          disabled={busy}
          className="shrink-0 p-1 text-slate-300 transition-colors hover:text-red-500 disabled:opacity-50"
          title="Delete item"
          aria-label="Delete item"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
