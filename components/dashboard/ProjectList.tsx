import Link from "next/link";
import ProjectCard from "@/components/dashboard/ProjectCard";
import type { Project } from "@/types";

interface Props {
  projects: Project[];
  openCounts: Record<string, number>;
}

export default function ProjectList({ projects, openCounts }: Props) {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
        <div className="mb-3 text-3xl">📭</div>
        <h3 className="mb-1 font-semibold text-slate-900">No projects yet</h3>
        <p className="mb-6 text-sm text-slate-500">Create one to get started.</p>
        <Link
          href="/dashboard/new"
          className="inline-flex rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
        >
          Create your first project
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} openItemCount={openCounts[p.id] ?? 0} />
      ))}
    </div>
  );
}
