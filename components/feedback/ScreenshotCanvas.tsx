"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState } from "react";
import type { Annotation } from "@/lib/supabase/types";

interface Props {
  previewUrl: string;
  annotations: Annotation[];
  onChange: (annotations: Annotation[]) => void;
}

/**
 * Click-to-annotate screenshot UI. Clicking the image drops a numbered pin
 * (coordinates stored as percentages) and opens a small note input.
 */
export default function ScreenshotCanvas({ previewUrl, annotations, onChange }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  function handleImageClick(e: React.MouseEvent) {
    if (annotations.length >= 20 || editingIndex !== null) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));

    const next = [...annotations, { x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10, note: "" }];
    onChange(next);
    setEditingIndex(next.length - 1);
    setNoteDraft("");
  }

  function saveNote() {
    if (editingIndex === null) return;
    const next = annotations.map((a, i) =>
      i === editingIndex ? { ...a, note: noteDraft.trim().slice(0, 500) } : a
    );
    onChange(next);
    setEditingIndex(null);
    setNoteDraft("");
  }

  function removePin(index: number) {
    onChange(annotations.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-500">
        Click anywhere on the screenshot to pin a note (e.g. “make this button bigger”).
      </p>

      <div
        ref={containerRef}
        onClick={handleImageClick}
        className="relative inline-block max-w-full cursor-crosshair overflow-hidden rounded-lg border border-slate-300"
      >
        <img src={previewUrl} alt="Screenshot preview" className="block max-w-full select-none" draggable={false} />
        {annotations.map((pin, i) => (
          <button
            key={i}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditingIndex(i);
              setNoteDraft(pin.note);
            }}
            className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-xs font-bold text-white shadow hover:bg-indigo-700"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            title={pin.note || "Click to add a note"}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {editingIndex !== null && (
        <div className="flex gap-2">
          <input
            autoFocus
            value={noteDraft}
            onChange={(e) => setNoteDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                saveNote();
              }
            }}
            maxLength={500}
            placeholder={`Note for pin ${editingIndex + 1}…`}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={saveNote}
            className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => removePin(editingIndex)}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
          >
            Remove
          </button>
        </div>
      )}

      {annotations.length > 0 && editingIndex === null && (
        <ul className="space-y-1 text-sm text-slate-600">
          {annotations.map((pin, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              <span className="flex-1 truncate">
                {pin.note || <span className="italic text-slate-400">No note yet — click the pin</span>}
              </span>
              <button
                type="button"
                onClick={() => removePin(i)}
                className="text-slate-300 hover:text-red-500"
                aria-label={`Remove pin ${i + 1}`}
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
