import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { createServiceClient } from "@/lib/supabase/service";
import { parseAndStoreSubmission } from "@/lib/ai/parse-feedback";
import { sendNewFeedbackEmail } from "@/lib/email";
import { isRateLimited } from "@/lib/rate-limit";
import {
  submissionFieldsSchema,
  annotationsSchema,
  MAX_SCREENSHOT_BYTES,
  ALLOWED_SCREENSHOT_TYPES,
} from "@/lib/validators/feedback";
import type {
  ClientLinkRow,
  ProjectRow,
  ProfileRow,
  FeedbackItemRow,
  Annotation,
} from "@/lib/supabase/types";

export const runtime = "nodejs";
export const maxDuration = 60; // AI parsing can take a few seconds

/**
 * POST /api/submissions — PUBLIC (no auth). Multipart form data:
 *   token       — client link token
 *   raw_text    — the feedback text (min 10 chars)
 *   screenshot  — optional jpg/png, max 5 MB
 *   annotations — optional JSON array [{x, y, note}] (percent coords)
 */
export async function POST(req: NextRequest) {
  // ── Rate limit: 10 submissions per IP per hour ────────────────────────────
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (isRateLimited(`submissions:${ip}`, { limit: 10, windowMs: 60 * 60 * 1000 })) {
    return NextResponse.json(
      { error: "Too many submissions. Please try again in an hour." },
      { status: 429 }
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data" }, { status: 400 });
  }

  const fields = submissionFieldsSchema.safeParse({
    token: form.get("token"),
    rawText: form.get("raw_text"),
  });
  if (!fields.success) {
    return NextResponse.json(
      { error: fields.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  // Annotations: sanitize, never trust client coordinates blindly.
  let annotations: Annotation[] | null = null;
  const rawAnnotations = form.get("annotations");
  if (typeof rawAnnotations === "string" && rawAnnotations.trim()) {
    try {
      const parsed = annotationsSchema.safeParse(JSON.parse(rawAnnotations));
      if (!parsed.success) {
        return NextResponse.json({ error: "Invalid annotations" }, { status: 400 });
      }
      annotations = parsed.data;
    } catch {
      return NextResponse.json({ error: "Invalid annotations JSON" }, { status: 400 });
    }
  }

  const screenshot = form.get("screenshot");
  if (screenshot instanceof File && screenshot.size > 0) {
    if (!ALLOWED_SCREENSHOT_TYPES.includes(screenshot.type)) {
      return NextResponse.json(
        { error: "Screenshot must be a JPG or PNG image" },
        { status: 400 }
      );
    }
    if (screenshot.size > MAX_SCREENSHOT_BYTES) {
      return NextResponse.json({ error: "Screenshot exceeds 5 MB" }, { status: 413 });
    }
  }

  // ── Resolve token → project (service role; public page has no session) ────
  const supabase = createServiceClient();

  const { data: link } = await supabase
    .from("client_links")
    .select("project_id")
    .eq("token", fields.data.token)
    .maybeSingle<Pick<ClientLinkRow, "project_id">>();

  if (!link) {
    return NextResponse.json({ error: "This feedback link is invalid" }, { status: 404 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id, user_id, name, status")
    .eq("id", link.project_id)
    .maybeSingle<Pick<ProjectRow, "id" | "user_id" | "name" | "status">>();

  if (!project || project.status === "archived") {
    return NextResponse.json({ error: "This feedback link is no longer active" }, { status: 404 });
  }

  // ── Upload screenshot (graceful: text still saved if upload fails) ────────
  let screenshotUrl: string | null = null;
  if (screenshot instanceof File && screenshot.size > 0) {
    try {
      const ext = screenshot.type === "image/png" ? "png" : "jpg";
      const path = `${project.id}/${randomUUID()}.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("feedback-screenshots")
        .upload(path, await screenshot.arrayBuffer(), { contentType: screenshot.type });

      if (uploadErr) {
        console.error("[api/submissions] screenshot upload failed", uploadErr);
      } else {
        screenshotUrl = supabase.storage.from("feedback-screenshots").getPublicUrl(path)
          .data.publicUrl;
      }
    } catch (err) {
      console.error("[api/submissions] screenshot upload threw", err);
    }
  }

  // ── Store the raw submission FIRST so nothing is ever lost ────────────────
  const { data: submission, error: insertErr } = await supabase
    .from("feedback_submissions")
    .insert({
      project_id: project.id,
      raw_text: fields.data.rawText,
      screenshot_url: screenshotUrl,
      screenshot_annotations: screenshotUrl ? annotations : null,
      client_ip: ip === "unknown" ? null : ip,
    })
    .select("id")
    .single<{ id: string }>();

  if (insertErr || !submission) {
    console.error("[api/submissions] insert failed", insertErr);
    return NextResponse.json({ error: "Failed to save feedback" }, { status: 500 });
  }

  // ── AI parsing (inline; on failure submission stays stored as 'failed') ───
  let itemsCreated = 0;
  let parseOk = true;
  try {
    const result = await parseAndStoreSubmission(submission.id, supabase);
    itemsCreated = result.itemsCreated;
  } catch (err) {
    parseOk = false;
    console.error(`[api/submissions] parsing failed for ${submission.id}`, err);
  }

  // ── Notify the freelancer (never blocks the response) ─────────────────────
  if (parseOk && itemsCreated > 0) {
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, email_notifications_enabled")
        .eq("id", project.user_id)
        .maybeSingle<Pick<ProfileRow, "email" | "email_notifications_enabled">>();

      if (profile?.email && profile.email_notifications_enabled) {
        const { data: items } = await supabase
          .from("feedback_items")
          .select("priority")
          .eq("submission_id", submission.id);

        const counts = { urgent: 0, normal: 0, low: 0 };
        (items as Pick<FeedbackItemRow, "priority">[] | null)?.forEach((i) => {
          counts[i.priority] += 1;
        });

        await sendNewFeedbackEmail({
          to: profile.email,
          projectName: project.name,
          projectId: project.id,
          counts,
        });
      }
    } catch (err) {
      console.error("[api/submissions] email notification failed", err);
    }
  }

  return NextResponse.json(
    {
      submissionId: submission.id,
      status: parseOk ? "parsed" : "processing",
      itemsCreated,
    },
    { status: 201 }
  );
}
