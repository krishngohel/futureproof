"use client";

import { useState } from "react";

interface Props {
  examplePrompts: string[];
}

const MOCK_RESPONSES: Record<string, string> = {
  default: `Great prompt! Here's what I think:

AI works by finding patterns in massive amounts of data. When you ask a question, I look for the most helpful and accurate response based on everything I've learned.

**Tip:** The more specific your prompt, the better I can help. Try adding details like your background, what format you want, or how long the answer should be.

Want to try a different prompt? The examples above are great starting points!`,

  ai: `Artificial Intelligence is technology that lets computers learn and make decisions — kind of like how a brain works, but using math and data instead of neurons.

Here are 3 things AI can do:
1. **Understand language** — like when Siri or Alexa understands what you say
2. **Recognize images** — like when Google Photos groups your photos by person
3. **Make recommendations** — like when Netflix suggests shows you'll like

Fun fact: You interact with AI dozens of times every day without realizing it!`,

  prompt: `A great prompt has three parts:
1. **Context** — who you are or what you're working on
2. **Task** — exactly what you want
3. **Format** — how you want the answer

**Bad prompt:** "Tell me about dogs"
**Great prompt:** "I'm a 5th grader writing a report. Give me 5 interesting facts about dogs formatted as bullet points."

Try rewriting your prompt with those three parts!`,

  photosynthesis: `Photosynthesis is how plants make their own food using sunlight! 🌱

Here's how it works:
1. **Roots** absorb water from the soil
2. **Leaves** absorb carbon dioxide (CO₂) from the air
3. **Chlorophyll** captures sunlight
4. The plant uses that energy to turn water + CO₂ into **sugar** (food)
5. Leftover **oxygen** is released — that's what you breathe!

Think of it like a solar-powered kitchen: the sun is the stove, water and CO₂ are the ingredients, and sugar is the meal! 🍽️`,

  python: `Python is one of the most beginner-friendly programming languages! Here's your first Python program:

\`\`\`python
name = input("What's your name? ")
print("Hello, " + name + "! Welcome to coding!")
\`\`\`

**What each line does:**
- Line 1: Asks the user to type their name and saves it in a variable called \`name\`
- Line 2: Prints a personalized greeting using that name

Go to replit.com (free!) and paste it in. Press Run. You're a programmer! 🎉`,

  safety: `Great question about AI safety! Here are the most important things to know:

**What AI gets wrong:**
- AI can "hallucinate" — confidently stating false information
- AI has a knowledge cutoff — it doesn't know about very recent events
- AI can be biased based on its training data

**Privacy rules — never share with AI:**
- Your home address or phone number
- Passwords or account details
- Any private financial or medical information

**Always fact-check:** If AI gives you a surprising fact, verify it on a trusted source before using it in schoolwork.`,
};

function getMockResponse(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("photosynthesis")) return MOCK_RESPONSES.photosynthesis;
  if (lower.includes("python") || lower.includes("coding") || lower.includes("code")) return MOCK_RESPONSES.python;
  if (lower.includes("prompt") || lower.includes("question") || lower.includes("ask")) return MOCK_RESPONSES.prompt;
  if (lower.includes("ai") || lower.includes("artificial intelligence") || lower.includes("machine learning")) return MOCK_RESPONSES.ai;
  if (lower.includes("safe") || lower.includes("privacy") || lower.includes("ethics")) return MOCK_RESPONSES.safety;
  return MOCK_RESPONSES.default;
}

