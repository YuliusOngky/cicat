"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/");
        router.refresh();
        return;
      }
      setError(res.status === 401 ? "Wrong password" : "Login unavailable. Check server config.");
    } catch {
      setError("Network error. Try again.");
    }
    setLoading(false);
  }

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🗣️</div>
        <h1 className="text-4xl font-bold tracking-tight mb-2" style={{ color: "var(--text)" }}>
          Cicat
        </h1>
        <p style={{ color: "var(--text-muted)" }}>Enter the password to continue</p>
      </div>

      <form
        onSubmit={submit}
        className="w-full max-w-sm p-4 rounded-2xl border grid gap-3"
        style={{ background: "var(--surface)", borderColor: "var(--border)" }}
      >
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="w-full px-4 py-3 rounded-xl border outline-none"
          style={{ background: "var(--bg)", borderColor: "var(--border)", color: "var(--text)" }}
        />
        {error && (
          <p role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full py-3 rounded-xl font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ background: "var(--accent)" }}
        >
          {loading ? "Checking…" : "Unlock"}
        </button>
      </form>
    </main>
  );
}
