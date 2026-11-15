export function Spinner({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-block h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-indigo-600 align-middle ${className}`}
      role="status"
      aria-label="Loading"
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-3 h-4 w-2/3 rounded bg-slate-200" />
      <div className="mb-2 h-3 w-1/2 rounded bg-slate-100" />
      <div className="h-3 w-1/3 rounded bg-slate-100" />
    </div>
  );
}
