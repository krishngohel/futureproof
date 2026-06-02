"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { INITIAL_FILES } from "@/lib/ide/initial-files";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center" style={{ background: "rgba(8,8,10,0.92)" }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{ width: 24, height: 24, border: "2px solid #2a2a2c", borderTopColor: "#ff4300", borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
        <span style={{ color: "#444", fontSize: 12, fontFamily: "monospace", letterSpacing: "0.05em" }}>loading editor…</span>
      </div>
    </div>
  ),
});

// ── Types ──────────────────────────────────────────────────────────────────────

interface VirtualFile {
  name: string;
  path: string;
  content: string;
  language: string;
  isNew?: boolean;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
}

interface TerminalLine {
  text: string;
  type: "command" | "output" | "error" | "info" | "success";
  key: number;
}

interface FileWrite {
  path: string;
  content: string;
}

interface AIResponse {
  text: string;
  writes: FileWrite[];
  runFile?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function detectLanguage(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const map: Record<string, string> = {
    js: "javascript", ts: "typescript", jsx: "javascript", tsx: "typescript",
    py: "python", html: "html", css: "css", json: "json", md: "markdown",
    txt: "plaintext", sh: "shell", yml: "yaml", yaml: "yaml",
    rs: "rust", go: "go", java: "java", c: "c", cpp: "cpp",
  };
  return map[ext] ?? "plaintext";
}

function getFileIcon(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  const icons: Record<string, string> = {
    js: "⬡", ts: "TS", jsx: "⚛", tsx: "⚛", py: "Py",
    html: "◇", css: "◈", json: "{}", md: "M↓", txt: "T",
    sh: "$", yml: "∷", yaml: "∷", rs: "Rs", go: "Go",
  };
  return icons[ext] ?? "·";
}

async function runJavaScriptAsync(code: string): Promise<{ output: string[]; error?: string }> {
  const output: string[] = [];
  const orig = { log: console.log, error: console.error, warn: console.warn, info: console.info };
  // Keep console captured for the full duration including async continuations
  console.log = (...a: unknown[]) => output.push(a.map(v => typeof v === "object" ? JSON.stringify(v, null, 2) : String(v)).join(" "));
  console.error = (...a: unknown[]) => output.push("✗ " + a.map(String).join(" "));
  console.warn = (...a: unknown[]) => output.push("⚠ " + a.map(String).join(" "));
  console.info = (...a: unknown[]) => output.push("· " + a.map(String).join(" "));
  try {
    const fn = new Function(`return (async function __run__(){${code}})()`);
    await (fn() as Promise<void>);
  } catch (e) {
    Object.assign(console, orig);
    return { output, error: e instanceof Error ? e.message : String(e) };
  }
  Object.assign(console, orig);
  return { output };
}

// INITIAL_FILES imported from @/lib/ide/initial-files

// ── Code Snippets ─────────────────────────────────────────────────────────────

const SNIPPETS: Record<string, { path: string; content: string }> = {
  todo: {
    path: "todo.js",
    content: `// Todo List Application

class TodoList {
  constructor() { this.todos = []; this.nextId = 1; }

  add(title) {
    const todo = { id: this.nextId++, title, done: false };
    this.todos.push(todo);
    console.log(\`✓ Added: "\${title}" (id: \${todo.id})\`);
    return todo;
  }

  complete(id) {
    const todo = this.todos.find(t => t.id === id);
    if (!todo) return console.log(\`✗ Todo #\${id} not found\`);
    todo.done = true;
    console.log(\`✓ Completed: "\${todo.title}"\`);
  }

  delete(id) {
    const idx = this.todos.findIndex(t => t.id === id);
    if (idx === -1) return console.log(\`✗ Todo #\${id} not found\`);
    const [rem] = this.todos.splice(idx, 1);
    console.log(\`✗ Deleted: "\${rem.title}"\`);
  }

  list(type = "all") {
    console.log(\`\\n[\${type}]\`);
    const items = type === "active" ? this.todos.filter(t => !t.done)
      : type === "completed" ? this.todos.filter(t => t.done)
      : this.todos;
    if (!items.length) return console.log("  (empty)");
    items.forEach(t => console.log(\`  [\${t.done ? "✓" : " "}] #\${t.id} \${t.title}\`));
  }

  summary() {
    const done = this.todos.filter(t => t.done).length;
    const pct = this.todos.length ? Math.round(done / this.todos.length * 100) : 0;
    console.log(\`\\n\${done}/\${this.todos.length} done (\${pct}%)\`);
  }
}

const list = new TodoList();
console.log("=== Todo List Demo ===\\n");
list.add("Learn JavaScript fundamentals");
list.add("Build a project with Claude");
list.add("Study async/await");
list.add("Practice array methods");

list.complete(1);
list.complete(3);
list.delete(4);
list.list("all");
list.list("active");
list.list("completed");
list.summary();
`,
  },
  snake: {
    path: "snake.js",
    content: `// 🐍 Snake Game — core logic demo

class SnakeGame {
  constructor(size = 10) {
    this.size = size;
    const mid = Math.floor(size / 2);
    this.snake = [{ x: mid, y: mid }];
    this.dir = { x: 1, y: 0 };
    this.food = this.spawnFood();
    this.score = 0;
    this.alive = true;
  }

  spawnFood() {
    let pos;
    do { pos = { x: Math.floor(Math.random() * this.size), y: Math.floor(Math.random() * this.size) }; }
    while (this.snake.some(s => s.x === pos.x && s.y === pos.y));
    return pos;
  }

  step(dx, dy) {
    if (!this.alive) return;
    if (dx !== undefined && (dx !== -this.dir.x || dy !== -this.dir.y)) this.dir = { x: dx, y: dy };
    const head = { x: (this.snake[0].x + this.dir.x + this.size) % this.size, y: (this.snake[0].y + this.dir.y + this.size) % this.size };
    if (this.snake.some(s => s.x === head.x && s.y === head.y)) { this.alive = false; return; }
    this.snake.unshift(head);
    if (head.x === this.food.x && head.y === this.food.y) { this.score++; this.food = this.spawnFood(); }
    else this.snake.pop();
  }

  render() {
    return Array.from({ length: this.size }, (_, y) =>
      Array.from({ length: this.size }, (_, x) => {
        if (x === this.food.x && y === this.food.y) return "🍎";
        if (this.snake[0].x === x && this.snake[0].y === y) return "🟩";
        if (this.snake.some(s => s.x === x && s.y === y)) return "🟢";
        return "⬛";
      }).join("")
    ).join("\\n");
  }
}

const game = new SnakeGame(10);
console.log("🐍 Snake (10×10)\\n");
console.log(game.render());

[[1,0],[1,0],[0,1],[0,1],[-1,0]].forEach(([dx, dy], i) => {
  game.step(dx, dy);
  console.log(\`\\nMove \${i+1} → score: \${game.score}\`);
});
console.log(game.render());
console.log(\`\\n\${game.alive ? "Still going!" : "Game over."} Final score: \${game.score}\`);
`,
  },
  sorting: {
    path: "sorting.js",
    content: `// Sorting Algorithms Benchmark

const bubbleSort = arr => { const a=[...arr]; for(let i=0;i<a.length;i++) for(let j=0;j<a.length-i-1;j++) if(a[j]>a[j+1])[a[j],a[j+1]]=[a[j+1],a[j]]; return a; };
const selectionSort = arr => { const a=[...arr]; for(let i=0;i<a.length;i++){let m=i; for(let j=i+1;j<a.length;j++) if(a[j]<a[m])m=j; [a[i],a[m]]=[a[m],a[i]];} return a; };
const quickSort = arr => arr.length<=1?arr:[...quickSort(arr.filter(x=>x<arr[Math.floor(arr.length/2)])),...arr.filter(x=>x===arr[Math.floor(arr.length/2)]),...quickSort(arr.filter(x=>x>arr[Math.floor(arr.length/2)]))];
const mergeSort = arr => { if(arr.length<=1)return arr; const mid=Math.floor(arr.length/2),merge=(l,r)=>{const res=[];let i=0,j=0;while(i<l.length&&j<r.length)res.push(l[i]<=r[j]?l[i++]:r[j++]);return[...res,...l.slice(i),...r.slice(j)];}; return merge(mergeSort(arr.slice(0,mid)),mergeSort(arr.slice(mid))); };

function bench(name, fn, arr) {
  const t = performance.now();
  for (let i = 0; i < 500; i++) fn(arr);
  const ms = ((performance.now() - t) / 500).toFixed(3);
  console.log(\`\${name.padEnd(18)}\${ms}ms  →  [\${fn(arr).join(", ")}]\`);
}

const data = [64, 34, 25, 12, 22, 11, 90, 5, 47, 31, 8, 73];
console.log("Input: [" + data.join(", ") + "]\\n");
bench("Bubble Sort:", bubbleSort, data);
bench("Selection Sort:", selectionSort, data);
bench("Quick Sort:", quickSort, data);
bench("Merge Sort:", mergeSort, data);
`,
  },
  async: {
    path: "async-demo.js",
    content: `// Async/Await Examples

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

async function fetchUser(id) {
  await delay(10);
  const db = { 1: "Alice", 2: "Bob", 3: "Carol" };
  if (!db[id]) throw new Error(\`User \${id} not found\`);
  return { id, name: db[id] };
}

async function fetchPosts(userId) {
  await delay(5);
  return [{ id: 1, title: \`Post by user \${userId}\` }];
}

async function example1() {
  console.log("=== 1. Sequential awaits ===");
  const user = await fetchUser(1);
  console.log("User:", user.name);
  const posts = await fetchPosts(user.id);
  console.log("Posts:", posts.length);
}

async function example2() {
  console.log("\\n=== 2. Parallel (Promise.all) ===");
  const [u1, u2, u3] = await Promise.all([fetchUser(1), fetchUser(2), fetchUser(3)]);
  console.log("All loaded:", u1.name, u2.name, u3.name);
}

async function example3() {
  console.log("\\n=== 3. Error handling ===");
  try { await fetchUser(99); }
  catch (e) { console.log("Caught:", e.message); }
}

(async () => {
  await example1();
  await example2();
  await example3();
  console.log("\\n✓ All examples complete!");
})();
`,
  },
  closures: {
    path: "closures.js",
    content: `// Closures in JavaScript

function makeCounter(start = 0, step = 1) {
  let n = start;
  return { inc: () => (n += step), dec: () => (n -= step), reset: () => (n = start), get: () => n };
}

const c = makeCounter(0, 2);
console.log("=== Counter (step 2) ===");
[...Array(4)].forEach(() => console.log(c.inc()));
console.log("reset →", c.reset());

function memoize(fn) {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) cache.set(key, fn(...args));
    return cache.get(key);
  };
}

const fib = memoize(function f(n) { return n <= 1 ? n : fib(n-1) + fib(n-2); });
console.log("\\n=== Fibonacci (memoized) ===");
[10, 15, 20, 30].forEach(n => console.log(\`fib(\${n}) = \${fib(n)}\`));

function BankAccount(initial) {
  let balance = initial;
  return {
    deposit: n => { balance += n; console.log(\`+\${n} → \${balance}\`); },
    withdraw: n => { if (n > balance) return console.log("Insufficient funds!"); balance -= n; console.log(\`-\${n} → \${balance}\`); },
    getBalance: () => balance,
  };
}
console.log("\\n=== Bank Account ===");
const acc = BankAccount(100);
acc.deposit(50);
acc.withdraw(30);
acc.withdraw(200);
console.log("Balance:", acc.getBalance());
`,
  },
};

// ── AI Response Engine ─────────────────────────────────────────────────────────

function generateAIResponse(msg: string, files: VirtualFile[], activeFile: VirtualFile | null): AIResponse {
  const low = msg.toLowerCase();
  const writes: FileWrite[] = [];

  if (/python/.test(low) && /(?:creat|build|make|write|demo|show|example)/.test(low)) {
    writes.push({
      path: "main.py",
      content: `# Python Demo\n\ndef greet(name):\n    return f"Hello, {name}!"\n\n# List comprehension\nsquares = [x**2 for x in range(1, 11)]\nprint("Squares:", squares)\n\n# Classes\nclass Animal:\n    def __init__(self, name, sound):\n        self.name = name\n        self.sound = sound\n\n    def speak(self):\n        return f"{self.name} says {self.sound}!"\n\ndog = Animal("Dog", "Woof")\ncat = Animal("Cat", "Meow")\nprint(dog.speak())\nprint(cat.speak())\n\n# Dictionary\nscores = {"Alice": 95, "Bob": 87, "Carol": 92}\ntop = max(scores, key=scores.get)\nprint(f"Top scorer: {top} with {scores[top]}")\n\nprint(greet("Futureproof"))\n`,
    });
    return { text: "Created `main.py` with a Python demo!\n\nCovers:\n- Functions and f-strings\n- List comprehensions\n- Classes and objects\n- Dictionaries\n\nPress **▶ Run** — runs via Python 3.10 on the server!", writes, runFile: "main.py" };
  }

  if (/(?:todo|task list)/.test(low) && /(?:creat|build|make|write)/.test(low)) {
    writes.push(SNIPPETS.todo);
    return { text: "Built a **Todo List** app in `todo.js`!\n\nFeatures:\n- `add(title)` — add a task\n- `complete(id)` — mark done\n- `delete(id)` — remove\n- `list('active' | 'completed')` — filter view\n- `summary()` — progress stats\n\nPress **▶ Run** to see the demo!", writes };
  }

  if (/snake/.test(low) && /(?:creat|build|make|write)/.test(low)) {
    const snakeHtml = `<!DOCTYPE html>\n<html>\n<head>\n  <title>Snake</title>\n  <style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0d0d0e;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:monospace;color:#cacaca;gap:14px}h1{font-size:14px;letter-spacing:.12em;text-transform:uppercase;color:#555}canvas{border:1px solid #2a2a2c;background:#111;display:block}#hud{display:flex;gap:32px;font-size:12px;color:#555}#hud span{color:#cacaca}#msg{color:#f87171;font-size:12px;height:16px}#restart{display:none;padding:6px 20px;background:#1a1a1c;border:1px solid #2a2a2c;color:#cacaca;cursor:pointer;border-radius:6px;font-family:monospace;font-size:11px}#restart:hover{border-color:#ff4300;color:#ff4300}</style>\n</head>\n<body>\n  <h1>Snake</h1>\n  <div id="hud"><div>Score: <span id="score">0</span></div><div>Best: <span id="best">0</span></div></div>\n  <canvas id="c" width="400" height="400"></canvas>\n  <div id="msg">Arrow keys to move</div>\n  <button id="restart" onclick="init()">Restart</button>\n  <script>\n    const G=20,S=20,cvs=document.getElementById("c"),ctx=cvs.getContext("2d");\n    let snake,dir,nDir,food,score,best=0,alive,raf;\n    function rnd(){return Math.floor(Math.random()*G);}\n    function spawn(){let p;do{p={x:rnd(),y:rnd()}}while(snake.some(s=>s.x===p.x&&s.y===p.y));return p;}\n    function init(){\n      snake=[{x:10,y:10}];dir={x:1,y:0};nDir={x:1,y:0};\n      food=spawn();score=0;alive=true;\n      document.getElementById("score").textContent=0;\n      document.getElementById("msg").textContent="Arrow keys to move";\n      document.getElementById("restart").style.display="none";\n      cancelAnimationFrame(raf);loop();\n    }\n    let last=0;\n    function loop(ts=0){\n      raf=requestAnimationFrame(loop);\n      if(ts-last<120)return;last=ts;\n      if(!alive)return;\n      dir=nDir;\n      const h={x:(snake[0].x+dir.x+G)%G,y:(snake[0].y+dir.y+G)%G};\n      if(snake.some(s=>s.x===h.x&&s.y===h.y)){alive=false;best=Math.max(best,score);document.getElementById("best").textContent=best;document.getElementById("msg").textContent="Game over!";document.getElementById("restart").style.display="inline-block";return;}\n      snake.unshift(h);\n      if(h.x===food.x&&h.y===food.y){score++;food=spawn();document.getElementById("score").textContent=score;}else snake.pop();\n      draw();\n    }\n    function draw(){\n      ctx.fillStyle="#111";ctx.fillRect(0,0,400,400);\n      ctx.fillStyle="#ff4300";ctx.beginPath();ctx.roundRect(food.x*S+3,food.y*S+3,S-6,S-6,3);ctx.fill();\n      snake.forEach((s,i)=>{ctx.fillStyle=i===0?"#4ade80":"#22c55e";ctx.beginPath();ctx.roundRect(s.x*S+1,s.y*S+1,S-2,S-2,i===0?4:2);ctx.fill();});\n    }\n    document.addEventListener("keydown",e=>{\n      const k={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0}};\n      if(k[e.key]&&(k[e.key].x!=-dir.x||k[e.key].y!=-dir.y)){nDir=k[e.key];e.preventDefault();}\n      if(e.key===" "&&!alive)init();\n    });\n    init();\n  <\/script>\n</body>\n</html>`;
    writes.push({ path: "snake.html", content: snakeHtml });
    return { text: "Built a **playable Snake game** in `snake.html`!\n\n**Controls:** Arrow keys\n\nOpening preview now — click inside the preview panel first to capture keyboard input.", writes, runFile: "snake.html" };
  }

  if (/sort/.test(low) && /(?:creat|build|make|write|demo|show)/.test(low)) {
    writes.push(SNIPPETS.sorting);
    return { text: "Created a **Sorting Algorithms** benchmark in `sorting.js`!\n\n- **Bubble Sort** — O(n²)\n- **Selection Sort** — O(n²)\n- **Quick Sort** — O(n log n) avg\n- **Merge Sort** — O(n log n) stable\n\nRuns 500 iterations each and shows average time. Press **▶ Run**!", writes };
  }

  const fileMatch = msg.match(/(?:creat|make|write|add)\s+(?:a\s+)?(?:new\s+)?(?:file\s+(?:called\s+)?)?([a-z0-9_\-]+\.[a-z]+)/i);
  if (fileMatch) {
    const fn = fileMatch[1];
    const lang = detectLanguage(fn);
    let content = `// ${fn}\nconsole.log("${fn} loaded!");\n`;
    if (lang === "python") content = `# ${fn}\n\nprint("Hello from ${fn}!")\n`;
    else if (lang === "html") content = `<!DOCTYPE html>\n<html>\n<head><title>${fn}</title></head>\n<body>\n  <h1>Hello!</h1>\n  <script>console.log("${fn} loaded")<\/script>\n</body>\n</html>\n`;
    else if (lang === "json") content = `{\n  "name": "my-project",\n  "version": "1.0.0"\n}\n`;
    else if (lang === "css") content = `/* ${fn} */\nbody { font-family: system-ui; }\n`;
    else if (lang === "markdown") content = `# ${fn.replace(".md","")}\n\nAdd content here.\n`;
    writes.push({ path: fn, content });
    return { text: `Created \`${fn}\`! Open in the editor.${lang === "javascript" ? " Press **▶ Run** to execute it." : ""}`, writes };
  }

  if (activeFile && /(?:add|improve|fix)\s+(?:error\s+handling|try.?catch)/i.test(msg)) {
    const updated = activeFile.content.replace(/^(function\s+\w+\s*\([^)]*\)\s*\{)/gm, (m) => `${m}\n  if (!arguments.length) throw new Error("Arguments required");`) + "\n// Error handling added\n";
    writes.push({ path: activeFile.path, content: updated });
    return { text: `Updated \`${activeFile.name}\` with error handling:\n- Input validation checks\n- Descriptive error messages\n\nChanges are live in the editor!`, writes };
  }

  if (activeFile && /(?:add|write)\s+(?:comments?|docs?|jsdoc)/i.test(msg)) {
    const commented = activeFile.content.replace(/^(function\s+(\w+)\s*\(([^)]*)\))/gm, (m, full, name, params) => {
      const paramDocs = params.trim() ? params.split(",").map((p: string) => ` * @param ${p.trim()}`).join("\n") : "";
      return `/**\n * ${name}\n${paramDocs}\n * @returns {*}\n */\n${full}`;
    });
    writes.push({ path: activeFile.path, content: commented });
    return { text: `Added JSDoc comments to \`${activeFile.name}\`. Every function now has parameter documentation.`, writes };
  }

