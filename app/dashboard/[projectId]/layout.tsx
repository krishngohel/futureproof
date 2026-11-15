import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CopyLinkButton from "@/components/shared/CopyLinkButton";
import ProjectTabs from "@/components/dashboard/ProjectTabs";
import type { ProjectRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { projectId: string };
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("id", params.projectId)
    .eq("user_id", user!.id)
    .maybeSingle<ProjectRow>();

  if (!project) notFound();

  return (
    <div className="mx-auto max-w-4xl">
      <Link href="/dashboard" className="mb-4 inline-block text-sm text-slate-500 hover:text-slate-700">
        ← All projects
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold text-slate-900">{project.name}</h1>
          <p className="mt-1 text-sm text-slate-500">
            for {project.client_name} ·{" "}
            <a
              href={project.target_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline"
            >
              {project.target_url.replace(/^https?:\/\//, "")}
            </a>
          </p>
        </div>
        <CopyLinkButton projectId={project.id} />
      </div>

      <ProjectTabs projectId={project.id} />

      {children}
    </div>
  );
}
