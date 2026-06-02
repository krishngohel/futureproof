"use client";

import { useState } from "react";
import { QuizQuestion } from "@/lib/modules-data";

interface Props {
  questions: QuizQuestion[];
  moduleTitle: string;
  onComplete: (score: number) => void;
  previousScore: number | null;
}

export default function Quiz({ questions, moduleTitle, onComplete, previousScore }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState<number | null>(previousScore);

  function selectAnswer(questionId: string, optionIndex: number) {
    if (submitted) return;
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  }

  function handleSubmit() {
    if (Object.keys(answers).length < questions.length) return;
    let correct = 0;
    questions.forEach((q) => { if (answers[q.id] === q.correct) correct++; });
    const pct = Math.round((correct / questions.length) * 100);
    setScore(pct);
    setSubmitted(true);
    onComplete(pct);
  }

  function handleRetry() {
    setAnswers({});
    setSubmitted(false);
    setScore(null);
  }

  const allAnswered = Object.keys(answers).length === questions.length;

  if (submitted && score !== null) {
    const isPassing = score >= 70;
    return (
      <div className="text-center" style={{ paddingTop: 16, paddingBottom: 16 }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>
          {score === 100 ? "🏆" : isPassing ? "🎉" : "📚"}
        </div>
        <h3 className="font-bold text-[#cacaca]" style={{ fontSize: 22, letterSpacing: "-0.03em", marginBottom: 8 }}>
          {score === 100 ? "Perfect score!" : isPassing ? "Nice work!" : "Keep studying!"}
        </h3>
        <p className="font-bold text-[#666666]" style={{ fontSize: 14, letterSpacing: "-0.016em", marginBottom: 32 }}>
          You scored{" "}
          <span style={{ color: "#ff4300" }}>{score}%</span>{" "}
          on {moduleTitle}
        </p>

        <div className="text-left flex flex-col" style={{ gap: 8, marginBottom: 32 }}>
          {questions.map((q) => {
            const userAnswer = answers[q.id];
            const isCorrect = userAnswer === q.correct;
            return (
              <div
                key={q.id}
                style={{
                  borderRadius: 14,
                  padding: 16,
                  border: "1px solid",
                  ...(isCorrect
                    ? { background: "rgba(74,222,128,0.06)", borderColor: "rgba(74,222,128,0.2)" }
                    : { background: "rgba(255,67,0,0.06)", borderColor: "rgba(255,67,0,0.2)" }),
                }}
              >
                <p className="font-bold text-[#cacaca]" style={{ fontSize: 13, letterSpacing: "-0.016em", lineHeight: 1.4, marginBottom: 6 }}>
                  {q.question}
                </p>
                <p
                  className="font-bold"
                  style={{ fontSize: 12, letterSpacing: "-0.011em", color: isCorrect ? "#4ade80" : "#ff4300", marginBottom: isCorrect ? 0 : 4 }}
                >
                  {isCorrect ? "✓ Correct" : `✗ You said: ${q.options[userAnswer]}`}
                </p>
                {!isCorrect && (
                  <p className="font-bold text-[#999999]" style={{ fontSize: 12, letterSpacing: "-0.011em", marginBottom: 4 }}>
                    Correct: {q.options[q.correct]}
                  </p>
                )}
                <p className="font-bold text-[#666666]" style={{ fontSize: 11, letterSpacing: "-0.011em", lineHeight: 1.5, marginTop: 6, fontStyle: "italic" }}>
                  {q.explanation}
                </p>
              </div>
            );
          })}
        </div>

        {!isPassing && (
          <button
            onClick={handleRetry}
            className="font-bold text-white active:scale-95 transition-all duration-150"
            style={{ background: "#ff4300", borderRadius: 14, padding: "12px 32px", fontSize: 14, letterSpacing: "-0.016em" }}
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="font-bold text-[#cacaca]" style={{ fontSize: 16, letterSpacing: "-0.025em", marginBottom: 4 }}>
        Module Quiz
      </h2>
      <p className="font-bold text-[#666666]" style={{ fontSize: 13, letterSpacing: "-0.016em", marginBottom: 28 }}>
        {questions.length} questions · Choose the best answer for each.
        {previousScore !== null && (
          <span style={{ marginLeft: 8, color: "#ff4300" }}>Previous score: {previousScore}%</span>
        )}
      </p>

      <div className="flex flex-col" style={{ gap: 28 }}>
        {questions.map((q, qi) => (
          <div key={q.id}>
            <p className="font-bold text-[#cacaca]" style={{ fontSize: 13, letterSpacing: "-0.016em", lineHeight: 1.45, marginBottom: 10 }}>
              <span style={{ color: "#ff4300", marginRight: 8 }}>Q{qi + 1}.</span>
              {q.question}
            </p>
            <div className="flex flex-col" style={{ gap: 6 }}>
              {q.options.map((option, oi) => {
                const isSelected = answers[q.id] === oi;
                return (
                  <button
                    key={oi}
                    onClick={() => selectAnswer(q.id, oi)}
                    className="w-full text-left font-bold transition-all duration-150"
                    style={{
                      padding: "10px 14px",
                      borderRadius: 12,
                      fontSize: 12,
                      letterSpacing: "-0.011em",
                      lineHeight: 1.4,
                      border: "1px solid",
                      ...(isSelected
                        ? { background: "rgba(255,67,0,0.1)", borderColor: "#ff4300", color: "#cacaca" }
                        : { background: "#111111", borderColor: "#343434", color: "#666666" }),
                    }}
                  >
                    <span style={{ fontWeight: 700, marginRight: 8, color: isSelected ? "#ff4300" : "#343434" }}>
                      {String.fromCharCode(65 + oi)}.
                    </span>
                    {option}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleSubmit}
        disabled={!allAnswered}
        className="w-full font-bold text-white active:scale-95 transition-all duration-150"
        style={{
          marginTop: 32,
          background: allAnswered ? "#ff4300" : "#343434",
          borderRadius: 14,
          padding: "13px 0",
          fontSize: 14,
          letterSpacing: "-0.016em",
          cursor: allAnswered ? "pointer" : "not-allowed",
          opacity: allAnswered ? 1 : 0.5,
        }}
      >
        {allAnswered ? "Submit answers →" : `Answer all ${questions.length} questions to submit`}
      </button>
    </div>
  );
}
