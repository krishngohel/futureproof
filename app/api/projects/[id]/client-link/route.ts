import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { createClient } from "@/lib/supabase/server";
import type { ClientLinkRow } from "@/lib/supabase/types";

type Params = { params: { id: string } };

/**
 * GET /api/projects/[id]/client-link
 * Returns the project's public feedback token, creating one on first request.
 */
export async function GET(_req: NextRequest, { params }: Params) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { data: existing } = await supabase
    .from("client_links")
    .select("token")
    .eq("project_id", params.id)
    .maybeSingle<Pick<ClientLinkRow, "token">>();

  let token = existing?.token;

  if (!token) {
    token = randomBytes(16).toString("hex"); // 32-char unguessable hex
    const { error } = await supabase
      .from("client_links")
      .insert({ project_id: params.id, token });

    if (error) {
      console.error("[api/client-link] insert failed", error);
      return NextResponse.json({ error: "Failed to create link" }, { status: 500 });
    }
  }

  const base = process.env.NEXT_PUBLIC_APP_URL ?? "";
  return NextResponse.json({ token, publicUrl: `${base}/feedback/${token}` });
}