export default function PromptBox({ examplePrompts }: Props) {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);

  function handleSubmit() {
    if (!prompt.trim()) return;
    setLoading(true);
    setResponse("");
    setTimeout(() => {
      setResponse(getMockResponse(prompt));
      setLoading(false);
    }, 900);
  }

  function useExample(example: string) {
    setPrompt(example);
    setResponse("");
  }

  return (
    <div className="flex flex-col" style={{ gap: 16 }}>
      {/* Example chips */}
      <div>
        <p className="font-bold text-[#666666]" style={{ fontSize: 11, letterSpacing: "-0.011em", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.04em" }}>
          Example prompts — click to try
        </p>
        <div className="flex flex-wrap" style={{ gap: 6 }}>
          {examplePrompts.map((ex) => (
            <button
              key={ex}
              onClick={() => useExample(ex)}
              className="font-bold text-[#666666] hover:text-[#999999] text-left transition-colors duration-150"
              style={{ background: "#111111", border: "1px solid #343434", borderRadius: 10, padding: "6px 12px", fontSize: 11, letterSpacing: "-0.011em", lineHeight: 1.4 }}
            >
              {ex.length > 60 ? ex.slice(0, 60) + "…" : ex}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div>
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Type your prompt here, or click an example above…"
          rows={3}
          className="w-full font-bold text-[#cacaca] resize-none focus:outline-none"
          style={{
            background: "#111111",
            border: "1px solid #343434",
            borderRadius: 12,
            padding: "12px 16px",
            fontSize: 13,
            letterSpacing: "-0.016em",
            lineHeight: 1.5,
            caretColor: "#ff4300",
          }}
          onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#ff4300"; }}
          onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#343434"; }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />
        <div className="flex items-center justify-between" style={{ marginTop: 8 }}>
          <span className="font-bold text-[#666666]" style={{ fontSize: 11, letterSpacing: "-0.011em" }}>
            Ctrl+Enter to submit
          </span>
          <button
            onClick={handleSubmit}
            disabled={!prompt.trim() || loading}
            className="font-bold text-white active:scale-95 transition-all duration-150"
            style={{
              background: prompt.trim() && !loading ? "#ff4300" : "#343434",
              borderRadius: 10,
              padding: "8px 16px",
              fontSize: 12,
              letterSpacing: "-0.011em",
              cursor: !prompt.trim() || loading ? "not-allowed" : "pointer",
              opacity: !prompt.trim() || loading ? 0.5 : 1,
              color: "#ffffff",
            }}
          >
            {loading ? "Thinking…" : "Send →"}
          </button>
        </div>
      </div>

      {/* Response */}
      {(loading || response) && (
        <div style={{ background: "#111111", border: "1px solid #343434", borderRadius: 14, padding: 20 }}>
          <div className="flex items-center gap-2" style={{ marginBottom: 14 }}>
            <span className="font-bold text-[#cacaca]" style={{ fontSize: 13, letterSpacing: "-0.016em" }}>
              AI Response
            </span>
            <span
              className="font-bold text-[#666666]"
              style={{ background: "#343434", borderRadius: 7, padding: "2px 8px", fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase" }}
            >
              Mock
            </span>
          </div>
          {loading ? (
            <div className="flex flex-col" style={{ gap: 8 }}>
              {[80, 65, 90, 50].map((w, i) => (
                <div
                  key={i}
                  className="animate-pulse"
                  style={{ height: 10, background: "#343434", borderRadius: 999, width: `${w}%` }}
                />
              ))}
            </div>
          ) : (
            <div
              className="font-bold text-[#999999]"
              style={{ fontSize: 13, letterSpacing: "-0.016em", lineHeight: 1.65 }}
              dangerouslySetInnerHTML={{
                __html: response
                  .replace(/\*\*(.+?)\*\*/g, '<strong style="color:#cacaca">$1</strong>')
                  .replace(/`([^`]+)`/g, '<code style="background:#343434;color:#ff4300;padding:2px 6px;border-radius:5px;font-size:0.8em">$1</code>')
                  .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre style="background:#181818;border:1px solid #343434;border-radius:10px;padding:12px;overflow-x:auto;margin:8px 0"><code style="color:#cacaca;font-size:0.8em">$1</code></pre>')
                  .replace(/\n\n/g, '<br/><br/>')
                  .replace(/\n/g, '<br/>'),
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
