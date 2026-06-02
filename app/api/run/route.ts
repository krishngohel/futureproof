import { NextRequest, NextResponse } from "next/server";

const PISTON_API = "https://emkc.org/api/v2/piston/execute";

// Monaco language ID → Piston runtime
const RUNTIMES: Record<string, { language: string; version: string }> = {
  python:     { language: "python",     version: "3.10.0"  },
  typescript: { language: "typescript", version: "5.0.3"   },
  java:       { language: "java",       version: "15.0.2"  },
  c:          { language: "c",          version: "10.2.0"  },
  cpp:        { language: "c++",        version: "10.2.0"  },
  go:         { language: "go",         version: "1.16.2"  },
  rust:       { language: "rust",       version: "1.50.0"  },
  ruby:       { language: "ruby",       version: "3.0.1"   },
  shell:      { language: "bash",       version: "5.2.0"   },
};

export async function POST(req: NextRequest) {
  try {
    const { code, language, filename } = await req.json() as {
      code: string;
      language: string;
      filename: string;
    };

    const runtime = RUNTIMES[language];
    if (!runtime) {
      return NextResponse.json({
        stdout: "",
        stderr: `Language '${language}' is not supported for execution.`,
        code: 1,
      });
    }

    const res = await fetch(PISTON_API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language: runtime.language,
        version: runtime.version,
        files: [{ name: filename, content: code }],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({
        stdout: "",
        stderr: `Execution service returned ${res.status}. Try again.`,
        code: 1,
      });
    }

    const data = await res.json() as {
      run?: { stdout: string; stderr: string; code: number };
      message?: string;
    };

    if (data.message) {
      return NextResponse.json({ stdout: "", stderr: data.message, code: 1 });
    }

    return NextResponse.json({
      stdout: data.run?.stdout ?? "",
      stderr: data.run?.stderr ?? "",
      code: data.run?.code ?? 0,
    });
  } catch {
    return NextResponse.json({
      stdout: "",
      stderr: "Failed to reach execution service. Check your connection.",
      code: 1,
    });
  }
}