  if (/snake.*html|html.*snake/i.test(msg)) {
    writes.push({ path: "snake.html", content: `<!DOCTYPE html>\n<html>\n<head>\n  <title>Snake</title>\n  <style>body{background:#0d0d0e;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;margin:0;font-family:monospace;color:#cacaca}canvas{border:1px solid #2a2a2c;background:#111}#score{margin:12px 0;font-size:16px;color:#ff4300}#msg{color:#f87171;height:20px;font-size:13px}</style>\n</head>\n<body>\n  <div id="score">Score: 0</div>\n  <canvas id="c" width="400" height="400"></canvas>\n  <div id="msg"></div>\n  <script>\n    const G=20,S=400/G,cvs=document.getElementById("c"),ctx=cvs.getContext("2d");\n    let snake=[{x:10,y:10}],dir={x:1,y:0},nDir={x:1,y:0},food={x:5,y:5},score=0,alive=true;\n    function spawn(){let p;do{p={x:Math.floor(Math.random()*G),y:Math.floor(Math.random()*G)}}while(snake.some(s=>s.x===p.x&&s.y===p.y));return p;}\n    function draw(){ctx.fillStyle="#111";ctx.fillRect(0,0,400,400);ctx.fillStyle="#ff4300";ctx.fillRect(food.x*S+2,food.y*S+2,S-4,S-4);snake.forEach((s,i)=>{ctx.fillStyle=i===0?"#4ade80":"#22c55e";ctx.fillRect(s.x*S+1,s.y*S+1,S-2,S-2);});}\n    function step(){if(!alive)return;dir=nDir;const h={x:(snake[0].x+dir.x+G)%G,y:(snake[0].y+dir.y+G)%G};if(snake.some(s=>s.x===h.x&&s.y===h.y)){alive=false;document.getElementById("msg").textContent="Game Over! Refresh to restart.";return;}snake.unshift(h);if(h.x===food.x&&h.y===food.y){score++;food=spawn();document.getElementById("score").textContent="Score: "+score;}else snake.pop();}\n    document.addEventListener("keydown",e=>{const k={ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0}};if(k[e.key]&&(k[e.key].x!=-dir.x||k[e.key].y!=-dir.y)){nDir=k[e.key];e.preventDefault();}});\n    setInterval(()=>{step();draw();},120);draw();\n  <\/script>\n</body>\n</html>` });
    return { text: "Created `snake.html` — a fully playable Snake!\n\n**Controls:** Arrow keys\n\nOpen in your browser to play. Features: 400×400 canvas, wall wrapping, score tracking.", writes };
  }

