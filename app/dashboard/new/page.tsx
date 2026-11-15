"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import PaywallModal from "@/components/shared/PaywallModal";

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [clientName, setClientName] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [paywallOpen, setPaywallOpen] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!name.trim() || !clientName.trim() || !targetUrl.trim()) {
      setError("All fields are required.");
      return;
    }
    try {
      new URL(targetUrl.trim());
    } catch {
      setError("Target URL must be a valid URL — include https://");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          clientName: clientName.trim(),
          targetUrl: targetUrl.trim(),
        }),
      });

      if (res.status === 402) {
        setPaywallOpen(true);
        return;
      }
      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as { error?: string } | null;
        setError(body?.error ?? "Something went wrong, please try again.");
        return;
      }

      const project = (await res.json()) as { id: string };
      router.push(`/dashboard/${project.id}`);
    } catch {
      setError("Your connection timed out, please try again.");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/dashboard" className="mb-6 inline-block text-sm text-slate-500 hover:text-slate-700">
        ← Back to projects
      </Link>
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Create New Project</h1>
      <p className="mb-8 text-sm text-slate-500">
        You&apos;ll get a public feedback link to send your client.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Project name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            maxLength={120}
            placeholder="Emma's Realtor Site"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Client name</label>
          <input
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            required
            maxLength={120}
            placeholder="Emma Johnson"
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">
            Target URL <span className="font-normal text-slate-400">(the site or preview your client reviews)</span>
          </label>
          <input
            type="url"
            value={targetUrl}
            onChange={(e) => setTargetUrl(e.target.value)}
            required
            placeholder="https://emma-realty.vercel.app"
            className={inputClass}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-indigo-600 py-3 font-semibold text-white transition-colors hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating…" : "Create"}
        </button>
      </form>

      <PaywallModal open={paywallOpen} onClose={() => setPaywallOpen(false)} />
    </div>
  );
}
