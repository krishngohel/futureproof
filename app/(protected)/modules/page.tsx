import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { MODULES } from "@/lib/modules-data";

export default async function ModulesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: progressRows }] = await Promise.all([
    supabase.from("profiles").select("is_subscribed").eq("id", user!.id).single(),
    supabase.from("module_progress").select("module_id, completed").eq("user_id", user!.id),
  ]);

  const isSubscribed = profile?.is_subscribed || false;
  const completedIds = new Set(
    (progressRows || []).filter((p) => p.completed).map((p) => p.module_id)
  );

  return (
    <div style={{ fontFamily: "-apple-system,'Inter',ui-sans-serif,system-ui,sans-serif" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 className="font-bold text-[#cacaca]" style={{ fontSize: 24, letterSpacing: "-0.03em", lineHeight: 1.25 }}>
          Learning Modules
        </h1>
        <p className="font-bold text-[#666666]" style={{ fontSize: 14, letterSpacing: "-0.016em", marginTop: 6 }}>
          Work through each module at your own pace. Quizzes reinforce what you learn.
        </p>
      </div>

      <div className="flex flex-col" style={{ gap: 8 }}>
        {MODULES.map((mod, i) => {
          const isLocked = !mod.free && !isSubscribed;
          const isDone = completedIds.has(mod.id);

          return (
            <div
              key={mod.id}
              className="flex items-center gap-5"
              style={{
                background: "rgba(18,18,20,0.72)",
                backdropFilter: "blur(20px)",
                border: isDone ? "1px solid rgba(255,67,0,0.25)" : "1px solid rgba(52,52,52,0.7)",
                borderRadius: 20,
                padding: "20px 24px",
                opacity: isLocked ? 0.65 : 1,
              }}
            >
              {/* Emoji icon */}
              <div
                className="flex-shrink-0 flex items-center justify-center"
                style={{ width: 48, height: 48, background: "#343434", borderRadius: 14, fontSize: 22 }}
              >
                {mod.emoji}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2" style={{ marginBottom: 4 }}>
                  <span className="font-bold text-[#666666]" style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Module {String(i + 1).padStart(2, "0")}
                  </span>
                  <span style={{ color: "#343434", fontSize: 10 }}>·</span>
                  <span className="font-bold text-[#666666]" style={{ fontSize: 11, letterSpacing: "-0.011em" }}>
                    {mod.duration.standard}
                  </span>
                  {mod.free && (
                    <span
                      className="font-bold"
                      style={{ background: "#ff4300", color: "#ffffff", fontSize: 10, borderRadius: 7, padding: "2px 8px", letterSpacing: "0.02em" }}
                    >
                      Free
                    </span>
                  )}
                </div>
                <h3 className="font-bold text-[#cacaca]" style={{ fontSize: 14, letterSpacing: "-0.016em", lineHeight: 1.3, marginBottom: 2 }}>
                  {mod.title}
                </h3>
                <p className="font-bold text-[#666666] truncate" style={{ fontSize: 12, letterSpacing: "-0.011em" }}>
                  {mod.description}
                </p>
              </div>

              {/* CTA */}
              <div className="flex-shrink-0">
                {isDone ? (
                  <Link
                    href={`/modules/${mod.id}`}
                    className="font-bold transition-colors duration-150"
                    style={{ color: "#ff4300", background: "rgba(255,67,0,0.1)", border: "1px solid rgba(255,67,0,0.2)", borderRadius: 12, padding: "8px 16px", fontSize: 12, letterSpacing: "-0.011em" }}
                  >
                    ✓ Review
                  </Link>
                ) : isLocked ? (
                  <Link
                    href="/api/stripe/checkout"
                    className="font-bold text-[#666666] hover:text-[#999999] transition-colors duration-150"
                    style={{ border: "1px solid #343434", borderRadius: 12, padding: "8px 16px", fontSize: 12, letterSpacing: "-0.011em" }}
                  >
                    Unlock
                  </Link>
                ) : (
                  <Link
                    href={`/modules/${mod.id}`}
                    className="font-bold text-white active:scale-95 transition-all duration-150"
                    style={{ background: "#ff4300", borderRadius: 12, padding: "8px 16px", fontSize: 12, letterSpacing: "-0.011em" }}
                  >
                    Start →
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
