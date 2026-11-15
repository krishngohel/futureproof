import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import ProjectList from "@/components/dashboard/ProjectList";
import { toProject } from "@/types";
import type { ProjectRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: projectRows } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  const projects = ((projectRows ?? []) as ProjectRow[]).map(toProject);

  // Open item counts per project (RLS scopes to own projects).
  const openCounts: Record<string, number> = {};
  if (projects.length > 0) {
    const { data: items } = await supabase
      .from("feedback_items")
      .select("project_id")
      .eq("status", "open")
      .in("project_id", projects.map((p) => p.id));

    (items as { project_id: string }[] | null)?.forEach((i) => {
      openCounts[i.project_id] = (openCounts[i.project_id] ?? 0) + 1;
    });
  }

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Your Projects</h1>
          <p className="mt-1 text-sm text-slate-500">
            Each project gets a public link your client uses to send feedback.
          </p>
        </div>
        <Link
          href="/dashboard/new"
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          + New Project
        </Link>
      </div>

      <ProjectList projects={projects} openCounts={openCounts} />
    </div>
  );
}
