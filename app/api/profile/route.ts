import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const profileUpdateSchema = z.object({
  emailNotificationsEnabled: z.boolean(),
});

/** PATCH /api/profile — toggle email notifications */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "emailNotificationsEnabled (boolean) required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("profiles")
    .update({ email_notifications_enabled: parsed.data.emailNotificationsEnabled })
    .eq("id", user.id);

  if (error) {
    console.error("[api/profile] update failed", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
