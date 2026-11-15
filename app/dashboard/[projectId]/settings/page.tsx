import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import ProjectSettingsForm from "@/components/dashboard/ProjectSettingsForm";
import { toProject } from "@/types";
import type { ProjectRow, FeedbackSubmissionRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function ProjectSettingsPage({
  params,
}: {
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

  const { data: failed } = await supabase
    .from("feedback_submissions")
    .select("id, raw_text")
    .eq("project_id", params.projectId)
    .eq("parse_status", "failed")
    .order("submitted_at", { ascending: false });

  return (
    <ProjectSettingsForm
      project={toProject(project)}
      failedSubmissions={(
        (failed ?? []) as Pick<FeedbackSubmissionRow, "id" | "raw_text">[]
      ).map((s) => ({ id: s.id, rawText: s.raw_text }))}
    />
  );
}
