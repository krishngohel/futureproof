import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { moduleId, completed, quizScore } = await req.json();

  if (!moduleId) {
    return NextResponse.json({ error: "moduleId required" }, { status: 400 });
  }

  const { error } = await supabase.from("module_progress").upsert(
    {
      user_id: user.id,
      module_id: moduleId,
      completed: completed ?? false,
      quiz_score: quizScore ?? null,
      completed_at: completed ? new Date().toISOString() : null,
    },
    { onConflict: "user_id,module_id" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
