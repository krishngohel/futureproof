"use client";

// VS Code + Claude Code UI mockup rendered inside the MacBook screen.
// Pixel dimensions target: ~496 × 368px (32rem lid, p-2 inset).

const C = {
  bg: "#1e1e1e",
  titleBar: "#323233",
  activityBar: "#333333",
  sidebar: "#252526",
  sidebarSection: "#1e1e1e",
  tabBar: "#2d2d2d",
  activeTab: "#1e1e1e",
  statusBar: "#007acc",
  text: "#cccccc",
  textDim: "#858585",
  comment: "#6a9955",
  keyword: "#569cd6",
  string: "#ce9178",
  fn: "#dcdcaa",
  type: "#4ec9b0",
  num: "#b5cea8",
  param: "#9cdcfe",
  punct: "#808080",
  claudeBg: "#1a1a2e",
  claudePanel: "#12122a",
  claudeMsg: "#252550",
  indigo: "#818cf8",
};

const s = (styles: React.CSSProperties) => styles;

const Kw = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: C.keyword }}>{children}</span>
);
const Str = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: C.string }}>{children}</span>
);
const Fn = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: C.fn }}>{children}</span>
);
const Cm = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: C.comment }}>{children}</span>
);
const Ty = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: C.type }}>{children}</span>
);
const Pm = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: C.param }}>{children}</span>
);
const Pu = ({ children }: { children: React.ReactNode }) => (
  <span style={{ color: C.punct }}>{children}</span>
);

function EditorLine({
  num,
  children,
  active,
}: {
  num: number;
  children?: React.ReactNode;
  active?: boolean;
}) {
  return (
    <div
      style={s({
        display: "flex",
        background: active ? "#2a2a2a" : "transparent",
        minHeight: 13,
      })}
    >
      <span
        style={s({
          color: active ? C.textDim : "#3e3e3e",
          minWidth: 28,
          textAlign: "right",
          paddingRight: 12,
          userSelect: "none",
          fontSize: 9,
          lineHeight: "13px",
        })}
      >
        {num}
      </span>
      <span
        style={s({
          color: C.text,
          fontSize: 9,
          lineHeight: "13px",
          whiteSpace: "pre",
          fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
        })}
      >
        {children ?? " "}
      </span>
    </div>
  );
}

function FileEntry({
  name,
  ext,
  indent = 0,
  active,
}: {
  name: string;
  ext?: string;
  indent?: number;
  active?: boolean;
}) {
  const extColor: Record<string, string> = {
    tsx: "#4ec9b0",
    ts: "#4ec9b0",
    css: "#ce9178",
    json: "#b5cea8",
    webp: "#dcdcaa",
    md: "#cccccc",
  };
  return (
    <div
      style={s({
        display: "flex",
        alignItems: "center",
        gap: 4,
        paddingLeft: 8 + indent * 10,
        paddingTop: 1,
        paddingBottom: 1,
        fontSize: 9,
        color: active ? "#ffffff" : C.text,
        background: active ? "#37373d" : "transparent",
        cursor: "default",
      })}
    >
      <span style={{ color: ext ? extColor[ext] ?? C.textDim : C.indigo, fontSize: 8 }}>
        {ext ? "◉" : "▾"}
      </span>
      <span>
        {name}
        {ext && <span style={{ color: C.textDim }}>.{ext}</span>}
      </span>
    </div>
  );
}

