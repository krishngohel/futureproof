"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Module, LearningLevel } from "@/lib/modules-data";
import Quiz from "@/components/modules/quiz";
import PromptBox from "@/components/modules/prompt-box";

interface Props {
  mod: Module;
  userId: string;
  initialCompleted: boolean;
  initialScore: number | null;
  nextModuleId: string | null;
  nextModuleLocked: boolean;
}

type Tab = "lesson" | "practice" | "quiz";

const LEVELS: { key: LearningLevel; label: string; desc: string }[] = [
  { key: "light",    label: "🌱 Light",     desc: "Plain English" },
  { key: "standard", label: "📖 Standard",  desc: "Balanced depth" },
  { key: "deep",     label: "🔬 Deep Dive", desc: "Full detail" },
];

export default function ModuleClient({
  mod,
  userId,
  initialCompleted,
  initialScore,
  nextModuleId,
  nextModuleLocked,
}: Props) {
  const [tab, setTab] = useState<Tab>("lesson");
  const [completed, setCompleted] = useState(initialCompleted);
  const [score, setScore] = useState<number | null>(initialScore);
  const [level, setLevel] = useState<LearningLevel>("light");

  useEffect(() => {
    const saved = localStorage.getItem("futureproof-level") as LearningLevel | null;
    if (saved && ["light", "standard", "deep"].includes(saved)) setLevel(saved);
  }, []);

  function changeLevel(l: LearningLevel) {
    setLevel(l);
    localStorage.setItem("futureproof-level", l);
  }

  async function handleQuizComplete(quizScore: number) {
    setScore(quizScore);
    setCompleted(true);
    await fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ moduleId: mod.id, completed: true, quizScore }),
    });
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "lesson",   label: "Lesson" },
    { key: "practice", label: "Practice" },
    { key: "quiz",     label: "Quiz" },
  ];

  const lessonHtml = mod.lessonContent[level]
    .replace(/```[\w]*\n([\s\S]*?)```/g, "<pre><code>$1</code></pre>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>")
    .replace(/\n\n/g, "</p><p>")
    .replace(/^(?!<[hupli])(.+)$/gm, "<p>$1</p>");

  return (
    <div className="max-w-3xl mx-auto" style={{ fontFamily: "-apple-system,'Inter',ui-sans-serif,system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <Link
          href="/modules"
          className="font-bold text-[#666666] hover:text-[#999999] transition-colors duration-150 flex items-center gap-1"
          style={{ fontSize: 13, letterSpacing: "-0.016em", marginBottom: 20 }}
        >
          ← Back to modules
        </Link>

        <div className="flex items-center gap-4" style={{ marginBottom: 20 }}>
          <span style={{ fontSize: 40 }}>{mod.emoji}</span>
          <div className="flex-1">
            <p className="font-bold text-[#666666]" style={{ fontSize: 11, letterSpacing: "0.02em", textTransform: "uppercase", marginBottom: 4 }}>
              Module {mod.id} · {mod.duration[level]}
            </p>
            <h1 className="font-bold text-[#cacaca]" style={{ fontSize: 22, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
              {mod.title}
            </h1>
          </div>
          {completed && (
            <span
              className="font-bold ml-auto"
              style={{ fontSize: 11, background: "rgba(255,67,0,0.15)", color: "#ff4300", borderRadius: 7, padding: "3px 10px", letterSpacing: "0.02em", whiteSpace: "nowrap" }}
            >
              ✓ Done {score !== null ? `· ${score}%` : ""}
            </span>
          )}
        </div>

        {/* Level picker */}
        <div className="flex gap-2 flex-wrap">
          {LEVELS.map((l) => (
            <button
              key={l.key}
              onClick={() => changeLevel(l.key)}
              className="font-bold flex items-center gap-1.5 transition-all duration-150 active:scale-95"
              style={{
                padding: "7px 14px",
                borderRadius: 12,
                fontSize: 12,
                letterSpacing: "-0.011em",
                border: "1px solid",
                ...(level === l.key
                  ? { background: "#ff4300", color: "#ffffff", borderColor: "#ff4300" }
                  : { background: "rgba(18,18,20,0.72)", color: "#666666", borderColor: "#343434" }),
              }}
            >
              {l.label}
              <span style={{ fontSize: 10, opacity: 0.7 }}>{l.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab bar */}
      <div
        className="flex gap-1"
        style={{ background: "rgba(18,18,20,0.72)", border: "1px solid #343434", borderRadius: 14, padding: 4, marginBottom: 20 }}
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="flex-1 font-bold transition-all duration-150"
            style={{
              padding: "8px 12px",
              borderRadius: 10,
              fontSize: 13,
              letterSpacing: "-0.016em",
              ...(tab === t.key
                ? { background: "#343434", color: "#cacaca" }
                : { background: "transparent", color: "#666666" }),
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content card */}
      <div style={{ background: "rgba(18,18,20,0.72)", backdropFilter: "blur(24px)", border: "1px solid rgba(52,52,52,0.7)", borderRadius: 20, overflow: "hidden" }}>

        {tab === "lesson" && (
          <div style={{ padding: 32 }}>
            <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: lessonHtml }} />
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #343434" }}>
              <button
                onClick={() => setTab("practice")}
                className="w-full font-bold text-white active:scale-95 transition-all duration-150"
                style={{ background: "#ff4300", borderRadius: 14, padding: "13px 0", fontSize: 14, letterSpacing: "-0.016em" }}
              >
                Practice prompts →
              </button>
            </div>
          </div>
        )}

        {tab === "practice" && (
          <div style={{ padding: 32 }}>
            <h2 className="font-bold text-[#cacaca]" style={{ fontSize: 16, letterSpacing: "-0.025em", marginBottom: 6 }}>
              Try these prompts
            </h2>
            <p className="font-bold text-[#666666]" style={{ fontSize: 13, letterSpacing: "-0.016em", marginBottom: 24 }}>
              Click an example or write your own.
            </p>
            <PromptBox examplePrompts={mod.examplePrompts} />
            <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid #343434" }}>
              <button
                onClick={() => setTab("quiz")}
                className="w-full font-bold text-white active:scale-95 transition-all duration-150"
                style={{ background: "#ff4300", borderRadius: 14, padding: "13px 0", fontSize: 14, letterSpacing: "-0.016em" }}
              >
                Take the quiz →
              </button>
            </div>
          </div>
        )}

        {tab === "quiz" && (
          <div style={{ padding: 32 }}>
            <div
              className="flex items-center gap-2 font-bold"
              style={{ background: "#111111", border: "1px solid #343434", borderRadius: 10, padding: "8px 14px", marginBottom: 24, fontSize: 12, letterSpacing: "-0.011em" }}
            >
              <span className="text-[#666666]">Quiz level:</span>
              <span style={{ color: "#ff4300" }}>{LEVELS.find((l) => l.key === level)?.label}</span>
              <span className="text-[#666666]">· 15 questions</span>
            </div>
            <Quiz
              questions={mod.quiz[level]}
              moduleTitle={mod.title}
              onComplete={handleQuizComplete}
              previousScore={score}
            />
            {completed && nextModuleId && (
              <div style={{ marginTop: 24, paddingTop: 24, borderTop: "1px solid #343434" }}>
                {nextModuleLocked ? (
                  <Link
                    href="/api/stripe/checkout"
                    className="block w-full text-center font-bold text-white active:scale-95 transition-all duration-150"
                    style={{ background: "#ff4300", borderRadius: 14, padding: "13px 0", fontSize: 14, letterSpacing: "-0.016em" }}
                  >
                    Upgrade to unlock next module
                  </Link>
                ) : (
                  <Link
                    href={`/modules/${nextModuleId}`}
                    className="block w-full text-center font-bold text-white active:scale-95 transition-all duration-150"
                    style={{ background: "#ff4300", borderRadius: 14, padding: "13px 0", fontSize: 14, letterSpacing: "-0.016em" }}
                  >
                    Next module →
                  </Link>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
