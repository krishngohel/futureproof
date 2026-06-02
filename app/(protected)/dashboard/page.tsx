import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MODULES } from "@/lib/modules-data";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: progressRows }] = await Promise.all([
    supabase.from("profiles").select("full_name, is_subscribed").eq("id", user!.id).single(),
    supabase.from("module_progress").select("module_id, completed, quiz_score").eq("user_id", user!.id),
  ]);

  const completedIds = new Set(
    (progressRows || []).filter((p) => p.completed).map((p) => p.module_id)
  );
  const completedCount = completedIds.size;
  const progressPercent = Math.round((completedCount / MODULES.length) * 100);
  const isSubscribed = profile?.is_subscribed || false;
  const firstName = profile?.full_name?.split(" ")[0] || "there";

  return (
    <div style={{ fontFamily: "-apple-system,'Inter',ui-sans-serif,system-ui,sans-serif" }}>

      {/* Welcome */}
      <div style={{ marginBottom: 32 }}>
        <h1 className="font-bold text-[#cacaca]" style={{ fontSize: 24, letterSpacing: "-0.03em", lineHeight: 1.25 }}>
          Welcome back, {firstName}
        </h1>
        <p className="font-bold text-[#666666]" style={{ fontSize: 14, letterSpacing: "-0.016em", marginTop: 6 }}>
          {completedCount === 0
            ? "Ready to start your AI journey? Module 1 is free — no card needed."
            : `You've completed ${completedCount} of ${MODULES.length} modules. Keep going!`}
        </p>
      </div>

      {/* Progress overview */}
      <div style={{ background: "rgba(18,18,20,0.72)", backdropFilter: "blur(20px)", border: "1px solid rgba(52,52,52,0.7)", borderRadius: 20, padding: "24px", marginBottom: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
          <span className="font-bold text-[#cacaca]" style={{ fontSize: 14, letterSpacing: "-0.016em" }}>Overall progress</span>
          <span className="font-bold text-[#666666]" style={{ fontSize: 12, letterSpacing: "-0.011em" }}>
            {completedCount} / {MODULES.length} modules
          </span>
        </div>
        <div style={{ width: "100%", background: "#343434", borderRadius: 999, height: 6 }}>
          <div
            style={{ width: `${progressPercent}%`, background: "#ff4300", borderRadius: 999, height: 6, transition: "width 0.4s ease" }}
          />
        </div>
        <p className="font-bold text-[#666666]" style={{ fontSize: 11, letterSpacing: "-0.011em", marginTop: 8 }}>{progressPercent}% complete</p>
      </div>

      {/* Upgrade banner */}
      {!isSubscribed && (
        <div
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ background: "rgba(18,18,20,0.72)", backdropFilter: "blur(20px)", border: "1px solid rgba(52,52,52,0.7)", borderRadius: 20, padding: 24, marginBottom: 24, position: "relative" }}
        >
          <div
            style={{ position: "absolute", top: -12, left: 20, background: "#343434", color: "#999999", fontSize: 10, borderRadius: 7, padding: "3px 10px", letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 700 }}
          >
            Pro
          </div>
          <div style={{ paddingTop: 4 }}>
            <h3 className="font-bold text-[#cacaca]" style={{ fontSize: 14, letterSpacing: "-0.016em", marginBottom: 4 }}>
              Unlock all {MODULES.length} modules for $5/month
            </h3>
            <p className="font-bold text-[#666666]" style={{ fontSize: 12, letterSpacing: "-0.011em", lineHeight: 1.5 }}>
              Module 1 is free. Upgrade to access everything — Prompting, Memory, Tokens, Skills, and more.
            </p>
          </div>
          <Link
            href="/#pricing"
            className="flex-shrink-0 font-bold text-white active:scale-95 transition-all duration-150"
            style={{ background: "#ff4300", borderRadius: 15, padding: "10px 20px", fontSize: 13, letterSpacing: "-0.016em", whiteSpace: "nowrap" }}
          >
            See plans →
          </Link>
        </div>
      )}

      {/* Modules grid */}
      <h2 className="font-bold text-[#cacaca]" style={{ fontSize: 14, letterSpacing: "-0.016em", marginBottom: 12 }}>Your modules</h2>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
        {MODULES.map((mod) => {
          const isLocked = !mod.free && !isSubscribed;
          const isDone = completedIds.has(mod.id);
          const progress = progressRows?.find((p) => p.module_id === mod.id);

          return (
            <div
              key={mod.id}
              style={{
                background: "rgba(18,18,20,0.72)",
                border: isDone ? "1px solid rgba(255,67,0,0.3)" : "1px solid #343434",
                borderRadius: 20,
                padding: 20,
                opacity: isLocked ? 0.65 : 1,
                transition: "border-color 0.15s ease",
              }}
            >
              <div className="flex items-start justify-between" style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 28 }}>{mod.emoji}</span>
                <span
                  className="font-bold"
                  style={{
                    fontSize: 10, borderRadius: 7, padding: "2px 8px", letterSpacing: "0.02em",
                    ...(isDone
                      ? { background: "rgba(255,67,0,0.15)", color: "#ff4300" }
                      : isLocked
                      ? { background: "#343434", color: "#666666" }
                      : { background: "#343434", color: "#999999" }),
                  }}
                >
                  {isDone ? "✓ Done" : isLocked ? "Locked" : "In progress"}
                </span>
              </div>

              <h3 className="font-bold text-[#cacaca]" style={{ fontSize: 14, letterSpacing: "-0.016em", lineHeight: 1.3, marginBottom: 4 }}>
                {mod.title}
              </h3>
              <p className="font-bold text-[#666666]" style={{ fontSize: 12, letterSpacing: "-0.011em", lineHeight: 1.55, marginBottom: 16 }}>
                {mod.description}
              </p>

              {progress?.quiz_score !== undefined && (
                <p className="font-bold text-[#666666]" style={{ fontSize: 11, letterSpacing: "-0.011em", marginBottom: 10 }}>
                  Quiz score: <span style={{ color: "#ff4300" }}>{progress.quiz_score}%</span>
                </p>
              )}

              {isLocked ? (
                <Link
                  href="/#pricing"
                  className="block w-full text-center font-bold text-[#666666] hover:text-[#999999] transition-colors duration-150"
                  style={{ border: "1px solid #343434", borderRadius: 12, padding: "9px 0", fontSize: 12, letterSpacing: "-0.011em" }}
                >
                  See plans to unlock
                </Link>
              ) : (
                <Link
                  href={`/modules/${mod.id}`}
                  className="block w-full text-center font-bold text-white active:scale-95 transition-all duration-150"
                  style={{ background: "#ff4300", borderRadius: 12, padding: "9px 0", fontSize: 12, letterSpacing: "-0.011em" }}
                >
                  {isDone ? "Review" : "Start module"}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      {/* Tools row */}
      <div className="grid sm:grid-cols-2 gap-3" style={{ marginTop: 24 }}>
        {/* Playground CTA */}
        <div
          className="flex flex-col justify-between gap-4"
          style={{ background: "rgba(18,18,20,0.72)", backdropFilter: "blur(20px)", border: "1px solid rgba(52,52,52,0.7)", borderRadius: 20, padding: 24 }}
        >
          <div>
            <h3 className="font-bold text-[#cacaca]" style={{ fontSize: 14, letterSpacing: "-0.016em", marginBottom: 4 }}>Prompt Playground</h3>
            <p className="font-bold text-[#666666]" style={{ fontSize: 12, letterSpacing: "-0.011em" }}>Practice writing prompts with guided example responses.</p>
          </div>
          <Link
            href="/playground"
            className="self-start font-bold text-[#cacaca] hover:text-white active:scale-95 transition-all duration-150"
            style={{ background: "#343434", borderRadius: 15, padding: "10px 20px", fontSize: 13, letterSpacing: "-0.016em", whiteSpace: "nowrap" }}
          >
            Open playground →
          </Link>
        </div>

        {/* IDE CTA */}
        <div
          className="flex flex-col justify-between gap-4"
          style={{ background: "rgba(18,18,20,0.72)", backdropFilter: "blur(20px)", border: "1px solid rgba(52,52,52,0.7)", borderRadius: 20, padding: 24 }}
        >
          <div>
            <h3 className="font-bold text-[#cacaca]" style={{ fontSize: 14, letterSpacing: "-0.016em", marginBottom: 4 }}>Code IDE</h3>
            <p className="font-bold text-[#666666]" style={{ fontSize: 12, letterSpacing: "-0.011em" }}>Write and run code in-browser — Python, JavaScript, and more.</p>
          </div>
          <Link
            href="/ide"
            className="self-start font-bold text-[#cacaca] hover:text-white active:scale-95 transition-all duration-150"
            style={{ background: "#343434", borderRadius: 15, padding: "10px 20px", fontSize: 13, letterSpacing: "-0.016em", whiteSpace: "nowrap" }}
          >
            Open IDE →
          </Link>
        </div>
      </div>
    </div>
  );
}
