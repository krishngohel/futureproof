import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createProjectSchema } from "@/lib/validators/feedback";
import { canCreateProject } from "@/lib/pricing";
import { toProject } from "@/types";
import type { ProjectRow, ProfileRow } from "@/lib/supabase/types";

/** GET /api/projects — list the signed-in freelancer's projects */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[api/projects] list failed", error);
    return NextResponse.json({ error: "Failed to load projects" }, { status: 500 });
  }

  return NextResponse.json({ projects: (data as ProjectRow[]).map(toProject) });
}

/** POST /api/projects — create a project (free tier: max 1 active) */
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

  const parsed = createProjectSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Validation failed" },
      { status: 400 }
    );
  }

  // Free-tier limit check
  const [{ data: profile }, { count }] = await Promise.all([
    supabase
      .from("profiles")
      .select("subscription_tier")
      .eq("id", user.id)
      .single<Pick<ProfileRow, "subscription_tier">>(),
    supabase
      .from("projects")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "active"),
  ]);

  const tier = profile?.subscription_tier ?? "free";
  if (!canCreateProject(tier, count ?? 0)) {
    return NextResponse.json(
      {
        error: "Free plan includes 1 active project. Upgrade to Solo for unlimited projects.",
        code: "upgrade_required",
      },
      { status: 402 }
    );
  }

  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: user.id,
      name: parsed.data.name,
      client_name: parsed.data.clientName,
      target_url: parsed.data.targetUrl,
    })
    .select("*")
    .single<ProjectRow>();

  if (error || !data) {
    console.error("[api/projects] insert failed", error);
    return NextResponse.json({ error: "Failed to create project" }, { status: 500 });
  }

  return NextResponse.json(toProject(data), { status: 201 });
}
