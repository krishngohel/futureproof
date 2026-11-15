"use client";

/* eslint-disable @next/next/no-img-element */
import type { Annotation } from "@/lib/supabase/types";

interface Props {
  screenshotUrl: string;
  annotations: Annotation[] | null;
}

/** Read-only screenshot with numbered pin annotations. */
export default function AnnotationViewer({ screenshotUrl, annotations }: Props) {
  const pins = annotations ?? [];

  return (
    <div>
      <div className="relative inline-block max-w-full overflow-hidden rounded-lg border border-slate-200">
        <img src={screenshotUrl} alt="Client screenshot" className="block max-w-full" />
        {pins.map((pin, i) => (
          <div
            key={i}
            className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-indigo-600 text-xs font-bold text-white shadow"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            title={pin.note}
          >
            {i + 1}
          </div>
        ))}
      </div>
      {pins.length > 0 && (
        <ol className="mt-2 space-y-1 text-sm text-slate-600">
          {pins.map((pin, i) => (
            <li key={i}>
              <span className="mr-1.5 inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white">
                {i + 1}
              </span>
              {pin.note || <span className="italic text-slate-400">No note</span>}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