  if (/async|await|promise/i.test(msg) && /(?:explain|what|how|show)/i.test(msg)) {
    writes.push(SNIPPETS.async);
    return { text: "**Async/Await** — clean syntax for asynchronous code.\n\n```js\nasync function getUser() {\n  const user = await fetchFromDB();\n  return user.name;\n}\n```\n\n**Key rules:**\n1. Functions need `async` to use `await`\n2. `await` pauses only the current function\n3. Wrap in `try/catch` for errors\n4. Use `Promise.all()` for parallel calls\n\nCreated `async-demo.js` with 3 examples. **Press ▶ Run**!", writes };
  }

  if (/closure/i.test(msg) && /(?:explain|what|how|show)/i.test(msg)) {
    writes.push(SNIPPETS.closures);
    return { text: '**Closures** — functions that remember variables from their creation scope.\n\n```js\nfunction makeCounter() {\n  let count = 0;\n  return () => ++count; // captures count\n}\nconst c = makeCounter();\nc(); // 1\nc(); // 2 — count persists!\n```\n\n**Uses:** factory functions, memoization, private state.\n\nCreated `closures.js` with 3 examples. Run it!', writes };
  }

  if (/(?:explain|what is).*(?:this file|this code|current)/i.test(msg) && activeFile) {
    const fnCount = (activeFile.content.match(/function\s+\w+|=>\s*[\{\(]/g) ?? []).length;
    const lineCount = activeFile.content.split("\n").filter(l => l.trim()).length;
    return { text: `**\`${activeFile.name}\`** — ${lineCount} lines, ${fnCount} functions.\n\nLanguage: ${activeFile.language}\n\nAsk me to add comments, add error handling, or explain a specific part!`, writes: [] };
  }

  if (/^(?:run|go|execute)[.!?\s]*$/i.test(msg.trim()) || /run\s+(?:it|this)/i.test(msg)) {
    return { text: `Running \`${activeFile?.name ?? "file"}\`…`, writes: [], runFile: activeFile?.path };
  }

  return {
    text: `I can help with that! Try:\n\n**Create:**\n- "Create a todo app"\n- "Build a snake game"\n- "Make a sorting demo"\n\n**Explain:**\n- "How does async/await work?"\n- "Explain closures"\n\n**Edit:**\n- "Add error handling to ${activeFile?.name ?? "calculator.js"}"\n- "Add comments to this file"\n\n**Run:** Press **▶ Run** or type "run"\n\nWhat would you like?`,
    writes: [],
  };
}

// ── Main Component ────────────────────────────────────────────────────────────

interface IDEClientProps {
  userId: string;
  projectId: string;
  savedFiles: Array<{ name: string; path: string; content: string; language: string }>;
}

export default function IDEClient({ userId, projectId, savedFiles }: IDEClientProps) {
  const startFiles: VirtualFile[] = savedFiles.length > 0
    ? savedFiles.map(f => ({ ...f }))
    : INITIAL_FILES.map(f => ({ ...f }));

  const [files, setFiles] = useState<VirtualFile[]>(startFiles);
  const [openTabs, setOpenTabs] = useState<string[]>(["hello.js"]);
  const [activeTab, setActiveTab] = useState<string>("hello.js");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hi! I'm Claude. Ask me to write and edit code.\n\n**Try:**\n- \"Create a todo app\"\n- \"Build a snake game\"\n- \"Explain closures\"\n- \"Add error handling to calculator.js\"",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([
    { text: "Futureproof IDE — JavaScript runtime ready.", type: "info", key: 0 },
    { text: "Open a .js file and press ▶ Run, or ask Claude to create one.", type: "info", key: 1 },
  ]);
  const [showTerminal, setShowTerminal] = useState(true);
  const [newFilename, setNewFilename] = useState("");
  const [showNewFile, setShowNewFile] = useState(false);
  const [flashFile, setFlashFile] = useState<string | null>(null);
  const [lineCounter, setLineCounter] = useState(2);
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [previewTitle, setPreviewTitle] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved" | "error">("saved");

