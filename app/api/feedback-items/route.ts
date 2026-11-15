import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { toFeedbackItem } from "@/types";
import type { FeedbackItemRow } from "@/lib/supabase/types";

/**
 * GET /api/feedback-items?projectId=… — freelancer only.
 * Ordered urgent-first, then newest.
 */
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const projectId = req.nextUrl.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json({ error: "projectId is required" }, { status: 400 });
  }

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", projectId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data, error } = await supabase
    .from("feedback_items")
    .select("*")
    .eq("project_id", projectId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[api/feedback-items] list failed", error);
    return NextResponse.json({ error: "Failed to load items" }, { status: 500 });
  }

  const priorityRank = { urgent: 0, normal: 1, low: 2 } as const;
  const items = (data as FeedbackItemRow[])
    .sort((a, b) => priorityRank[a.priority] - priorityRank[b.priority])
    .map(toFeedbackItem);

  return NextResponse.json({ items });
}
