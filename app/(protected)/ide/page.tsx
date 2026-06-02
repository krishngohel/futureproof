import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { INITIAL_FILES } from "@/lib/ide/initial-files";
import IDEClient from "@/components/ide/ide-client";

// Full-screen IDE — opts out of the layout's constrained <main> container.
export default async function IDEPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Get or create the user's default project
  let { data: project } = await supabase
    .from("ide_projects")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!project) {
    const { data: created } = await supabase
      .from("ide_projects")
      .insert({ user_id: user.id, name: "My Project" })
      .select("id")
      .single();
    project = created;

    // Seed initial files for new accounts
    if (created) {
      await supabase.from("ide_files").insert(
        INITIAL_FILES.map((f) => ({
          project_id: created.id,
          user_id: user.id,
          name: f.name,
          path: f.path,
          content: f.content,
          language: f.language,
        }))
      );
    }
  }

  // Load saved files
  const { data: savedFiles } = project
    ? await supabase
        .from("ide_files")
        .select("name, path, content, language")
        .eq("project_id", project.id)
        .order("created_at", { ascending: true })
    : { data: null };

  return (
    <div className="fixed inset-0 top-[65px]" style={{ zIndex: 10 }}>
      <IDEClient
        userId={user.id}
        projectId={project?.id ?? ""}
        savedFiles={savedFiles ?? []}
      />
    </div>
  );
}