  const streamRef = useRef<NodeJS.Timeout | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const saveDebounceRef = useRef<NodeJS.Timeout | null>(null);
  const isFirstRender = useRef(true);

  const activeFile = files.find(f => f.path === activeTab) ?? null;

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);
  useEffect(() => { terminalEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [terminalLines]);

  const saveFiles = useCallback(async (filesToSave: VirtualFile[]) => {
    if (!projectId) return;
    setSaveStatus("saving");
    try {
      const res = await fetch("/api/ide/files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          files: filesToSave.map(({ name, path, content, language }) => ({ name, path, content, language })),
        }),
      });
      setSaveStatus(res.ok ? "saved" : "error");
    } catch {
      setSaveStatus("error");
    }
  }, [projectId]);

  // Auto-save with 1.5 s debounce; skip the very first render
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSaveStatus("unsaved");
    if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current);
    saveDebounceRef.current = setTimeout(() => saveFiles(files), 1500);
    return () => { if (saveDebounceRef.current) clearTimeout(saveDebounceRef.current); };
  }, [files, saveFiles]);

  function openFile(path: string) {
    setActiveTab(path);
    if (!openTabs.includes(path)) setOpenTabs(prev => [...prev, path]);
  }

  function closeTab(path: string, e: React.MouseEvent) {
    e.stopPropagation();
    const remaining = openTabs.filter(t => t !== path);
    setOpenTabs(remaining);
    if (activeTab === path) setActiveTab(remaining[remaining.length - 1] ?? "");
  }

  function handleEditorChange(value: string | undefined) {
    if (!value || !activeTab) return;
    setFiles(prev => prev.map(f => f.path === activeTab ? { ...f, content: value } : f));
  }

  function addTerminalLines(newLines: TerminalLine[]) {
    setTerminalLines(prev => [...prev, ...newLines]);
    setLineCounter(prev => prev + newLines.length);
  }

  async function runCurrentFile() {
    const file = files.find(f => f.path === activeTab);
    if (!file || isRunning) return;

    // HTML → live preview panel
    if (file.language === "html") {
      setPreviewHtml(file.content);
      setPreviewTitle(file.name);
      setPreviewKey(k => k + 1);
      setShowPreview(true);
      const k = lineCounter;
      addTerminalLines([
        { text: `$ preview ${file.name}`, type: "command", key: k },
        { text: `✓ Preview opened`, type: "success", key: k + 1 },
      ]);
      return;
    }

    setShowTerminal(true);
    setIsRunning(true);
    const startKey = lineCounter;

    // JavaScript → fast in-browser runner (no network)
    if (file.language === "javascript") {
      addTerminalLines([{ text: `$ node ${file.name}`, type: "command", key: startKey }]);
      const { output, error } = await runJavaScriptAsync(file.content);
      const newLines: TerminalLine[] = [];
      if (output.length === 0 && !error) newLines.push({ text: "(no output)", type: "info", key: startKey + 1 });
      output.forEach((line, i) => newLines.push({ text: line, type: line.startsWith("✗") ? "error" : "output", key: startKey + 1 + i }));
      if (error) newLines.push({ text: `Error: ${error}`, type: "error", key: startKey + output.length + 1 });
      else newLines.push({ text: `✓ exited with code 0`, type: "success", key: startKey + output.length + 1 });
      addTerminalLines(newLines);
      setIsRunning(false);
      return;
    }

    // All other languages → Piston execution API
    const runnerLabel: Record<string, string> = {
      python: "python3", typescript: "ts-node", java: "java", c: "gcc",
      cpp: "g++", go: "go run", rust: "rustc", ruby: "ruby", shell: "bash",
    };
    const label = runnerLabel[file.language] ?? file.language;
    addTerminalLines([{ text: `$ ${label} ${file.name}`, type: "command", key: startKey }]);

    try {
      const res = await fetch("/api/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: file.content, language: file.language, filename: file.name }),
      });
      const data = await res.json() as { stdout: string; stderr: string; code: number };
      const newLines: TerminalLine[] = [];
      const stdoutLines = data.stdout ? data.stdout.split("\n").filter(Boolean) : [];
      const stderrLines = data.stderr ? data.stderr.split("\n").filter(Boolean) : [];
      if (stdoutLines.length === 0 && stderrLines.length === 0) newLines.push({ text: "(no output)", type: "info", key: startKey + 1 });
      stdoutLines.forEach((line, i) => newLines.push({ text: line, type: "output", key: startKey + 1 + i }));
      stderrLines.forEach((line, i) => newLines.push({ text: line, type: "error", key: startKey + 1 + stdoutLines.length + i }));
      const exitKey = startKey + 1 + stdoutLines.length + stderrLines.length;
      newLines.push(data.code === 0
        ? { text: `✓ exited with code 0`, type: "success", key: exitKey }
        : { text: `✗ exited with code ${data.code}`, type: "error", key: exitKey }
      );
      addTerminalLines(newLines);
    } catch {
      addTerminalLines([{ text: "Failed to reach execution service.", type: "error", key: startKey + 1 }]);
    }
    setIsRunning(false);
  }

  function handleChatSubmit() {
    if (!chatInput.trim() || isStreaming) return;
    const userMsg = chatInput.trim();
    setChatInput("");

    const msgId = Date.now().toString();
    setMessages(prev => [...prev, { id: msgId, role: "user", content: userMsg }]);

    const response = generateAIResponse(userMsg, files, activeFile);

    if (response.writes.length > 0) {
      response.writes.forEach((w, i) => {
        setTimeout(() => {
          setFiles(prev => {
            const exists = prev.find(f => f.path === w.path);
            if (exists) return prev.map(f => f.path === w.path ? { ...f, content: w.content } : f);
            return [...prev, { name: w.path.split("/").pop()!, path: w.path, content: w.content, language: detectLanguage(w.path), isNew: true }];
          });
          openFile(w.path);
          setFlashFile(w.path);
          setTimeout(() => setFlashFile(null), 1400);

          if (response.runFile === w.path && detectLanguage(w.path) === "html") {
            setPreviewHtml(w.content);
            setPreviewTitle(w.path);
            setPreviewKey(k => k + 1);
            setShowPreview(true);
          }
        }, 280 + i * 120);
      });
    }

    // Only auto-run if runFile is an already-existing file (not being written above)
    if (response.runFile && !response.writes.some(w => w.path === response.runFile)) {
      const file = files.find(f => f.path === response.runFile);
      if (file) { openFile(file.path); setTimeout(runCurrentFile, 100); }
    }

    const assistantId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", isStreaming: true }]);
    setIsStreaming(true);

    let charIdx = 0;
    const fullText = response.text;
    streamRef.current = setInterval(() => {
      charIdx = Math.min(charIdx + 5, fullText.length);
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, content: fullText.slice(0, charIdx), isStreaming: charIdx < fullText.length } : m));
      if (charIdx >= fullText.length) {
        clearInterval(streamRef.current!);
        setIsStreaming(false);
        setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, isStreaming: false } : m));
      }
    }, 16);
  }

  function createNewFile() {
    if (!newFilename.trim()) return;
    const name = newFilename.trim();
    const lang = detectLanguage(name);
    let content = `// ${name}\nconsole.log("${name} loaded!");\n`;
    if (lang === "python") content = `# ${name}\n\nprint("Hello!")\n`;
    else if (lang === "markdown") content = `# ${name.replace(".md", "")}\n\n`;
    else if (lang === "json") content = `{\n  "name": "project"\n}\n`;
    setFiles(prev => [...prev, { name, path: name, content, language: lang, isNew: true }]);
    openFile(name);
    setNewFilename("");
    setShowNewFile(false);
  }

  function clearTerminal() {
    setTerminalLines([{ text: "Terminal cleared.", type: "info", key: lineCounter }]);
    setLineCounter(prev => prev + 1);
  }

  const renderMarkdown = (text: string) =>
    text
      .replace(/```(\w*)\n([\s\S]*?)```/g, `<pre style="margin:6px 0;background:#0d0d0e;border:1px solid #2a2a2c;border-radius:6px;padding:8px 10px;overflow-x:auto;font-size:11px;color:#cacaca;font-family:ui-monospace,monospace"><code>$2</code></pre>`)
      .replace(/`([^`]+)`/g, `<code style="background:#1c1c1e;border:1px solid #2a2a2c;padding:1px 5px;border-radius:4px;font-size:11px;color:#ff6b35;font-family:ui-monospace,monospace">$1</code>`)
      .replace(/\*\*(.+?)\*\*/g, `<strong style="color:#e0e0e0;font-weight:700">$1</strong>`)
      .replace(/\*(.+?)\*/g, "<em>$1</em>")
      .replace(/^- (.+)$/gm, `<li style="margin-left:14px;list-style:disc;margin-bottom:2px">$1</li>`)
      .replace(/\n\n/g, "<br/><br/>")
      .replace(/\n/g, "<br/>");

  return (
    <>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes fileFlash { 0%,100% { background: transparent; } 30%,70% { background: rgba(74,222,128,0.08); } }
        @keyframes blink { 0%,100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes runPulse { 0%,100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); } 50% { box-shadow: 0 0 0 4px rgba(74,222,128,0.15); } }
        @keyframes newFileDot { 0% { opacity:0; transform:scale(0); } 60% { opacity:1; transform:scale(1.3); } 100% { opacity:1; transform:scale(1); } }
        .ide-tab-active::after { content:''; position:absolute; bottom:0; left:0; right:0; height:2px; background:#ff4300; border-radius:2px 2px 0 0; }
        .ide-message { animation: slideUp 0.18s ease both; }
        .ide-terminal-line { animation: fadeIn 0.12s ease both; }
        .ide-file-row:hover .ide-file-label { transform: translateX(2px); }
        .ide-file-label { transition: transform 0.1s ease; }
        .ide-flash { animation: fileFlash 1.4s ease; }
        .ide-run-active { animation: runPulse 1s ease infinite; }
      `}</style>

      <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "transparent", color: "#999", fontFamily: "ui-monospace,'Cascadia Code','Fira Code',monospace", fontSize: 12, overflow: "hidden" }}>

        {/* ── Main IDE row ── */}
        <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

          {/* Activity Bar */}
          <div style={{ width: 44, background: "rgba(6,6,8,0.72)", borderRight: "1px solid rgba(40,40,55,0.5)", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 8, paddingBottom: 8, gap: 2, flexShrink: 0 }}>
            {[
              { icon: "⊞", title: "Explorer", active: true },
              { icon: "⌕", title: "Search", active: false },
              { icon: "⎇", title: "Source Control", active: false },
            ].map(({ icon, title, active }) => (
              <button
                key={title}
                title={title}
                style={{
                  width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: 8, fontSize: 16, transition: "all 0.15s ease", cursor: "pointer",
                  color: active ? "#cacaca" : "#444",
                  background: active ? "#1c1c1e" : "transparent",
                  border: "none",
                  borderLeft: active ? "2px solid #ff4300" : "2px solid transparent",
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "#777"; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = "#444"; }}
              >
                {icon}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            <button
              title="Settings"
              style={{ width: 34, height: 34, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, fontSize: 14, color: "#444", background: "transparent", border: "none", cursor: "pointer", transition: "color 0.15s ease" }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#777"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#444"; }}
            >
              ⚙
            </button>
          </div>

          {/* File Explorer */}
          <div style={{ width: 200, background: "rgba(10,10,13,0.78)", borderRight: "1px solid rgba(40,40,55,0.5)", display: "flex", flexDirection: "column", flexShrink: 0 }}>
            {/* Explorer header */}
            <div style={{ padding: "10px 12px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid rgba(40,40,55,0.5)" }}>
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#555", fontFamily: "-apple-system,'Inter',sans-serif" }}>Explorer</span>
              <button
                onClick={() => setShowNewFile(v => !v)}
                title="New File"
                style={{ width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 5, fontSize: 14, color: showNewFile ? "#cacaca" : "#555", background: showNewFile ? "#1c1c1e" : "transparent", border: "none", cursor: "pointer", transition: "all 0.15s ease" }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#999"; }}
                onMouseLeave={e => { if (!showNewFile) (e.currentTarget as HTMLElement).style.color = "#555"; }}
              >
                +
              </button>
            </div>

            {/* New file input */}
            {showNewFile && (
              <div style={{ padding: "6px 10px", borderBottom: "1px solid rgba(40,40,55,0.5)", animation: "slideUp 0.15s ease" }}>
                <input
                  type="text"
                  value={newFilename}
                  onChange={e => setNewFilename(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") createNewFile(); if (e.key === "Escape") setShowNewFile(false); }}
                  placeholder="filename.js"
                  autoFocus
                  style={{ width: "100%", background: "#1c1c1e", border: "1px solid #ff4300", borderRadius: 5, padding: "4px 8px", fontSize: 11, color: "#cacaca", outline: "none", fontFamily: "inherit" }}
                />
              </div>
            )}

            {/* Project label */}
            <div style={{ padding: "8px 12px 4px", fontSize: 10, color: "#444", letterSpacing: "0.08em", textTransform: "uppercase", fontFamily: "-apple-system,'Inter',sans-serif" }}>
              My Project
            </div>

            {/* File list */}
            <div style={{ flex: 1, overflowY: "auto" }}>
              {files.map(file => {
                const isActive = activeTab === file.path;
                return (
                  <button
                    key={file.path}
                    onClick={() => openFile(file.path)}
                    className="ide-file-row"
                    style={{
                      width: "100%", display: "flex", alignItems: "center", gap: 7,
                      padding: "5px 12px 5px 16px", textAlign: "left", cursor: "pointer",
                      background: isActive ? "#1c1c1e" : "transparent",
                      borderLeft: isActive ? "2px solid #ff4300" : "2px solid transparent",
                      borderRight: "none", borderTop: "none", borderBottom: "none",
                      color: isActive ? "#cacaca" : "#666",
                      transition: "all 0.12s ease",
                      animation: file.isNew ? "slideUp 0.2s ease" : "none",
                    }}
                    onMouseEnter={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "#161618"; }}
                    onMouseLeave={e => { if (!isActive) (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                  >
                    <span style={{ fontSize: 10, width: 16, textAlign: "center", color: isActive ? "#ff4300" : "#444", fontWeight: 700, letterSpacing: 0, flexShrink: 0 }}>
                      {getFileIcon(file.name)}
                    </span>
                    <span className="ide-file-label" style={{ fontSize: 12, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {file.name}
                    </span>
                    {flashFile === file.path && (
                      <span style={{ marginLeft: "auto", width: 6, height: 6, borderRadius: "50%", background: "#4ade80", flexShrink: 0, animation: "newFileDot 0.3s ease both" }} />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Editor + Terminal + Preview row */}
          <div style={{ flex: 1, display: "flex", minWidth: 0, overflow: "hidden" }}>

          {/* Editor + Terminal column */}
          <div style={{ flex: showPreview ? "0 0 50%" : 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>

            {/* Tab bar + toolbar */}
            <div style={{ height: 38, background: "rgba(6,6,8,0.82)", borderBottom: "1px solid rgba(40,40,55,0.5)", display: "flex", alignItems: "stretch", flexShrink: 0, overflow: "hidden" }}>
              {/* Tabs */}
              <div style={{ display: "flex", alignItems: "stretch", flex: 1, overflowX: "auto", minWidth: 0 }}>
                {openTabs.map(path => {
                  const file = files.find(f => f.path === path);
                  if (!file) return null;
                  const isActive = activeTab === path;
                  const isFlashing = flashFile === path;
                  return (
                    <div
                      key={path}
                      onClick={() => setActiveTab(path)}
                      className={isActive ? "ide-tab-active" : ""}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "0 12px", cursor: "pointer", position: "relative",
                        borderRight: "1px solid rgba(40,40,55,0.5)", flexShrink: 0,
                        background: isActive ? "#141415" : "transparent",
                        color: isActive ? "#cacaca" : "#555",
                        transition: "background 0.12s ease, color 0.12s ease",
                        boxShadow: isFlashing ? "inset 0 0 12px rgba(74,222,128,0.15)" : "none",
                      }}
                      onMouseEnter={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "#111112"; (e.currentTarget as HTMLElement).style.color = "#888"; } }}
                      onMouseLeave={e => { if (!isActive) { (e.currentTarget as HTMLElement).style.background = "transparent"; (e.currentTarget as HTMLElement).style.color = "#555"; } }}
                    >
                      <span style={{ fontSize: 10, color: isActive ? "#ff4300" : "#444", fontWeight: 700 }}>{getFileIcon(file.name)}</span>
                      <span style={{ fontSize: 12, whiteSpace: "nowrap" }}>{file.name}</span>
                      <button
                        onClick={e => closeTab(path, e)}
                        style={{ width: 16, height: 16, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 4, fontSize: 14, color: "#444", background: "transparent", border: "none", cursor: "pointer", transition: "all 0.1s ease", lineHeight: 1 }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#cacaca"; (e.currentTarget as HTMLElement).style.background = "#2a2a2c"; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#444"; (e.currentTarget as HTMLElement).style.background = "transparent"; }}
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Toolbar */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 12px", flexShrink: 0, borderLeft: "1px solid rgba(40,40,55,0.5)" }}>
                <button
                  onClick={runCurrentFile}
                  disabled={!activeFile || isRunning}
                  className={isRunning ? "ide-run-active" : ""}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "5px 12px", borderRadius: 7, fontSize: 11, fontWeight: 700,
                    background: isRunning ? "#1a3a1a" : "#173117",
                    color: isRunning ? "#4ade80" : "#4ade80",
                    border: "1px solid",
                    borderColor: isRunning ? "rgba(74,222,128,0.4)" : "rgba(74,222,128,0.2)",
                    cursor: (!activeFile || isRunning) ? "not-allowed" : "pointer",
                    opacity: !activeFile ? 0.4 : 1,
                    transition: "all 0.15s ease",
                    fontFamily: "-apple-system,'Inter',sans-serif",
                  }}
                >
                  {isRunning
                    ? <span style={{ display: "inline-block", width: 10, height: 10, border: "1.5px solid #4ade80", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
                    : <span style={{ fontSize: 9 }}>▶</span>}
                  {isRunning ? "Running" : activeFile?.language === "html" ? "Preview" : "Run"}
                </button>
                <button
                  onClick={() => setShowTerminal(v => !v)}
                  style={{
                    padding: "5px 10px", borderRadius: 7, fontSize: 11,
                    background: showTerminal ? "#1c1c1e" : "transparent",
                    color: showTerminal ? "#999" : "#555",
                    border: "1px solid",
                    borderColor: showTerminal ? "#2a2a2c" : "transparent",
                    cursor: "pointer", transition: "all 0.15s ease",
                    fontFamily: "-apple-system,'Inter',sans-serif", fontWeight: 700,
                  }}
                >
                  Terminal
                </button>
              </div>
            </div>

            {/* Monaco Editor */}
            <div
              className={flashFile === activeTab ? "ide-flash" : ""}
              style={{ flex: 1, minHeight: 0, overflow: "hidden" }}
            >
              {activeFile ? (
                <MonacoEditor
                  height="100%"
                  language={activeFile.language}
                  value={activeFile.content}
                  theme="vs-dark"
                  onChange={handleEditorChange}
                  options={{
                    fontSize: 13,
                    fontFamily: "'Cascadia Code','Fira Code','JetBrains Mono',ui-monospace,monospace",
                    fontLigatures: true,
                    lineNumbers: "on",
                    minimap: { enabled: false },
                    scrollBeyondLastLine: false,
                    wordWrap: "on",
                    automaticLayout: true,
                    tabSize: 2,
                    bracketPairColorization: { enabled: true },
                    smoothScrolling: true,
                    cursorBlinking: "smooth",
                    cursorSmoothCaretAnimation: "on",
                    padding: { top: 12, bottom: 12 },
                    scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 },
                    renderLineHighlight: "gutter",
                    lineDecorationsWidth: 4,
                  }}
                />
              ) : (
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100%", gap: 12, color: "#333" }}>
                  <span style={{ fontSize: 32 }}>◫</span>
                  <span style={{ fontSize: 12, fontFamily: "-apple-system,'Inter',sans-serif" }}>Open a file from the explorer</span>
                </div>
              )}
            </div>

            {/* Terminal */}
            {showTerminal && (
              <div style={{ height: 200, background: "rgba(5,5,7,0.82)", borderTop: "1px solid rgba(40,40,55,0.5)", display: "flex", flexDirection: "column", animation: "slideUp 0.18s ease", backdropFilter: "blur(12px)" }}>
                {/* Terminal header */}
                <div style={{ height: 30, background: "rgba(6,6,8,0.88)", borderBottom: "1px solid rgba(40,40,55,0.5)", display: "flex", alignItems: "center", gap: 12, padding: "0 12px", flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#444", fontFamily: "-apple-system,'Inter',sans-serif" }}>Terminal</span>
                  <div style={{ flex: 1 }} />
                  <button
                    onClick={clearTerminal}
                    style={{ fontSize: 10, color: "#444", background: "transparent", border: "none", cursor: "pointer", transition: "color 0.1s ease", padding: "2px 6px", borderRadius: 4, fontFamily: "-apple-system,'Inter',sans-serif" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#777"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#444"; }}
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => setShowTerminal(false)}
                    style={{ fontSize: 14, color: "#444", background: "transparent", border: "none", cursor: "pointer", lineHeight: 1, padding: "2px 4px", borderRadius: 4, transition: "color 0.1s ease" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#777"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#444"; }}
                  >
                    ×
                  </button>
                </div>

                {/* Terminal output */}
                <div style={{ flex: 1, overflowY: "auto", padding: "8px 14px", display: "flex", flexDirection: "column", gap: 2 }}>
                  {terminalLines.map((line, i) => (
                    <div
                      key={line.key}
                      className="ide-terminal-line"
                      style={{
                        lineHeight: 1.6,
                        animationDelay: `${Math.min(i * 0.02, 0.1)}s`,
                        color:
                          line.type === "command" ? "#569cd6" :
                          line.type === "error" ? "#f87171" :
                          line.type === "success" ? "#4ade80" :
                          line.type === "info" ? "#444" :
                          "#999",
                        fontFamily: "ui-monospace,'Cascadia Code',monospace",
                      }}
                    >
                      {line.type === "command" && <span style={{ color: "#ff4300", marginRight: 6 }}>$</span>}
                      {line.text}
                    </div>
                  ))}
                  <div ref={terminalEndRef} />
                </div>
              </div>
            )}
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", borderLeft: "1px solid rgba(40,40,55,0.5)", minWidth: 0, overflow: "hidden", animation: "slideUp 0.18s ease" }}>
              {/* Preview header */}
              <div style={{ height: 38, background: "rgba(6,6,8,0.88)", borderBottom: "1px solid rgba(40,40,55,0.5)", display: "flex", alignItems: "center", gap: 8, padding: "0 12px", flexShrink: 0 }}>
                <span style={{ fontSize: 10, color: "#444", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", fontFamily: "-apple-system,'Inter',sans-serif" }}>Preview</span>
                <span style={{ fontSize: 10, color: "#333" }}>·</span>
                <span style={{ fontSize: 12, color: "#666", fontFamily: "ui-monospace,monospace" }}>{previewTitle}</span>
                <div style={{ flex: 1 }} />
                <button
                  onClick={() => { setPreviewHtml(files.find(f => f.path === previewTitle)?.content ?? previewHtml); setPreviewKey(k => k + 1); }}
                  title="Refresh"
                  style={{ fontSize: 13, color: "#444", background: "transparent", border: "none", cursor: "pointer", padding: "2px 6px", borderRadius: 4, transition: "color 0.1s ease", fontFamily: "monospace" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#999"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#444"; }}
                >↺</button>
                <button
                  onClick={() => setShowPreview(false)}
                  style={{ fontSize: 16, color: "#444", background: "transparent", border: "none", cursor: "pointer", lineHeight: 1, padding: "2px 4px", borderRadius: 4, transition: "color 0.1s ease" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#cacaca"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "#444"; }}
                >×</button>
              </div>
              <iframe
                key={previewKey}
                srcDoc={previewHtml}
                sandbox="allow-scripts"
                style={{ flex: 1, border: "none", background: "#fff", display: "block" }}
                title="Preview"
              />
            </div>
          )}

          {/* Close Editor+Preview row */}
          </div>

          {/* Claude Chat Panel */}
          <div style={{ width: 300, background: "rgba(6,6,8,0.78)", borderLeft: "1px solid rgba(40,40,55,0.5)", backdropFilter: "blur(16px)", display: "flex", flexDirection: "column", flexShrink: 0, fontFamily: "-apple-system,'Inter',ui-sans-serif,sans-serif" }}>

            {/* Chat header */}
            <div style={{ height: 38, background: "rgba(10,10,13,0.88)", borderBottom: "1px solid rgba(40,40,55,0.5)", display: "flex", alignItems: "center", gap: 8, padding: "0 14px", flexShrink: 0 }}>
              <div style={{ width: 22, height: 22, borderRadius: 7, background: "#ff4300", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>A</div>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#cacaca", letterSpacing: "-0.016em" }}>Claude</span>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: isStreaming ? "#ff4300" : "#4ade80", transition: "background 0.3s ease", boxShadow: isStreaming ? "0 0 6px rgba(255,67,0,0.5)" : "0 0 6px rgba(74,222,128,0.4)" }} />
                <span style={{ fontSize: 10, color: "#444", letterSpacing: "0.04em", textTransform: "uppercase" }}>{isStreaming ? "thinking" : "ready"}</span>
              </div>
            </div>

            {/* Messages */}
            <div style={{ flex: 1, overflowY: "auto", padding: "12px 10px", display: "flex", flexDirection: "column", gap: 10 }}>
              {messages.map(msg => (
                <div
                  key={msg.id}
                  className="ide-message"
                  style={{ display: "flex", gap: 8, flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-start" }}
                >
                  {msg.role === "assistant" && (
                    <div style={{ width: 22, height: 22, borderRadius: 7, background: "#ff4300", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff", flexShrink: 0, marginTop: 2 }}>A</div>
                  )}
                  <div
                    style={{
                      maxWidth: 220,
                      borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                      padding: "9px 12px",
                      fontSize: 12,
                      lineHeight: 1.6,
                      background: msg.role === "user" ? "#1c2a3a" : "#141415",
                      color: "#999",
                      border: "1px solid",
                      borderColor: msg.role === "user" ? "#1e3a5a" : "rgba(40,40,55,0.5)",
                      letterSpacing: "-0.011em",
                    }}
                  >
                    <div dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content || "") }} />
                    {msg.isStreaming && (
                      <span style={{ display: "inline-block", width: 7, height: 13, background: "#ff4300", marginLeft: 2, borderRadius: 2, verticalAlign: "text-bottom", animation: "blink 0.9s ease infinite" }} />
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input area */}
            <div style={{ padding: 10, borderTop: "1px solid rgba(40,40,55,0.5)", flexShrink: 0 }}>
              {/* Quick actions */}
              <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
                {["Create todo app", "Snake game", "Explain closures"].map(q => (
                  <button
                    key={q}
                    onClick={() => { setChatInput(q); chatInputRef.current?.focus(); }}
                    style={{
                      fontSize: 10, padding: "3px 8px", borderRadius: 20,
                      background: "#141415", color: "#555",
                      border: "1px solid rgba(40,40,55,0.5)",
                      cursor: "pointer", transition: "all 0.12s ease",
                      letterSpacing: "-0.011em",
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = "#1c1c1e"; (e.currentTarget as HTMLElement).style.color = "#888"; (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2c"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = "#141415"; (e.currentTarget as HTMLElement).style.color = "#555"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(40,40,55,0.45)"; }}
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* Textarea + send */}
              <div
                style={{ background: "#111112", border: "1px solid #2a2a2c", borderRadius: 10, overflow: "hidden", transition: "border-color 0.15s ease" }}
                onFocusCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = "#ff4300"; }}
                onBlurCapture={e => { (e.currentTarget as HTMLElement).style.borderColor = "#2a2a2c"; }}
              >
                <textarea
                  ref={chatInputRef}
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleChatSubmit(); } }}
                  placeholder="Ask Claude to write code…"
                  rows={3}
                  disabled={isStreaming}
                  style={{
                    width: "100%", background: "transparent", color: "#cacaca",
                    fontSize: 12, padding: "10px 12px", resize: "none", outline: "none",
                    fontFamily: "-apple-system,'Inter',ui-sans-serif,sans-serif",
                    letterSpacing: "-0.011em", lineHeight: 1.55,
                    caretColor: "#ff4300",
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 10px 8px", borderTop: "1px solid rgba(40,40,55,0.5)" }}>
                  <span style={{ fontSize: 10, color: "#333", letterSpacing: "0.01em" }}>↵ send  ⇧↵ newline</span>
                  <button
                    onClick={handleChatSubmit}
                    disabled={!chatInput.trim() || isStreaming}
                    style={{
                      display: "flex", alignItems: "center", gap: 4,
                      padding: "4px 10px", borderRadius: 7, fontSize: 11, fontWeight: 700,
                      background: chatInput.trim() && !isStreaming ? "#ff4300" : "#1c1c1e",
                      color: chatInput.trim() && !isStreaming ? "#fff" : "#444",
                      border: "1px solid",
                      borderColor: chatInput.trim() && !isStreaming ? "#ff4300" : "#2a2a2c",
                      cursor: !chatInput.trim() || isStreaming ? "not-allowed" : "pointer",
                      transition: "all 0.15s ease",
                      letterSpacing: "-0.011em",
                    }}
                  >
                    {isStreaming
                      ? <span style={{ display: "inline-flex", gap: 2 }}>
                          {[0,1,2].map(i => <span key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: "#444", animation: `blink 1s ease ${i * 0.2}s infinite` }} />)}
                        </span>
                      : "Send →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Bar */}
        <div style={{ height: 24, background: "rgba(4,4,6,0.7)", borderTop: "1px solid rgba(40,40,55,0.4)", backdropFilter: "blur(20px)", display: "flex", alignItems: "center", padding: "0 12px", gap: 16, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ff4300" }} />
            <span style={{ fontSize: 10, color: "#444", letterSpacing: "-0.011em", fontFamily: "-apple-system,'Inter',sans-serif" }}>Futureproof IDE</span>
          </div>
          {activeFile && (
            <>
              <span style={{ fontSize: 10, color: "#333" }}>·</span>
              <span style={{ fontSize: 10, color: "#444", fontFamily: "-apple-system,'Inter',sans-serif" }}>{activeFile.name}</span>
              <span style={{ fontSize: 10, color: "#333" }}>·</span>
              <span style={{ fontSize: 10, color: "#444", fontFamily: "-apple-system,'Inter',sans-serif" }}>{activeFile.language}</span>
              <span style={{ fontSize: 10, color: "#333" }}>·</span>
              <span style={{ fontSize: 10, color: "#444", fontFamily: "-apple-system,'Inter',sans-serif" }}>{activeFile.content.split("\n").length} lines</span>
            </>
          )}
          <div style={{ flex: 1 }} />
          {projectId && (
            <span style={{
              fontSize: 10,
              fontFamily: "-apple-system,'Inter',sans-serif",
              color: saveStatus === "saved" ? "#3a5a3a" : saveStatus === "saving" ? "#ff6b35" : saveStatus === "error" ? "#f87171" : "#555",
              transition: "color 0.3s ease",
            }}>
              {saveStatus === "saved" ? "● Saved" : saveStatus === "saving" ? "⟳ Saving…" : saveStatus === "error" ? "✗ Save failed" : "● Unsaved"}
            </span>
          )}
          <span style={{ fontSize: 10, color: "#333", fontFamily: "-apple-system,'Inter',sans-serif", marginLeft: 12 }}>
            {activeFile?.language === "javascript" ? "Browser JS" :
             activeFile?.language === "html" ? "HTML Preview" :
             activeFile?.language === "python" ? "Python 3.10" :
             activeFile?.language === "typescript" ? "TypeScript 5" :
             activeFile?.language === "java" ? "Java 15" :
             activeFile?.language === "go" ? "Go 1.16" :
             activeFile?.language === "rust" ? "Rust 1.50" :
             activeFile?.language ? `${activeFile.language} via Piston` : "Ready"}
          </span>
        </div>
      </div>
    </>
  );
}
