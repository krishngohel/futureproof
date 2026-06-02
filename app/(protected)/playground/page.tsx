"use client";

import { useState } from "react";

const CATEGORIES = [
  {
    label: "School",
    prompts: [
      "Explain photosynthesis like I'm 10 years old",
      "Give me a 5-paragraph essay outline about climate change",
      "What are the 5 main causes of World War I? Use bullet points.",
      "Help me understand fractions using a pizza analogy",
      "I have a test tomorrow on the American Revolution. What are the 10 most important facts?",
    ],
  },
  {
    label: "Prompting",
    prompts: [
      "What makes a good AI prompt? Give me 5 tips.",
      "Show me the difference between a bad prompt and a great prompt about the same topic",
      "Create a prompt template I can use for any subject to get a better AI response",
    ],
  },
  {
    label: "Coding",
    prompts: [
      "Write a simple Python program that says hello and asks for my name",
      "Explain what a variable is in programming using a simple real-world analogy",
      "What is GitHub and why should I learn it as a student?",
    ],
  },
  {
    label: "AI Safety",
    prompts: [
      "What are 5 things AI gets wrong that I should watch out for?",
      "What personal information should I never share with AI?",
      "How do I fact-check something an AI tells me?",
    ],
  },
];

const MOCK_RESPONSES: Record<string, string> = {
  photosynthesis: `Photosynthesis is how plants make their own food using sunlight! 🌱

**Here's the simple version:**
1. Plants absorb **water** through their roots
2. Leaves pull in **carbon dioxide** (CO₂) from the air
3. Chlorophyll (the green stuff) captures **sunlight**
4. These are combined to make **sugar** — the plant's food!
5. **Oxygen** is released as a byproduct — that's what you breathe!

**Fun analogy:** Think of a plant like a solar-powered kitchen. Sunlight is the stove, water and CO₂ are the ingredients, and sugar is the meal.`,

  essay: `Here's a 5-paragraph essay outline on climate change:

**Introduction**
- Hook: Surprising climate fact (e.g., 2023 was the hottest year ever recorded)
- Thesis: Climate change is a serious threat that requires immediate action

**Body Paragraph 1: Causes**
- Burning fossil fuels (cars, factories, power plants)
- Deforestation removing CO₂-absorbing trees

**Body Paragraph 2: Effects**
- Rising sea levels threatening coastal cities
- More extreme weather events (storms, droughts, wildfires)

**Body Paragraph 3: Solutions**
- Renewable energy (solar, wind)
- Individual actions (reduce, reuse, recycle)

**Conclusion**
- Restate thesis + call to action`,

  default: `Great question! Here's a helpful response:

AI tools like me work by finding patterns in huge amounts of text data. When you ask something, I generate the most helpful response based on that training.

**Key tips for better results:**
- **Be specific** — instead of "help with math," say "help me solve 3x + 7 = 22 step by step"
- **Give context** — tell me your background, what the task is, and why you need help
- **Ask for format** — specify bullet points, numbered steps, or a specific length

Try adjusting your prompt and see how the answer changes. Experimentation is the best way to learn prompting!`,

  "good prompt": `Here are 5 tips for great AI prompts:

1. **Be specific** — "Explain gravity" → "Explain gravity to a 7th grader using a real-world analogy"
2. **Set a role** — "Act as a science teacher and explain..."
3. **Define format** — "Give me 5 bullet points" or "Write a 3-paragraph summary"
4. **Add context** — Tell AI who you are and what you need the answer for
5. **Iterate** — If the first response isn't great, refine your prompt and try again

**Bad prompt:** "write an essay"
**Great prompt:** "Write a 300-word persuasive essay about school lunch improvements, with 3 main arguments"`,

  python: `Here's your first Python program! 🐍

\`\`\`python
name = input("What's your name? ")
print("Hello, " + name + "! You just wrote your first Python program!")
\`\`\`

**What each line does:**
- \`input()\` — asks the user to type something and saves what they type
- \`name\` — a variable (a container) that stores the user's name
- \`print()\` — displays text on the screen

**To run this free:** Go to replit.com, click "Create Repl," choose Python, paste this in, and hit Run. 🎉`,

  variable: `A variable is like a labeled box that stores information.

**Real-world analogy:**
Imagine a box labeled "SCORE". You put the number 10 inside. Later you can look inside, change it, or use it in calculations.

In Python:
\`\`\`python
score = 10          # Create a box called "score" with 10 inside
score = score + 5   # Add 5 to whatever's in the box
print(score)        # Look inside the box → shows 15
\`\`\`

Variables can store numbers, words, true/false values — almost anything you want to remember.`,

  "ai gets wrong": `Here are 5 things AI gets wrong that you should watch out for:

1. **Hallucinations** — AI sometimes confidently states completely false facts. Always verify important claims.

2. **Outdated info** — AI has a knowledge cutoff date. It doesn't know about recent events or discoveries.

3. **Math errors** — AI is surprisingly bad at complex calculations. Use a real calculator for anything important.

4. **Bias** — AI learned from human-written text, which contains human biases. Be critical of opinions AI expresses.

5. **Fake sources** — AI sometimes makes up citations. Never use an AI-provided source without verifying it exists.

**Bottom line:** Use AI as a starting point, not a final answer. Always fact-check with trusted sources.`,
};

