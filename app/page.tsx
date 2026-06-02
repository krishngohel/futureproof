"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { MODULES } from "@/lib/modules-data";
import ScrollFrameBackground from "@/components/ui/scroll-frame-background";
import { MacbookScroll } from "@/components/ui/macbook-scroll";
import VSCodeMockup from "@/components/ui/vscode-mockup";
import AnimatedGradient from "@/components/ui/animated-gradient";

const AuthModal = dynamic(() => import("@/components/auth/auth-modal"), { ssr: false });

type ModalMode = "signin" | "signup";

function Veil({ dir, h = 200 }: { dir: "top" | "bottom"; h?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        [dir === "top" ? "top" : "bottom"]: 0,
        left: 0,
        right: 0,
        height: h,
        background: dir === "top"
          ? "linear-gradient(to bottom, #111111 0%, transparent 100%)"
          : "linear-gradient(to top, #111111 0%, transparent 100%)",
        pointerEvents: "none",
        zIndex: 1,
      }}
    />
  );
}

const TIERS = [
  {
    key: "free",
    name: "Free",
    price: 0,
    label: null,
    tokens: null,
    features: [
      "Module 1 — AI Basics",
      "Quiz with instant feedback",
      "Progress tracking",
    ],
    locked: [
      "Prompt playground",
      "Code IDE",
      "Modules 2–5",
    ],
    cta: "Get started free",
    ctaStyle: "outline" as const,
    href: null,
  },
  {
    key: "starter",
    name: "Starter",
    price: 5,
    label: null,
    tokens: "50k tokens / week",
    features: [
      `All ${MODULES.length} learning modules`,
      "Prompt playground",
      "50k AI tokens per week",
      "Progress tracking + quizzes",
      "New content monthly",
    ],
    locked: ["Code IDE"],
    cta: "Start Starter",
    ctaStyle: "outline" as const,
    href: "/api/stripe/checkout?plan=starter",
  },
  {
    key: "pro",
    name: "Pro",
    price: 12,
    label: "Most popular",
    tokens: "150k tokens / week",
    features: [
      `All ${MODULES.length} learning modules`,
      "Prompt playground",
      "150k AI tokens per week",
      "Code IDE included",
      "Progress tracking + quizzes",
      "New content monthly",
    ],
    locked: [],
    cta: "Get Pro",
    ctaStyle: "filled" as const,
    href: "/api/stripe/checkout?plan=pro",
  },
  {
    key: "max",
    name: "Max",
    price: 20,
    label: null,
    tokens: "200k tokens / week",
    features: [
      `All ${MODULES.length} learning modules`,
      "Prompt playground",
      "Full 200k tokens per week",
      "Code IDE included",
      "Priority support",
      "Early access to new features",
    ],
    locked: [],
    cta: "Get Max",
    ctaStyle: "outline" as const,
    href: "/api/stripe/checkout?plan=max",
  },
];

