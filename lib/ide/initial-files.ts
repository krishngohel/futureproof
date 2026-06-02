export interface IdeFile {
  name: string;
  path: string;
  content: string;
  language: string;
}

export const INITIAL_FILES: IdeFile[] = [
  {
    name: "hello.js",
    path: "hello.js",
    language: "javascript",
    content: `// 👋 Welcome to the Futureproof IDE
// Ask Claude on the right to create files, edit code, or explain concepts.

function greet(name) {
  return \`Hello, \${name}! Welcome to Futureproof.\`;
}

console.log(greet("World"));
console.log("Press ▶ Run to execute this file");
console.log("Ask Claude: \\"create a todo app\\" or \\"explain closures\\"");
`,
  },
  {
    name: "calculator.js",
    path: "calculator.js",
    language: "javascript",
    content: `// Simple calculator module

function add(a, b) { return a + b; }
function subtract(a, b) { return a - b; }
function multiply(a, b) { return a * b; }
function divide(a, b) {
  if (b === 0) throw new Error("Cannot divide by zero!");
  return a / b;
}

console.log("2 + 3 =", add(2, 3));
console.log("10 - 4 =", subtract(10, 4));
console.log("5 × 6 =", multiply(5, 6));
console.log("15 ÷ 3 =", divide(15, 3));
`,
  },
  {
    name: "README.md",
    path: "README.md",
    language: "markdown",
    content: `# My Futureproof Project

Browser-based IDE powered by Claude.

## What you can do

- **Write code** in any language and press ▶ Run
- **Ask Claude** to create files, add features, or fix bugs
- **Play games** — ask Claude to "build a snake game"

## Languages supported

JavaScript, Python, TypeScript, Java, C, C++, Go, Rust, Ruby, Bash

## Example prompts

- "Create a todo app in JavaScript"
- "Build a snake game"
- "Write a Python demo"
- "Explain how closures work"
`,
  },
];
