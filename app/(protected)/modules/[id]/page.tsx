import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getModuleById, MODULES } from "@/lib/modules-data";
import ModuleClient from "./module-client";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ModulePage({ params }: Props) {
  const { id } = await params;
  const mod = getModuleById(id);
  if (!mod) notFound();

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: progress }] = await Promise.all([
    supabase.from("profiles").select("is_subscribed").eq("id", user!.id).single(),
    supabase
      .from("module_progress")
      .select("completed, quiz_score")
      .eq("user_id", user!.id)
      .eq("module_id", mod.id)
      .single(),
  ]);

  const isSubscribed = profile?.is_subscribed || false;
  if (!mod.free && !isSubscribed) redirect("/dashboard");

  const currentIndex = MODULES.findIndex((m) => m.id === mod.id);
  const nextModule = MODULES[currentIndex + 1] || null;

  return (
    <ModuleClient
      mod={mod}
      userId={user!.id}
      initialCompleted={progress?.completed || false}
      initialScore={progress?.quiz_score ?? null}
      nextModuleId={nextModule?.id || null}
      nextModuleLocked={nextModule ? (!nextModule.free && !isSubscribed) : false}
    />
  );
}