export default function LandingPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("signup");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  function openModal(mode: ModalMode) { setModalMode(mode); setModalOpen(true); }

  useEffect(() => {
    import("@/lib/supabase/client").then(({ createClient }) => {
      const supabase = createClient();
      supabase.auth.getSession().then(({ data: { session } }) => {
        setIsLoggedIn(!!session);
      });
    });
  }, []);

  const appNavLinks: [string, string][] = [
    ["/dashboard", "Dashboard"],
    ["/modules",   "Modules"],
    ["/playground","Playground"],
    ["/ide",       "IDE"],
  ];

  const landingNavLinks: [string, string][] = [
    ["#platform", "Platform"],
    ["#modules",  "Modules"],
    ["#pricing",  "Pricing"],
  ];

  const navLinks = isLoggedIn ? appNavLinks : landingNavLinks;

  return (
    <div className="min-h-screen" style={{ fontFamily: "-apple-system,'Inter',ui-sans-serif,system-ui,sans-serif" }}>
      <ScrollFrameBackground pixelsPerFrame={6} />
      <AuthModal isOpen={modalOpen} defaultMode={modalMode} onClose={() => setModalOpen(false)} />

      {/* ── Nav ───────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-40 px-8" style={{ background: "transparent", pointerEvents: "none" }}>
        <div className="max-w-[1107px] mx-auto pt-5 pb-3 flex items-center justify-between" style={{ pointerEvents: "auto" }}>

          <a href="/" className="font-bold text-white hover:opacity-80 transition-opacity duration-150" style={{ fontSize: 15, letterSpacing: "-0.025em" }}>
            Futureproof
          </a>

          <div
            className="hidden sm:flex items-center"
            style={{
              background: "rgba(255,255,255,0.08)",
              backdropFilter: "blur(28px) saturate(180%)",
              WebkitBackdropFilter: "blur(28px) saturate(180%)",
              borderRadius: 999,
              border: "1px solid rgba(255,255,255,0.13)",
              padding: "4px 4px",
              gap: 2,
            }}
          >
            {navLinks.map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="font-bold transition-colors duration-150"
                style={{ fontSize: 13, letterSpacing: "-0.016em", padding: "6px 16px", borderRadius: 999, color: "rgba(255,255,255,0.6)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.95)")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              >
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn ? (
              <Link
                href="/dashboard"
                className="font-bold text-white active:scale-95 transition-all duration-150"
                style={{ background: "#ff4300", borderRadius: 999, padding: "8px 20px", fontSize: 13, letterSpacing: "-0.016em" }}
              >
                Go to app →
              </Link>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => openModal("signin")}
                  className="font-bold transition-opacity duration-150 hover:opacity-80"
                  style={{ fontSize: 13, letterSpacing: "-0.016em", color: "rgba(255,255,255,0.6)" }}
                >
                  Sign in
                </button>
                <button
                  type="button"
                  onClick={() => openModal("signup")}
                  className="font-bold text-white active:scale-95 transition-all duration-150"
                  style={{ background: "#ff4300", borderRadius: 999, padding: "8px 20px", fontSize: 13, letterSpacing: "-0.016em" }}
                >
                  Get started free
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero + About wrapper ──────────────────────────────────────── */}
      <div className="relative">
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: "rgba(17,17,17,0.36)", zIndex: 0 }} />
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(17,17,17,0.56) 0%, rgba(17,17,17,0.18) 38%, transparent 58%)", zIndex: 0 }} />
        <div aria-hidden="true" className="absolute bottom-0 inset-x-0 pointer-events-none" style={{ height: "55%", background: "linear-gradient(to top, rgba(17,17,17,0.54) 0%, transparent 100%)", zIndex: 0 }} />
        <Veil dir="bottom" h={160} />

      {/* ── Hero ── */}
      <section className="relative min-h-[100dvh] flex items-end px-8 pb-24 pt-20" style={{ zIndex: 1 }}>
        <div className="relative z-10 max-w-[1107px] mx-auto w-full">
          <div className="max-w-[460px] flex flex-col" style={{ gap: 18 }}>
            <div className="inline-flex self-start font-bold text-[#999999]" style={{ background: "#343434", borderRadius: 7, padding: "3px 10px", fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              AI literacy for everyone
            </div>
            <h1 className="font-bold text-[#cacaca]" style={{ fontSize: "clamp(38px, 5.5vw, 68px)", lineHeight: 1.02, letterSpacing: "-0.03em" }}>
              Learn to use AI<br />
              <span style={{ color: "#ff4300" }}>the right way.</span>
            </h1>
            <p className="font-bold text-[#999999]" style={{ fontSize: 16, lineHeight: 1.55, letterSpacing: "-0.020em", maxWidth: 440 }}>
              Structured modules for anyone who wants to understand AI
              and actually use it with confidence.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              {isLoggedIn ? (
                <Link href="/dashboard" className="font-bold text-white active:scale-95 transition-all duration-150" style={{ background: "#ff4300", borderRadius: 15, padding: "11px 24px", fontSize: 14, letterSpacing: "-0.016em" }}>
                  Go to your dashboard →
                </Link>
              ) : (
                <>
                  <button type="button" onClick={() => openModal("signup")} className="font-bold text-white active:scale-95 transition-all duration-150" style={{ background: "#ff4300", borderRadius: 15, padding: "11px 24px", fontSize: 14, letterSpacing: "-0.016em" }}>
                    Start for free — no card required
                  </button>
                  <a href="#platform" className="font-bold text-[#cacaca] active:scale-95 transition-all duration-150" style={{ background: "#343434", borderRadius: 999, padding: "11px 20px", fontSize: 14, letterSpacing: "-0.016em" }}>
                    See the platform ↓
                  </a>
                </>
              )}
            </div>
            <p className="font-bold text-[#666666]" style={{ fontSize: 11, letterSpacing: "-0.011em" }}>
              First module completely free · No credit card needed
            </p>
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" className="relative px-8" style={{ paddingTop: 60, paddingBottom: 240, zIndex: 1 }}>
        <div className="relative max-w-[1107px] mx-auto" style={{ zIndex: 2 }}>
          <div className="grid md:grid-cols-2 gap-20 items-start">
            <div className="flex flex-col" style={{ gap: 20 }}>
              <div className="inline-flex self-start font-bold text-[#666666]" style={{ background: "#343434", borderRadius: 7, padding: "3px 10px", fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                What is Futureproof
              </div>
              <h2 className="font-bold text-[#cacaca]" style={{ fontSize: 24, lineHeight: 1.25, letterSpacing: "-0.03em" }}>
                AI is the new literacy.<br />
                <span style={{ color: "#ff4300" }}>We teach it right.</span>
              </h2>
              <p className="font-bold text-[#999999]" style={{ fontSize: 14, lineHeight: 1.65, letterSpacing: "-0.016em" }}>
                Most AI courses are either too technical or too shallow. Futureproof
                gives you structured, jargon-free lessons that build from first principles —
                so you understand it, not just use it.
              </p>
              <ul className="flex flex-col" style={{ gap: 10 }}>
                {[
                  "Clear lessons under 15 minutes each",
                  "Practice prompts with guided examples",
                  "Quizzes that reinforce the concepts",
                  "Progress tracking for students & parents",
                ].map((item) => (
                  <li key={item} className="flex items-center gap-3 font-bold text-[#999999]" style={{ fontSize: 13, letterSpacing: "-0.016em" }}>
                    <span style={{ color: "#ff4300", fontSize: 10, flexShrink: 0 }}>—</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-col" style={{ gap: 5 }}>
              <div className="grid grid-cols-3 gap-3 mb-2">
                {[
                  { number: String(MODULES.length), label: "Modules" },
                  { number: `${MODULES.length * 5}+`, label: "Quizzes" },
                  { number: "K-12", label: "Grade levels" },
                ].map((stat) => (
                  <div key={stat.label} className="flex flex-col items-center justify-center" style={{ background: "rgba(24,24,24,0.7)", backdropFilter: "blur(12px)", borderRadius: 20, padding: "20px 12px", border: "1px solid rgba(52,52,52,0.45)" }}>
                    <div className="font-bold tabular-nums text-[#cacaca]" style={{ fontSize: 24, letterSpacing: "-0.03em", lineHeight: 1 }}>{stat.number}</div>
                    <div className="font-bold text-[#666666] mt-1.5" style={{ fontSize: 11, letterSpacing: "-0.011em" }}>{stat.label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "Structured lessons", desc: "Jargon-free, under 15 min" },
                  { label: "Prompt playground", desc: "Guided practice examples" },
                  { label: "Code IDE", desc: "Write & run code in-browser" },
                  { label: "Progress tracking", desc: "Module & quiz scores" },
                ].map((f) => (
                  <div key={f.label} style={{ background: "rgba(24,24,24,0.7)", backdropFilter: "blur(12px)", borderRadius: 20, padding: 16, border: "1px solid rgba(52,52,52,0.45)" }}>
                    <div className="font-bold text-[#cacaca] mb-1" style={{ fontSize: 13, letterSpacing: "-0.016em", lineHeight: 1.25 }}>{f.label}</div>
                    <div className="font-bold text-[#666666]" style={{ fontSize: 11, letterSpacing: "-0.011em", lineHeight: 1.4 }}>{f.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
      </div>

      {/* ── MacBook Scroll ────────────────────────────────────────────── */}
      <section id="platform" className="relative overflow-hidden" style={{ background: "#111111" }}>
        <AnimatedGradient contained />
        <Veil dir="top" h={100} />
        <MacbookScroll
          screenContent={<VSCodeMockup />}
          title={
            <span className="font-bold text-[#cacaca]" style={{ letterSpacing: "-0.03em" }}>
              Your AI learning platform.{" "}
              <span style={{ color: "#ff4300" }}>Built to take you further.</span>
            </span>
          }
        />
        <Veil dir="bottom" h={240} />
      </section>

      {/* ── Modules ───────────────────────────────────────────────────── */}
      <section id="modules" className="relative" style={{ background: "#111111", padding: "120px 32px 160px", scrollMarginTop: 64 }}>
        <Veil dir="bottom" h={240} />
        <div className="relative max-w-[1107px] mx-auto" style={{ zIndex: 2 }}>
          <div className="mb-14">
            <h2 className="font-bold text-[#cacaca]" style={{ fontSize: 24, letterSpacing: "-0.03em", lineHeight: 1.25, marginBottom: 8 }}>
              {MODULES.length} modules, zero fluff
            </h2>
            <p className="font-bold text-[#666666]" style={{ fontSize: 14, letterSpacing: "-0.016em" }}>
              Each module includes a lesson, prompt examples, and a quiz.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
            {MODULES.map((mod, i) => (
              <div
                key={mod.id}
                style={{
                  background: "rgba(24,24,24,0.65)", backdropFilter: "blur(16px)", borderRadius: 20, padding: 20, border: "1px solid rgba(52,52,52,0.45)",
                  ...(MODULES.length % 3 === 2 && i === MODULES.length - 2 ? { gridColumnStart: 2 } : {}),
                }}
              >
                <div className="flex items-center justify-between mb-5">
                  <span className="font-bold text-[#666666]" style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    Module {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="font-bold"
                    style={{
                      fontSize: 10, borderRadius: 7, padding: "2px 8px", letterSpacing: "0.02em",
                      ...(mod.free ? { background: "#ff4300", color: "#fff" } : { background: "#343434", color: "#666666" }),
                    }}
                  >
                    {mod.free ? "Free" : "Paid"}
                  </span>
                </div>
                <h3 className="font-bold text-[#cacaca] mb-2" style={{ fontSize: 14, letterSpacing: "-0.016em", lineHeight: 1.3 }}>
                  {mod.title}
                </h3>
                <p className="font-bold text-[#666666] mb-5" style={{ fontSize: 12, letterSpacing: "-0.011em", lineHeight: 1.55 }}>
                  {mod.description}
                </p>
                <div className="font-bold" style={{ fontSize: 11, color: "#444", borderTop: "1px solid rgba(52,52,52,0.4)", paddingTop: 12, letterSpacing: "-0.011em" }}>
                  {mod.duration.standard}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ───────────────────────────────────────────────────── */}
      <section id="pricing" className="relative" style={{ background: "#111111", padding: "140px 32px 180px", scrollMarginTop: 64 }}>
        <Veil dir="top"    h={220} />
        <Veil dir="bottom" h={220} />

        <div className="relative max-w-[1107px] mx-auto" style={{ zIndex: 2 }}>
          <div className="mb-14">
            <h2 className="font-bold text-[#cacaca]" style={{ fontSize: 24, letterSpacing: "-0.03em", lineHeight: 1.25, marginBottom: 8 }}>
              Simple pricing
            </h2>
            <p className="font-bold text-[#666666]" style={{ fontSize: 14, letterSpacing: "-0.016em" }}>
              Start free. Upgrade when you're ready. Cancel anytime.
            </p>
          </div>

          {/* 4-column tier grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
            {TIERS.map((tier) => (
              <div
                key={tier.key}
                className="relative flex flex-col"
                style={{
                  background: tier.key === "pro" ? "rgba(30,18,10,0.85)" : "rgba(24,24,24,0.65)",
                  backdropFilter: "blur(16px)",
                  borderRadius: 20,
                  padding: "28px 20px 20px",
                  border: tier.key === "pro" ? "1px solid rgba(255,67,0,0.35)" : "1px solid rgba(52,52,52,0.45)",
                }}
              >
                {tier.label && (
                  <div
                    className="font-bold"
                    style={{
                      position: "absolute", top: -12, left: 18,
                      background: "#ff4300", color: "#fff",
                      fontSize: 10, borderRadius: 7, padding: "3px 10px",
                      letterSpacing: "0.04em", textTransform: "uppercase",
                    }}
                  >
                    {tier.label}
                  </div>
                )}

                {/* Plan name + price */}
                <div className="mb-5">
                  <div className="font-bold text-[#666666] mb-2" style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" }}>
                    {tier.name}
                  </div>
                  <div className="font-bold text-[#cacaca]" style={{ fontSize: 36, letterSpacing: "-0.04em", lineHeight: 1 }}>
                    {tier.price === 0 ? "Free" : `$${tier.price}`}
                    {tier.price > 0 && (
                      <span className="font-bold text-[#666666]" style={{ fontSize: 14, letterSpacing: "-0.016em" }}>/mo</span>
                    )}
                  </div>
                  {tier.tokens && (
                    <div className="font-bold mt-2" style={{ fontSize: 11, color: "#ff4300", letterSpacing: "-0.011em" }}>
                      {tier.tokens}
                    </div>
                  )}
                </div>

                {/* Features included */}
                <ul className="flex flex-col mb-4" style={{ gap: 7, flex: 1 }}>
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 font-bold text-[#999999]" style={{ fontSize: 12, letterSpacing: "-0.011em" }}>
                      <span style={{ color: "#ff4300", fontSize: 10, flexShrink: 0, marginTop: 2 }}>—</span>
                      {f}
                    </li>
                  ))}
                  {tier.locked.map((f) => (
                    <li key={f} className="flex items-start gap-2 font-bold text-[#444]" style={{ fontSize: 12, letterSpacing: "-0.011em" }}>
                      <span style={{ fontSize: 10, flexShrink: 0, marginTop: 2 }}>—</span>
                      {f}
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {tier.href ? (
                  <a
                    href={tier.href}
                    className="block w-full text-center font-bold active:scale-95 transition-all duration-150"
                    style={{
                      borderRadius: 12,
                      padding: "11px 0",
                      fontSize: 13,
                      letterSpacing: "-0.016em",
                      ...(tier.ctaStyle === "filled"
                        ? { background: "#ff4300", color: "#fff" }
                        : { background: "#343434", color: "#cacaca" }),
                    }}
                  >
                    {tier.cta}
                  </a>
                ) : (
                  <button
                    type="button"
                    onClick={() => openModal("signup")}
                    className="block w-full font-bold active:scale-95 transition-all duration-150"
                    style={{ background: "#343434", color: "#cacaca", borderRadius: 12, padding: "11px 0", fontSize: 13, letterSpacing: "-0.016em" }}
                  >
                    {tier.cta}
                  </button>
                )}
              </div>
            ))}
          </div>

          <p className="text-center font-bold mt-8" style={{ fontSize: 12, color: "#444", letterSpacing: "-0.011em" }}>
            Token limits apply to AI playground usage · Code IDE runs on free Piston API · Cancel anytime
          </p>
        </div>
      </section>

      {/* ── CTA ───────────────────────────────────────────────────────── */}
      <section className="relative" style={{ background: "#111111", padding: "140px 32px 160px" }}>
        <Veil dir="top"    h={220} />
        <Veil dir="bottom" h={220} />
        <div className="relative max-w-[1107px] mx-auto" style={{ zIndex: 2 }}>
          <h2 className="font-bold text-[#cacaca] mb-4" style={{ fontSize: 24, letterSpacing: "-0.03em", lineHeight: 1.25, maxWidth: 480 }}>
            The people learning AI now will lead tomorrow.
          </h2>
          <p className="font-bold text-[#999999] mb-8" style={{ fontSize: 14, letterSpacing: "-0.016em", lineHeight: 1.65, maxWidth: 420 }}>
            AI is reshaping every job, industry, and field. Get ahead of it —
            the first module is completely free.
          </p>
          {isLoggedIn ? (
            <Link href="/dashboard" className="font-bold text-white active:scale-95 transition-all duration-150" style={{ background: "#ff4300", borderRadius: 15, padding: "13px 28px", fontSize: 14, letterSpacing: "-0.016em" }}>
              Go to your dashboard →
            </Link>
          ) : (
            <button type="button" onClick={() => openModal("signup")} className="font-bold text-white active:scale-95 transition-all duration-150" style={{ background: "#ff4300", borderRadius: 15, padding: "13px 28px", fontSize: 14, letterSpacing: "-0.016em" }}>
              Get started for free →
            </button>
          )}
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="relative" style={{ background: "#111111", padding: "100px 32px 40px" }}>
        <Veil dir="top" h={180} />
        <div className="relative max-w-[1107px] mx-auto flex flex-col sm:flex-row justify-between items-center gap-4" style={{ zIndex: 2 }}>
          <span className="font-bold text-[#cacaca]" style={{ fontSize: 14, letterSpacing: "-0.016em" }}>Futureproof</span>
          <div className="flex gap-5">
            {isLoggedIn ? (
              <>
                <Link href="/dashboard" className="font-bold text-[#666666] hover:text-[#999999] transition-colors" style={{ fontSize: 13, letterSpacing: "-0.016em" }}>Dashboard</Link>
                <Link href="/modules"   className="font-bold text-[#666666] hover:text-[#999999] transition-colors" style={{ fontSize: 13, letterSpacing: "-0.016em" }}>Modules</Link>
                <Link href="/ide"       className="font-bold text-[#666666] hover:text-[#999999] transition-colors" style={{ fontSize: 13, letterSpacing: "-0.016em" }}>IDE</Link>
              </>
            ) : (
              <>
                <button type="button" onClick={() => openModal("signin")}  className="font-bold text-[#666666] hover:text-[#999999] transition-colors" style={{ fontSize: 13, letterSpacing: "-0.016em" }}>Sign in</button>
                <button type="button" onClick={() => openModal("signup")}  className="font-bold text-[#666666] hover:text-[#999999] transition-colors" style={{ fontSize: 13, letterSpacing: "-0.016em" }}>Sign up</button>
                <a href="mailto:hello@futureproof.com" className="font-bold text-[#666666] hover:text-[#999999] transition-colors" style={{ fontSize: 13, letterSpacing: "-0.016em" }}>Contact</a>
              </>
            )}
          </div>
          <p className="font-bold text-[#666666]" style={{ fontSize: 11, letterSpacing: "-0.011em" }}>
            © 2026 Futureproof. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
