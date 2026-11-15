"use client";

import { TIERS } from "@/lib/pricing";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function PaywallModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-xl font-bold text-slate-900">
          Upgrade to Solo for unlimited projects
        </h2>
        <p className="mb-6 text-sm text-slate-600">
          The Free plan includes 1 active project. Solo unlocks unlimited active
          projects for ${TIERS.solo.price}/month.
        </p>
        <ul className="mb-6 space-y-2 text-sm text-slate-700">
          <li>✓ Unlimited active projects</li>
          <li>✓ AI feedback parsing on every submission</li>
          <li>✓ Email notifications when clients send feedback</li>
        </ul>
        <div className="flex gap-3">
          <a
            href="/api/billing/checkout"
            className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
          >
            Upgrade — ${TIERS.solo.price}/mo
          </a>
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            Not now
          </button>
        </div>
      </div>
    </div>
  );
}
