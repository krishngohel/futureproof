// Public layout — no auth, no dashboard nav. Mobile-first.
export default function FeedbackLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-2xl px-4 py-4">
          <span className="font-bold tracking-tight text-slate-900">📥 Revision Inbox</span>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">{children}</main>
      <footer className="mx-auto max-w-2xl px-4 pb-8 text-center text-xs text-slate-400">
        Powered by Revision Inbox — feedback that turns into checklists.
      </footer>
    </div>
  );
}
