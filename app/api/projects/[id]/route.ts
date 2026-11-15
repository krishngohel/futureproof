import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { updateProjectSchema } from "@/lib/validators/feedback";
import { toProject } from "@/types";
import type { ProjectRow } from "@/lib/supabase/types";

type Params = { params: { id: string } };

async function getOwnedProject(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, project: null };

  // RLS also scopes this, but filter explicitly for a clean 404.
  const { data } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle<ProjectRow>();

  return { supabase, user, project: data ?? null };
}

/** GET /api/projects/[id] */
export async function GET(_req: NextRequest, { params }: Params) {
  const { user, project } = await getOwnedProject(params.id);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  return NextResponse.json(toProject(project));
}

/** PATCH /api/projects/[id] — update provided fields only */
export async function PATCH(req: NextRequest, { params }: Params) {
  const { supabase, user, project } = await getOwnedProject(params.id);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = updateProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  const updates: Record<string, string> = {};
  if (parsed.data.name !== undefined) updates.name = parsed.data.name;
  if (parsed.data.clientName !== undefined) updates.client_name = parsed.data.clientName;
  if (parsed.data.targetUrl !== undefined) updates.target_url = parsed.data.targetUrl;
  if (parsed.data.status !== undefined) updates.status = parsed.data.status;

  const { data, error } = await supabase
    .from("projects")
    .update(updates)
    .eq("id", params.id)
    .select("*")
    .single<ProjectRow>();

  if (error || !data) {
    console.error("[api/projects/:id] update failed", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }

  return NextResponse.json(toProject(data));
}

/** DELETE /api/projects/[id] — cascades to submissions + items via FK */
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { supabase, user, project } = await getOwnedProject(params.id);
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  const { error } = await supabase.from("projects").delete().eq("id", params.id);
  if (error) {
    console.error("[api/projects/:id] delete failed", error);
    return NextResponse.json({ error: "Failed to delete project" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
