"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Mode = "signin" | "signup";

interface AuthModalProps {
  isOpen: boolean;
  defaultMode?: Mode;
  onClose: () => void;
}

export default function AuthModal({ isOpen, defaultMode = "signup", onClose }: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>(defaultMode);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Issue 04 — sync internal mode tab whenever the caller opens the modal with a different defaultMode
  useEffect(() => {
    if (isOpen) setMode(defaultMode);
  }, [isOpen, defaultMode]);

  // Issue 01 — close on Escape key
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") { reset(); onClose(); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  function reset() {
    setError("");
    setFullName("");
    setEmail("");
    setPassword("");
    setLoading(false);
  }

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const supabase = createClient();

    if (mode === "signup") {
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) {
        setError(err.message);
        setLoading(false);
        return;
      }
    }

    reset();
    onClose();
    router.push("/dashboard");
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
    >
      {/* Issue 02 — clicking the backdrop closes the modal */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => { reset(); onClose(); }}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        {/* Issue 10 — explicit type="button" so these don't submit any ancestor form */}
        <button
          type="button"
          onClick={() => { reset(); onClose(); }}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors text-2xl leading-none"
        >
          ×
        </button>

        <div className="text-center mb-6">
          <span className="text-3xl">🚀</span>
          <h2 className="text-2xl font-bold text-slate-900 mt-2">
            {mode === "signup" ? "Create your account" : "Welcome back"}
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            {mode === "signup" ? "Start with Module 1 — completely free" : "Sign in to continue learning"}
          </p>
        </div>

        <div className="flex rounded-lg bg-slate-100 p-1 mb-6">
          <button
            type="button"
            onClick={() => switchMode("signup")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Sign up
          </button>
          <button
            type="button"
            onClick={() => switchMode("signin")}
            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
              mode === "signin" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Sign in
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Your name</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Alex Johnson"
                className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="At least 8 characters"
              className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? mode === "signup" ? "Creating account..." : "Signing in..."
              : mode === "signup" ? "Create free account" : "Sign in"}
          </button>
        </form>

        {/* Issue 09 — Terms of Service is now a real link */}
        {mode === "signup" && (
          <p className="text-center text-xs text-slate-400 mt-4">
            By signing up you agree to our{" "}
            <a href="/terms" className="underline hover:text-slate-600 transition-colors">
              Terms of Service
            </a>
            .
          </p>
        )}
      </div>
    </div>
  );
}
