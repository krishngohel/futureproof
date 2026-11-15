"use client";

import { useState } from "react";

export default function NotificationsToggle({ initialEnabled }: { initialEnabled: boolean }) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [error, setError] = useState("");

  async function toggle() {
    const next = !enabled;
    setEnabled(next); // optimistic
    setError("");

    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ emailNotificationsEnabled: next }),
    });

    if (!res.ok) {
      setEnabled(!next);
      setError("Couldn't save — please try again.");
    }
  }

  return (
    <div>
      <label className="flex cursor-pointer items-center gap-3">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={toggle}
          className={`relative h-6 w-11 rounded-full transition-colors ${
            enabled ? "bg-indigo-600" : "bg-slate-300"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
              enabled ? "left-[22px]" : "left-0.5"
            }`}
          />
        </button>
        <span className="text-sm text-slate-700">
          Email me when a client submits new feedback
        </span>
      </label>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
