import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  FeedbackCategory,
  FeedbackPriority,
  FeedbackSubmissionRow,
  ProjectRow,
} from "@/lib/supabase/types";
import { annotationsSchema } from "@/lib/validators/feedback";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-haiku-4-5";

const CATEGORIES: FeedbackCategory[] = ["copy", "layout", "color", "bug", "other"];
const PRIORITIES: FeedbackPriority[] = ["urgent", "normal", "low"];

export interface ParsedItem {
  category: FeedbackCategory;
  section: string;
  priority: FeedbackPriority;
  summary: string;
  raw_feedback: string;
}

const SYSTEM_PROMPT = `You are a feedback parser for a freelance design/web project management tool. Your job is to take unstructured client feedback and parse it into actionable items.

Given raw client feedback, extract 1-5 specific, actionable items.
For each item, identify:
- category: one of [copy, layout, color, bug, other]
- section: the page or component mentioned (e.g., "header", "pricing page", "footer", "button"). If unclear, infer from context or use "general".
- priority: infer from language urgency:
  - "urgent": if client says "asap", "immediately", "IMPORTANT", "broken", "doesn't work", or expresses strong frustration
  - "normal": standard requests, most feedback
  - "low": "whenever you get a chance", "optional", "nice to have", "polish"
- summary: a one-line, imperative-mood description (e.g., "Change header background to dark blue" not "Header is too light")
- raw_feedback: the exact phrase from the client's text that generated this item

Output ONLY a valid JSON object, no markdown, no preamble:
{
  "items": [
    { "category": "...", "section": "...", "priority": "...", "summary": "...", "raw_feedback": "..." }
  ]
}`;

function buildUserPrompt(
  rawText: string,
  project: Pick<ProjectRow, "name" | "client_name" | "target_url">,
  annotations?: { note: string }[] | null
): string {
  const annotationNotes = (annotations ?? [])
    .map((a) => a.note)
    .filter(Boolean);

  return [
    rawText,
    annotationNotes.length
      ? `\nScreenshot pin notes from the client:\n${annotationNotes.map((n) => `- ${n}`).join("\n")}`
      : "",
    `\nProject: ${project.name}`,
    `Client: ${project.client_name}`,
    `Site: ${project.target_url}`,
    `\nParse the feedback above into structured items. If the feedback is vague or contradictory, make reasonable inferences.`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Extract the first JSON object from a model response (handles stray fences/preamble). */
function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/g, "").trim();
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("No JSON object found");
  return JSON.parse(cleaned.slice(start, end + 1));
}

function coerceItem(raw: unknown, fallbackRaw: string): ParsedItem | null {
  if (typeof raw !== "object" || raw === null) return null;
  const r = raw as Record<string, unknown>;
  const summary = typeof r.summary === "string" ? r.summary.trim().slice(0, 300) : "";
  if (!summary) return null;

  return {
    category: CATEGORIES.includes(r.category as FeedbackCategory)
      ? (r.category as FeedbackCategory)
      : "other",
    section:
      typeof r.section === "string" && r.section.trim()
        ? r.section.trim().slice(0, 100)
        : "general",
    priority: PRIORITIES.includes(r.priority as FeedbackPriority)
      ? (r.priority as FeedbackPriority)
      : "normal",
    summary,
    raw_feedback:
      typeof r.raw_feedback === "string" && r.raw_feedback.trim()
        ? r.raw_feedback.trim().slice(0, 2000)
        : fallbackRaw.slice(0, 2000),
  };
}

function fallbackItem(rawText: string): ParsedItem {
  return {
    category: "other",
    section: "general",
    priority: "normal",
    summary: rawText.trim().slice(0, 140) || "Review client feedback",
    raw_feedback: rawText.slice(0, 2000),
  };
}

/**
 * Call Claude Haiku to parse raw client feedback into 1–5 structured items.
 * Throws on API/network failure (caller marks submission 'failed').
 * Degrades to a single "other" item if the model returns unusable JSON.
 */
export async function parseFeedback(
  rawText: string,
  project: Pick<ProjectRow, "name" | "client_name" | "target_url">,
  annotations?: { note: string }[] | null
): Promise<ParsedItem[]> {
  const res = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1500,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: buildUserPrompt(rawText, project, annotations) }],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Anthropic API error ${res.status}: ${body.slice(0, 500)}`);
  }

  const data = (await res.json()) as {
    content?: { type: string; text?: string }[];
  };
  const text = data.content?.find((b) => b.type === "text")?.text ?? "";

  try {
    const parsed = extractJson(text) as { items?: unknown[] };
    const items = (parsed.items ?? [])
      .map((i) => coerceItem(i, rawText))
      .filter((i): i is ParsedItem => i !== null)
      .slice(0, 5);
    return items.length > 0 ? items : [fallbackItem(rawText)];
  } catch (err) {
    console.error("[parse-feedback] JSON parse failed, using fallback item.", {
      error: err,
      modelResponse: text.slice(0, 1000),
    });
    return [fallbackItem(rawText)];
  }
}

/**
 * Full orchestration: fetch submission + project, parse with Claude,
 * insert feedback_items, update parse_status. Uses the service-role client.
 * Replaces any items previously created for the submission (safe re-parse).
 */
export async function parseAndStoreSubmission(
  submissionId: string,
  supabase: SupabaseClient
): Promise<{ itemsCreated: number }> {
  const { data: submission, error: subErr } = await supabase
    .from("feedback_submissions")
    .select("*")
    .eq("id", submissionId)
    .single<FeedbackSubmissionRow>();

  if (subErr || !submission) throw new Error(`Submission not found: ${submissionId}`);

  const { data: project, error: projErr } = await supabase
    .from("projects")
    .select("id, name, client_name, target_url")
    .eq("id", submission.project_id)
    .single<Pick<ProjectRow, "id" | "name" | "client_name" | "target_url">>();

  if (projErr || !project) throw new Error(`Project not found for submission ${submissionId}`);

  const safeAnnotations = annotationsSchema.safeParse(submission.screenshot_annotations);

  let items: ParsedItem[];
  try {
    items = await parseFeedback(
      submission.raw_text,
      project,
      safeAnnotations.success ? safeAnnotations.data : null
    );
  } catch (err) {
    // API/network failure: keep the raw submission, mark failed for retry.
    console.error(`[parse-feedback] Claude call failed for submission ${submissionId}`, err);
    await supabase
      .from("feedback_submissions")
      .update({ parse_status: "failed" })
      .eq("id", submissionId);
    throw err;
  }

  // Idempotent re-parse: clear any items from a previous attempt.
  await supabase.from("feedback_items").delete().eq("submission_id", submissionId);

  const { error: insertErr } = await supabase.from("feedback_items").insert(
    items.map((item) => ({
      submission_id: submissionId,
      project_id: submission.project_id,
      category: item.category,
      section: item.section,
      priority: item.priority,
      summary: item.summary,
      raw_feedback: item.raw_feedback,
      status: "open",
    }))
  );

  if (insertErr) {
    console.error(`[parse-feedback] Failed to insert items for ${submissionId}`, insertErr);
    await supabase
      .from("feedback_submissions")
      .update({ parse_status: "failed" })
      .eq("id", submissionId);
    throw new Error(insertErr.message);
  }

  await supabase
    .from("feedback_submissions")
    .update({ parse_status: "parsed" })
    .eq("id", submissionId);

  return { itemsCreated: items.length };
}
