"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Project, ProjectStatus } from "@/types";

interface FailedSubmission {
  id: string;
  rawText: string;
}

interface Props {
  project: Project;
  failedSubmissions: FailedSubmission[];
}

export default function ProjectSettingsForm({ project, failedSubmissions }: Props) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [clientName, setClientName] = useState(project.clientName);
  const [targetUrl, setTargetUrl] = useState(project.targetUrl);
  const [status, setStatus] = useState<ProjectStatus>(project.status);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [reparsing, setReparsing] = useState<string | null>(null);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, clientName, targetUrl, status }),
      });
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setMessage({ kind: "error", text: body?.error ?? "Failed to save changes." });
        return;
      }
      setMessage({ kind: "ok", text: "Saved." });
      router.refresh();
    } catch {
      setMessage({ kind: "error", text: "Your connection timed out, please try again." });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (
      !window.confirm(
        "Delete this project? All client feedback and checklist items will be permanently removed."
      )
    )
      return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
      if (!res.ok) {
        setMessage({ kind: "error", text: "Failed to delete project." });
        setDeleting(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setMessage({ kind: "error", text: "Your connection timed out, please try again." });
      setDeleting(false);
    }
  }

  async function handleReparse(submissionId: string) {
    setReparsing(submissionId);
    setMessage(null);
    try {
      const res = await fetch("/api/parse-feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ submissionId }),
      });
      if (!res.ok) {
        setMessage({ kind: "error", text: "Re-parse failed — try again shortly." });
        return;
      }
      setMessage({ kind: "ok", text: "Submission parsed — check the Checklist tab." });
      router.refresh();
    } finally {
      setReparsing(null);
    }
  }

  const inputClass =
    "w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSave}
        className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      >
        <h2 className="font-semibold text-slate-900">Project details</h2>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Project name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Client name</label>
          <input value={clientName} onChange={(e) => setClientName(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Target URL</label>
          <input type="url" value={targetUrl} onChange={(e) => setTargetUrl(e.target.value)} required className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className={inputClass}
          >
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived (feedback link disabled)</option>
          </select>
        </div>

        {message && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              message.kind === "ok"
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      {failedSubmissions.length > 0 && (
        <div className="rounded-2xl border border-yellow-200 bg-yellow-50 p-6">
          <h2 className="mb-3 font-semibold text-yellow-900">Submissions that failed to parse</h2>
          <div className="space-y-3">
            {failedSubmissions.map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-3 rounded-lg bg-white p-3">
                <p className="line-clamp-2 flex-1 text-sm text-slate-600">{s.rawText}</p>
                <button
                  onClick={() => handleReparse(s.id)}
                  disabled={reparsing === s.id}
                  className="shrink-0 rounded-lg border border-yellow-300 bg-yellow-100 px-3 py-1.5 text-xs font-semibold text-yellow-800 hover:bg-yellow-200 disabled:opacity-50"
                >
                  {reparsing === s.id ? "Parsing…" : "Retry parsing"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-red-200 bg-white p-6">
        <h2 className="mb-1 font-semibold text-red-700">Danger zone</h2>
        <p className="mb-4 text-sm text-slate-500">
          Deleting a project permanently removes all submissions and checklist items.
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg border border-red-300 px-5 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
        >
          {deleting ? "Deleting…" : "Delete project"}
        </button>
      </div>
    </div>
  );
}
