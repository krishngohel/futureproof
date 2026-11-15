import Link from "next/link";
import { timeAgo } from "@/lib/time";
import type { Project } from "@/types";

const STATUS_STYLES: Record<Project["status"], string> = {
  active: "bg-green-50 text-green-700 border-green-200",
  completed: "bg-blue-50 text-blue-700 border-blue-200",
  archived: "bg-slate-100 text-slate-500 border-slate-200",
};

interface Props {
  project: Project;
  openItemCount: number;
}

export default function ProjectCard({ project, openItemCount }: Props) {
  return (
    <Link
      href={`/dashboard/${project.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="truncate font-semibold text-slate-900">{project.name}</h3>
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium capitalize ${STATUS_STYLES[project.status]}`}
        >
          {project.status}
        </span>
      </div>
      <p className="mb-3 truncate text-sm text-slate-500">for {project.clientName}</p>
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>
          {openItemCount > 0 ? (
            <span className="font-semibold text-indigo-600">
              {openItemCount} open item{openItemCount === 1 ? "" : "s"}
            </span>
          ) : (
            "No open items"
          )}
        </span>
        <span>created {timeAgo(project.createdAt)}</span>
      </div>
    </Link>
  );
}