function getMockResponse(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (lower.includes("photosynthesis")) return MOCK_RESPONSES.photosynthesis;
  if (lower.includes("essay") || lower.includes("climate change") || lower.includes("outline")) return MOCK_RESPONSES.essay;
  if (lower.includes("good prompt") || lower.includes("better prompt") || (lower.includes("tips") && lower.includes("prompt"))) return MOCK_RESPONSES["good prompt"];
  if (lower.includes("python") || lower.includes("hello") || lower.includes("first program")) return MOCK_RESPONSES.python;
  if (lower.includes("variable")) return MOCK_RESPONSES.variable;
  if (lower.includes("gets wrong") || lower.includes("mistakes")) return MOCK_RESPONSES["ai gets wrong"];
  return MOCK_RESPONSES.default;
}

export default function PlaygroundPage() {
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [history, setHistory] = useState<{ prompt: string; response: string }[]>([]);

  function handleSubmit() {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResponse("");
    setTimeout(() => {
      const res = getMockResponse(prompt);
      setResponse(res);
      setHistory((prev) => [{ prompt, response: res }, ...prev].slice(0, 5));
      setLoading(false);
    }, 800 + Math.random() * 600);
  }

  function usePrompt(p: string) {
    setPrompt(p);
    setResponse("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div style={{ fontFamily: "-apple-system,'Inter',ui-sans-serif,system-ui,sans-serif" }}>

      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 className="font-bold text-[#cacaca]" style={{ fontSize: 24, letterSpacing: "-0.03em", lineHeight: 1.25 }}>
          Prompt Playground
        </h1>
        <p className="font-bold text-[#666666]" style={{ fontSize: 14, letterSpacing: "-0.016em", marginTop: 6 }}>
          Practice writing prompts with guided example responses — see how small changes affect the output.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">

        {/* Main: input + response + history */}
        <div className="lg:col-span-2 flex flex-col" style={{ gap: 12 }}>

          {/* Input card */}
          <div style={{ background: "rgba(18,18,20,0.72)", backdropFilter: "blur(20px)", border: "1px solid #343434", borderRadius: 20, padding: 24 }}>
            <label className="font-bold text-[#666666]" style={{ display: "block", fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>
              Your prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Type your prompt here… Try: 'Explain photosynthesis like I'm 10'"
              rows={4}
              className="w-full font-bold text-[#cacaca] resize-none focus:outline-none"
              style={{
                background: "#111111",
                border: "1px solid #343434",
                borderRadius: 12,
                padding: "12px 16px",
                fontSize: 13,
                letterSpacing: "-0.016em",
                lineHeight: 1.55,
                caretColor: "#ff4300",
              }}
              onFocus={(e) => { (e.target as HTMLElement).style.borderColor = "#ff4300"; }}
              onBlur={(e) => { (e.target as HTMLElement).style.borderColor = "#343434"; }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
              }}
            />
            <div className="flex items-center justify-between" style={{ marginTop: 12 }}>
              <span className="font-bold text-[#666666]" style={{ fontSize: 11, letterSpacing: "-0.011em" }}>
                Ctrl+Enter to send
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => { setPrompt(""); setResponse(""); }}
                  className="font-bold text-[#666666] hover:text-[#999999] transition-colors duration-150"
                  style={{ fontSize: 12, letterSpacing: "-0.011em", padding: "7px 12px", borderRadius: 10, background: "#111111" }}
                >
                  Clear
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!prompt.trim() || loading}
                  className="font-bold text-white active:scale-95 transition-all duration-150"
                  style={{
                    background: prompt.trim() && !loading ? "#ff4300" : "#343434",
                    borderRadius: 10,
                    padding: "7px 18px",
                    fontSize: 12,
                    letterSpacing: "-0.011em",
                    cursor: !prompt.trim() || loading ? "not-allowed" : "pointer",
                    opacity: !prompt.trim() || loading ? 0.5 : 1,
                  }}
                >
                  {loading ? "Thinking…" : "Send →"}
                </button>
              </div>
            </div>
          </div>

          {/* Response card */}
          {(loading || response) && (
            <div style={{ background: "rgba(18,18,20,0.72)", backdropFilter: "blur(20px)", border: "1px solid #343434", borderRadius: 20, padding: 24 }}>
              <div className="flex items-center gap-2" style={{ marginBottom: 16 }}>
                <span className="font-bold text-[#cacaca]" style={{ fontSize: 14, letterSpacing: "-0.016em" }}>AI Response</span>
                <span
                  className="font-bold text-[#666666]"
                  style={{ background: "#343434", borderRadius: 7, padding: "2px 8px", fontSize: 10, letterSpacing: "0.04em", textTransform: "uppercase" }}
                >
                  Simulated
                </span>
              </div>
              {loading ? (
                <div className="flex flex-col" style={{ gap: 10 }}>
                  {[75, 90, 60, 80, 45].map((w, i) => (
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
                      .replace(/```[\w]*\n([\s\S]*?)```/g, '<pre style="background:#111111;border:1px solid #343434;border-radius:10px;padding:14px;overflow-x:auto;margin:10px 0"><code style="color:#cacaca;font-size:0.8em;font-family:ui-monospace,monospace">$1</code></pre>')
                      .replace(/\n\n/g, '<br/><br/>')
                      .replace(/\n/g, '<br/>'),
                  }}
                />
              )}
            </div>
          )}

          {/* History */}
          {history.length > 1 && (
            <div style={{ background: "rgba(18,18,20,0.72)", backdropFilter: "blur(20px)", border: "1px solid #343434", borderRadius: 20, padding: 20 }}>
              <h3 className="font-bold text-[#666666]" style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: 10 }}>
                Recent prompts
              </h3>
              <div className="flex flex-col" style={{ gap: 4 }}>
                {history.slice(1).map((h, i) => (
                  <button
                    key={i}
                    onClick={() => usePrompt(h.prompt)}
                    className="w-full text-left font-bold text-[#666666] hover:text-[#999999] transition-colors duration-150 truncate"
                    style={{ background: "#111111", borderRadius: 10, padding: "8px 12px", fontSize: 12, letterSpacing: "-0.011em" }}
                  >
                    {h.prompt}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="flex flex-col" style={{ gap: 12 }}>

          {/* Example prompts */}
          <div style={{ background: "rgba(18,18,20,0.72)", backdropFilter: "blur(20px)", border: "1px solid #343434", borderRadius: 20, padding: 20 }}>
            <h3 className="font-bold text-[#cacaca]" style={{ fontSize: 13, letterSpacing: "-0.016em", marginBottom: 12 }}>
              Example prompts
            </h3>
            {/* Category tabs */}
            <div className="flex flex-wrap gap-1" style={{ marginBottom: 14 }}>
              {CATEGORIES.map((cat, i) => (
                <button
                  key={cat.label}
                  onClick={() => setActiveCategory(i)}
                  className="font-bold transition-all duration-150"
                  style={{
                    fontSize: 11,
                    letterSpacing: "-0.011em",
                    padding: "5px 10px",
                    borderRadius: 8,
                    ...(activeCategory === i
                      ? { background: "#ff4300", color: "#ffffff" }
                      : { background: "#343434", color: "#666666" }),
                  }}
                >
                  {cat.label}
                </button>
              ))}
            </div>
            <div className="flex flex-col" style={{ gap: 5 }}>
              {CATEGORIES[activeCategory].prompts.map((p) => (
                <button
                  key={p}
                  onClick={() => usePrompt(p)}
                  className="w-full text-left font-bold text-[#666666] hover:text-[#999999] transition-colors duration-150"
                  style={{
                    background: "#111111",
                    border: "1px solid #343434",
                    borderRadius: 10,
                    padding: "8px 12px",
                    fontSize: 11,
                    letterSpacing: "-0.011em",
                    lineHeight: 1.45,
                  }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Tip card */}
          <div style={{ background: "rgba(18,18,20,0.72)", backdropFilter: "blur(20px)", border: "1px solid #343434", borderRadius: 20, padding: 20 }}>
            <div
              className="font-bold text-[#666666]"
              style={{ background: "#343434", borderRadius: 7, padding: "3px 10px", fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase", display: "inline-flex", marginBottom: 10 }}
            >
              Prompt tip
            </div>
            <p className="font-bold text-[#999999]" style={{ fontSize: 12, letterSpacing: "-0.011em", lineHeight: 1.55 }}>
              Add <span style={{ color: "#cacaca" }}>"like I'm in [grade]"</span> or{" "}
              <span style={{ color: "#cacaca" }}>"explain step by step"</span> to any prompt to get a much better answer. Small changes, big difference.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
