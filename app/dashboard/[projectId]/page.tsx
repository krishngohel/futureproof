import { createClient } from "@/lib/supabase/server";
import ChecklistView from "@/components/checklist/ChecklistView";
import type { SubmissionMeta } from "@/components/checklist/ChecklistItem";
import { toFeedbackItem } from "@/types";
import type { FeedbackItemRow, FeedbackSubmissionRow } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function ProjectChecklistPage({
  params,
}: {
  params: { projectId: string };
}) {
  const supabase = await createClient();

  // Ownership already verified in the layout; RLS enforces it here too.
  const [{ data: itemRows }, { data: submissionRows }] = await Promise.all([
    supabase
      .from("feedback_items")
      .select("*")
      .eq("project_id", params.projectId)
      .order("created_at", { ascending: false }),
    supabase
      .from("feedback_submissions")
      .select("id, screenshot_url, screenshot_annotations, parse_status")
      .eq("project_id", params.projectId),
  ]);

  const items = ((itemRows ?? []) as FeedbackItemRow[]).map(toFeedbackItem);

  const submissions: Record<string, SubmissionMeta> = {};
  (
    (submissionRows ?? []) as Pick<
      FeedbackSubmissionRow,
      "id" | "screenshot_url" | "screenshot_annotations" | "parse_status"
    >[]
  ).forEach((s) => {
    submissions[s.id] = {
      screenshotUrl: s.screenshot_url,
      annotations: s.screenshot_annotations,
    };
  });

  const failedCount = (
    (submissionRows ?? []) as Pick<FeedbackSubmissionRow, "parse_status">[]
  ).filter((s) => s.parse_status === "failed").length;

  return (
    <div>
      {failedCount > 0 && (
        <div className="mb-4 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm text-yellow-800">
          {failedCount} submission{failedCount === 1 ? "" : "s"} couldn&apos;t be parsed
          automatically. The raw feedback is saved — re-parsing is available from Settings.
        </div>
      )}
      <ChecklistView initialItems={items} submissions={submissions} />
    </div>
  );
}
