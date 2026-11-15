"use client";

import { useState } from "react";

/**
 * Fetches (and lazily creates) the project's public feedback link,
 * then copies it to the clipboard.
 */
export default function CopyLinkButton({ projectId }: { projectId: string }) {
  const [state, setState] = useState<"idle" | "loading" | "copied" | "error">("idle");

  async function handleCopy() {
    setState("loading");
    try {
      const res = await fetch(`/api/projects/${projectId}/client-link`);
      if (!res.ok) throw new Error("Failed to get link");
      const { publicUrl } = (await res.json()) as { publicUrl: string };
      const absolute = publicUrl.startsWith("http")
        ? publicUrl
        : `${window.location.origin}${publicUrl}`;
      await navigator.clipboard.writeText(absolute);
      setState("copied");
      setTimeout(() => setState("idle"), 2000);
    } catch {
      setState("error");
      setTimeout(() => setState("idle"), 2500);
    }
  }

  return (
    <button
      onClick={handleCopy}
      disabled={state === "loading"}
      className="inline-flex items-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2 text-sm font-semibold text-indigo-700 transition-colors hover:bg-indigo-100 disabled:opacity-50"
    >
      {state === "copied"
        ? "✓ Link copied!"
        : state === "error"
        ? "Couldn't copy — try again"
        : state === "loading"
        ? "Getting link…"
        : "Copy feedback link"}
    </button>
  );
}
