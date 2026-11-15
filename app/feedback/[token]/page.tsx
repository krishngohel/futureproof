import { createServiceClient } from "@/lib/supabase/service";
import SubmissionForm from "@/components/feedback/SubmissionForm";
import StatusView from "@/components/feedback/StatusView";
import { toFeedbackItem } from "@/types";
import type {
  ClientLinkRow,
  ProjectRow,
  FeedbackItemRow,
} from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

function InvalidLink() {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center">
      <div className="mb-3 text-3xl">🔗</div>
      <h1 className="mb-1 text-lg font-bold text-slate-900">
        This feedback link is invalid or expired
      </h1>
      <p className="text-sm text-slate-500">
        Double-check the link, or ask the person who sent it for a new one.
      </p>
    </div>
  );
}

/**
 * Public client feedback page — no auth. Same URL handles submission (top)
 * and read-only status view (bottom). Server-rendered with the service-role
 * client since visitors have no session; only safe fields are exposed.
 */
export default async function PublicFeedbackPage({
  params,
}: {
  params: { token: string };
}) {
  const supabase = createServiceClient();

  const { data: link } = await supabase
    .from("client_links")
    .select("project_id")
    .eq("token", params.token)
    .maybeSingle<Pick<ClientLinkRow, "project_id">>();

  if (!link) return <InvalidLink />;

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, client_name, target_url, status")
    .eq("id", link.project_id)
    .maybeSingle<Pick<ProjectRow, "id" | "name" | "client_name" | "target_url" | "status">>();

  if (!project || project.status === "archived") return <InvalidLink />;

  const { data: itemRows } = await supabase
    .from("feedback_items")
    .select("*")
    .eq("project_id", project.id)
    .order("created_at", { ascending: false });

  const items = ((itemRows ?? []) as FeedbackItemRow[]).map(toFeedbackItem);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-xl font-bold text-slate-900">{project.name}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Hi {project.client_name} — leave your feedback on{" "}
          <a
            href={project.target_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:underline"
          >
            {project.target_url.replace(/^https?:\/\//, "")}
          </a>{" "}
          below. It gets turned into a checklist automatically.
        </p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Feedback Form
        </h2>
        <SubmissionForm token={params.token} />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Feedback Status
        </h2>
        <StatusView items={items} />
      </section>
    </div>
  );
}
