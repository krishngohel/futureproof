import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { itemStatusSchema } from "@/lib/validators/feedback";
import { toFeedbackItem } from "@/types";
import type { FeedbackItemRow } from "@/lib/supabase/types";

type Params = { params: { id: string } };

async function getOwnedItem(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, item: null };

  // RLS restricts to owned projects; maybeSingle gives us a clean 404.
  const { data } = await supabase
    .from("feedback_items")
    .select("*")
    .eq("id", id)
    .maybeSingle<FeedbackItemRow>();

  return { supabase, user, item: data ?? null };
}

/** PATCH /api/feedback-items/[id] — body: { status: 'open'|'in_progress'|'done' } */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { supabase, user, item } = await getOwnedItem(params.id);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = itemStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "status must be open, in_progress, or done" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("feedback_items")
    .update({
      status: parsed.data.status,
      marked_done_at: parsed.data.status === "done" ? new Date().toISOString() : null,
    })
    .eq("id", params.id)
    .select("*")
    .single<FeedbackItemRow>();

  if (error || !data) {
    console.error("[api/feedback-items/:id] update failed", error);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }

  return NextResponse.json(toFeedbackItem(data));
}

/** DELETE /api/feedback-items/[id] */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { supabase, user, item } = await getOwnedItem(params.id);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!item) return NextResponse.json({ error: "Item not found" }, { status: 404 });

  const { error } = await supabase.from("feedback_items").delete().eq("id", params.id);
  if (error) {
    console.error("[api/feedback-items/:id] delete failed", error);
    return NextResponse.json({ error: "Failed to delete item" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