export default function VSCodeMockup() {
  return (
    <div
      style={s({
        width: "100%",
        height: "100%",
        background: C.bg,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        fontFamily: "system-ui, sans-serif",
        borderRadius: 6,
      })}
    >
      {/* ── Title bar ── */}
      <div
        style={s({
          background: C.titleBar,
          height: 22,
          display: "flex",
          alignItems: "center",
          padding: "0 12px",
          gap: 6,
          flexShrink: 0,
        })}
      >
        <span style={{ fontSize: 9, background: "#ff5f57", borderRadius: "50%", width: 8, height: 8, display: "inline-block" }} />
        <span style={{ fontSize: 9, background: "#febc2e", borderRadius: "50%", width: 8, height: 8, display: "inline-block" }} />
        <span style={{ fontSize: 9, background: "#28c840", borderRadius: "50%", width: 8, height: 8, display: "inline-block" }} />
        <span style={{ flex: 1, textAlign: "center", color: C.textDim, fontSize: 9 }}>
          page.tsx — futureproof — Visual Studio Code
        </span>
      </div>

      {/* ── Tab bar ── */}
      <div
        style={s({
          background: C.tabBar,
          height: 24,
          display: "flex",
          alignItems: "stretch",
          flexShrink: 0,
          borderBottom: `1px solid #252526`,
        })}
      >
        {[
          { label: "page.tsx", active: true, color: C.type },
          { label: "scroll-frame-background.tsx", active: false, color: C.type },
          { label: "macbook-scroll.tsx", active: false, color: C.type },
        ].map(({ label, active, color }) => (
          <div
            key={label}
            style={s({
              padding: "0 10px",
              fontSize: 9,
              display: "flex",
              alignItems: "center",
              gap: 5,
              background: active ? C.activeTab : C.tabBar,
              color: active ? C.text : C.textDim,
              borderRight: "1px solid #252526",
              borderTop: active ? "1px solid #007acc" : "1px solid transparent",
              whiteSpace: "nowrap",
            })}
          >
            <span style={{ color, fontSize: 7 }}>◉</span>
            {label}
          </div>
        ))}
      </div>

      {/* ── Main area ── */}
      <div style={s({ display: "flex", flex: 1, overflow: "hidden" })}>

        {/* Activity bar */}
        <div
          style={s({
            background: C.activityBar,
            width: 32,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: 6,
            gap: 10,
          })}
        >
          {["⬚", "🔍", "⎊", "⬡", "⚙"].map((icon, i) => (
            <span key={i} style={{ fontSize: i === 0 ? 11 : 10, opacity: i === 0 ? 1 : 0.45, cursor: "default" }}>
              {icon}
            </span>
          ))}
        </div>

        {/* Sidebar — file explorer */}
        <div
          style={s({
            background: C.sidebar,
            width: 120,
            flexShrink: 0,
            overflow: "hidden",
            borderRight: "1px solid #141414",
          })}
        >
          <div
            style={s({
              color: C.textDim,
              fontSize: 8,
              fontWeight: 700,
              letterSpacing: "0.08em",
              padding: "6px 8px 4px",
              textTransform: "uppercase",
            })}
          >
            Explorer
          </div>
          <FileEntry name="FUTUREPROOF" indent={0} />
          <FileEntry name="app" indent={1} />
          <FileEntry name="page" ext="tsx" indent={2} active />
          <FileEntry name="layout" ext="tsx" indent={2} />
          <FileEntry name="globals" ext="css" indent={2} />
          <FileEntry name="components" indent={1} />
          <FileEntry name="ui" indent={2} />
          <FileEntry name="scroll-frame-background" ext="tsx" indent={3} />
          <FileEntry name="macbook-scroll" ext="tsx" indent={3} />
          <FileEntry name="vscode-mockup" ext="tsx" indent={3} />
          <FileEntry name="lib" indent={1} />
          <FileEntry name="utils" ext="ts" indent={2} />
          <FileEntry name="modules-data" ext="ts" indent={2} />
          <FileEntry name="public" indent={1} />
          <FileEntry name="frames" indent={2} />
          <div style={{ paddingLeft: 30, paddingTop: 2, fontSize: 8, color: C.textDim }}>
            frame_0001.webp … 0192
          </div>
        </div>

        {/* Editor */}
        <div
          style={s({
            flex: 1,
            background: C.bg,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          })}
        >
          <div style={s({ flex: 1, overflow: "hidden", padding: "4px 0" })}>
            <EditorLine num={1}><Cm>{"// Futureproof — AI Literacy Platform"}</Cm></EditorLine>
            <EditorLine num={2} />
            <EditorLine num={3}><Kw>{"\"use client\""}</Kw><Pu>{";"}</Pu></EditorLine>
            <EditorLine num={4} />
            <EditorLine num={5}><Kw>import</Kw>{" { "}<Pm>useState</Pm>{" } "}<Kw>from</Kw>{" "}<Str>{"\"react\""}</Str><Pu>;</Pu></EditorLine>
            <EditorLine num={6}><Kw>import</Kw>{" "}<Ty>ScrollFrameBackground</Ty></EditorLine>
            <EditorLine num={7}>{"  "}<Kw>from</Kw>{" "}<Str>{"\"@/components/ui/scroll-frame\""}</Str><Pu>;</Pu></EditorLine>
            <EditorLine num={8}><Kw>import</Kw>{" { "}<Ty>MacbookScroll</Ty>{" }"}</EditorLine>
            <EditorLine num={9}>{"  "}<Kw>from</Kw>{" "}<Str>{"\"@/components/ui/macbook-scroll\""}</Str><Pu>;</Pu></EditorLine>
            <EditorLine num={10} />
            <EditorLine num={11}><Kw>export default function</Kw>{" "}<Fn>LandingPage</Fn><Pu>{"() {"}</Pu></EditorLine>
            <EditorLine num={12} active>{"  "}<Kw>const</Kw>{" ["}<Pm>open</Pm>{", "}<Pm>setOpen</Pm>{"] = "}<Fn>useState</Fn><Pu>{"("}</Pu><Kw>false</Kw><Pu>{");"}</Pu></EditorLine>
            <EditorLine num={13} />
            <EditorLine num={14}>{"  "}<Kw>return</Kw>{" ("}</EditorLine>
            <EditorLine num={15}>{"    <"}<Ty>div</Ty>{" "}<Pm>className</Pm>{<span style={{color:C.string}}>="min-h-screen"</span>}{">"}</EditorLine>
            <EditorLine num={16}>{"      <"}<Ty>ScrollFrameBackground</Ty></EditorLine>
            <EditorLine num={17}>{"        "}<Pm>endId</Pm>{"="}<Str>{"\"about\""}</Str></EditorLine>
            <EditorLine num={18}>{"      />"}</EditorLine>
            <EditorLine num={19}>{"      <"}<Ty>MacbookScroll</Ty></EditorLine>
            <EditorLine num={20}>{"        "}<Pm>screenContent</Pm>{"={<"}<Ty>VSCodeMockup</Ty>{" />}"}</EditorLine>
            <EditorLine num={21}>{"      />"}</EditorLine>
          </div>
        </div>

        {/* Claude Code panel */}
        <div
          style={s({
            background: C.claudeBg,
            width: 148,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid #2a2a4a",
          })}
        >
          {/* Panel header */}
          <div
            style={s({
              background: C.claudePanel,
              padding: "5px 8px",
              fontSize: 9,
              color: C.indigo,
              fontWeight: 700,
              borderBottom: "1px solid #2a2a4a",
              display: "flex",
              alignItems: "center",
              gap: 5,
            })}
          >
            <span style={{ fontSize: 11 }}>✦</span> Claude Code
          </div>

          {/* Chat messages */}
          <div style={s({ flex: 1, overflow: "hidden", padding: "6px 6px 0" })}>
            {/* Claude message */}
            <div
              style={s({
                background: C.claudeMsg,
                borderRadius: 6,
                padding: "5px 7px",
                marginBottom: 6,
                fontSize: 8,
                color: "#a5b4fc",
                lineHeight: "1.45",
                border: "1px solid #2e2e60",
              })}
            >
              <div style={{ color: C.indigo, fontWeight: 700, marginBottom: 3, fontSize: 8 }}>
                ✦ Claude
              </div>
              I've extracted 192 frames from your video and wired up the scroll-driven canvas animation.
              <br /><br />
              The animation now plays only through the hero + about sections — capped to{" "}
              <span style={{ color: C.type, fontFamily: "monospace" }}>id="about"</span>
              {" "}element bottom.
            </div>

            {/* User message */}
            <div
              style={s({
                background: "#1e2a1e",
                borderRadius: 6,
                padding: "5px 7px",
                marginBottom: 6,
                fontSize: 8,
                color: "#86efac",
                lineHeight: "1.45",
                border: "1px solid #1a3a1a",
              })}
            >
              <div style={{ color: "#4ade80", fontWeight: 700, marginBottom: 3, fontSize: 8 }}>
                You
              </div>
              now add the macbook scroll with a vscode mockup on the screen
            </div>

            {/* Claude typing */}
            <div
              style={s({
                background: C.claudeMsg,
                borderRadius: 6,
                padding: "5px 7px",
                fontSize: 8,
                color: "#a5b4fc",
                lineHeight: "1.45",
                border: "1px solid #2e2e60",
              })}
            >
              <div style={{ color: C.indigo, fontWeight: 700, marginBottom: 3, fontSize: 8 }}>
                ✦ Claude
              </div>
              <span style={{ color: C.fn }}>VSCodeMockup</span> component created with syntax-highlighted editor, file explorer, and Claude Code chat panel.
              <br /><br />
              Passing it as{" "}
              <span style={{ color: C.type, fontFamily: "monospace" }}>screenContent</span>
              {" "}into MacbookScroll…
              <br />
              <span style={{ color: C.textDim }}>▋</span>
            </div>
          </div>

          {/* Input area */}
          <div
            style={s({
              margin: "6px",
              background: "#0d0d24",
              borderRadius: 5,
              border: "1px solid #2a2a4a",
              padding: "4px 6px",
              fontSize: 8,
              color: C.textDim,
              display: "flex",
              alignItems: "center",
              gap: 4,
            })}
          >
            <span style={{ flex: 1 }}>Ask Claude anything…</span>
            <span style={{ color: C.indigo, fontSize: 10 }}>⏎</span>
          </div>
        </div>
      </div>

      {/* ── Status bar ── */}
      <div
        style={s({
          background: C.statusBar,
          height: 16,
          display: "flex",
          alignItems: "center",
          padding: "0 8px",
          gap: 12,
          flexShrink: 0,
        })}
      >
        {[
          "⎇ main",
          "◉ 0 ⚠ 0",
          "TypeScript",
          "Ln 12, Col 32",
          "UTF-8",
          "✦ Claude Code",
        ].map((item) => (
          <span key={item} style={{ fontSize: 8, color: "rgba(255,255,255,0.9)", whiteSpace: "nowrap" }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
