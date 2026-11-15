"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ScreenshotCanvas from "@/components/feedback/ScreenshotCanvas";
import { MAX_SCREENSHOT_BYTES, ALLOWED_SCREENSHOT_TYPES } from "@/lib/validators/feedback";
import type { Annotation } from "@/lib/supabase/types";

export default function SubmissionForm({ token }: { token: string }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError("");
    const selected = e.target.files?.[0] ?? null;

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setAnnotations([]);

    if (!selected) {
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (!ALLOWED_SCREENSHOT_TYPES.includes(selected.type)) {
      setError("Screenshot must be a JPG or PNG image.");
      e.target.value = "";
      setFile(null);
      setPreviewUrl(null);
      return;
    }
    if (selected.size > MAX_SCREENSHOT_BYTES) {
      setError("Screenshot is too large — max 5 MB. Try a smaller file.");
      e.target.value = "";
      setFile(null);
      setPreviewUrl(null);
      return;
    }

    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (text.trim().length < 10) {
      setError("Please describe the change in at least 10 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const form = new FormData();
      form.set("token", token);
      form.set("raw_text", text.trim());
      if (file) {
        form.set("screenshot", file);
        if (annotations.length > 0) form.set("annotations", JSON.stringify(annotations));
      }

      const res = await fetch("/api/submissions", { method: "POST", body: form });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Something went wrong, please try again.");
        return;
      }

      const result = (await res.json()) as { itemsCreated: number; status: string };
      setSuccess(
        result.itemsCreated > 0
          ? `Thanks! Your feedback was received and broken into ${result.itemsCreated} item${result.itemsCreated === 1 ? "" : "s"} — see the status list below.`
          : "Thanks! Your feedback was received and is being processed."
      );
      setText("");
      setFile(null);
      setAnnotations([]);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      router.refresh();
    } catch {
      setError("Your connection timed out, please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6"
    >
      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          What would you like changed?
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={5}
          maxLength={10_000}
          placeholder="Describe what you'd like changed. Be as specific as you can."
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-900 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">
          Upload a screenshot <span className="font-normal text-slate-400">(optional, JPG/PNG, max 5 MB)</span>
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-500 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
        />
      </div>

      {previewUrl && (
        <ScreenshotCanvas
          previewUrl={previewUrl}
          annotations={annotations}
          onChange={setAnnotations}
        />
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
      >
        {submitting ? "Sending…" : "Send Feedback"}
      </button>
    </form>
  );
}
