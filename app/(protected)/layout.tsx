import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import DashboardNav from "@/components/layout/dashboard-nav";
import AnimatedGradient from "@/components/ui/animated-gradient";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, is_subscribed")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen" style={{ background: "#111111", fontFamily: "-apple-system,'Inter',ui-sans-serif,system-ui,sans-serif" }}>
      {/* Gradient renders above the #111111 block background (fixed z-index:0 paints after block layers) */}
      <AnimatedGradient />
      {/* Nav and main sit at z-index ≥ 1 so they're always above the gradient */}
      <DashboardNav
        userName={profile?.full_name || user.email || "Student"}
        isSubscribed={profile?.is_subscribed || false}
      />
      <main className="max-w-[1107px] mx-auto px-8 py-10" style={{ position: "relative", zIndex: 1 }}>
        {children}
      </main>
    </div>
  );
}
