import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { parseAndStoreSubmission } from "@/lib/ai/parse-feedback";
import { parseRequestSchema } from "@/lib/validators/feedback";

export const maxDuration = 60;

/**
 * POST /api/parse-feedback — body: { submissionId }
 * Re-runs AI parsing for a submission (e.g. after a failed parse).
 * Auth required: the caller must own the submission's project.
 * (First-pass parsing happens inline in /api/submissions.)
 */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = parseRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "submissionId (uuid) is required" }, { status: 400 });
  }

  // Ownership check via RLS-scoped read.
  const { data: submission } = await supabase
    .from("feedback_submissions")
    .select("id")
    .eq("id", parsed.data.submissionId)
    .maybeSingle();

  if (!submission) {
    return NextResponse.json({ error: "Submission not found" }, { status: 404 });
  }

  try {
    const result = await parseAndStoreSubmission(
      parsed.data.submissionId,
      createServiceClient()
    );
    return NextResponse.json({ itemsCreated: result.itemsCreated });
  } catch (err) {
    console.error("[api/parse-feedback] re-parse failed", err);
    return NextResponse.json(
      { error: "Parsing failed. The submission is saved — try again shortly." },
      { status: 502 }
    );
  }
}
