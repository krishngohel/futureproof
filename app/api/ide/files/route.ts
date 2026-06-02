import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

interface FilePayload {
  name: string;
  path: string;
  content: string;
  language: string;
}

// PUT /api/ide/files — full sync: replace all files for a project
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { projectId, files } = await req.json() as {
    projectId: string;
    files: FilePayload[];
  };

  if (!projectId) {
    return NextResponse.json({ error: "projectId required" }, { status: 400 });
  }

  // Delete all existing files for this project, then insert the current set.
  // Plain text content — Postgres TOAST compresses large values automatically.
  const { error: deleteError } = await supabase
    .from("ide_files")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", user.id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  if (files.length === 0) {
    return NextResponse.json({ ok: true });
  }

  const rows = files.map((f) => ({
    project_id: projectId,
    user_id: user.id,
    name: f.name,
    path: f.path,
    content: f.content,
    language: f.language,
  }));

  const { error: insertError } = await supabase.from("ide_files").insert(rows);
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
