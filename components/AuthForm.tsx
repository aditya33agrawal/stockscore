"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Props {
  mode: "login" | "signup";
}

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";
  const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isSignup ? { email, password, name } : { email, password },
        ),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Something went wrong");
        return;
      }
      router.push("/bookmarks");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-chalk-50 mb-2">
        {isSignup ? "Create an account" : "Welcome back"}
      </h1>
      <p className="text-sm text-chalk-300/60 mb-8">
        {isSignup
          ? "Sign up to save your favourite companies and track them across sectors."
          : "Sign in to access your bookmarks."}
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        {isSignup && (
          <label className="block">
            <span className="text-xs font-medium text-chalk-300/70 uppercase tracking-wider">Name (optional)</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              className="mt-1.5 w-full rounded-xl border border-ink-700/60 bg-ink-900/60 px-4 py-2.5 text-sm text-chalk-50 placeholder-chalk-300/30 focus:outline-none focus:border-accent/50"
              placeholder="Aditya"
            />
          </label>
        )}

        <label className="block">
          <span className="text-xs font-medium text-chalk-300/70 uppercase tracking-wider">Email</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="mt-1.5 w-full rounded-xl border border-ink-700/60 bg-ink-900/60 px-4 py-2.5 text-sm text-chalk-50 placeholder-chalk-300/30 focus:outline-none focus:border-accent/50"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-chalk-300/70 uppercase tracking-wider">Password</span>
            {!isSignup && (
              <Link href="/forgot-password" className="text-xs font-medium text-accent hover:underline">
                Forgot password?
              </Link>
            )}
          </div>
          <input
            type="password"
            required
            minLength={isSignup ? 8 : undefined}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={isSignup ? "new-password" : "current-password"}
            className="mt-1.5 w-full rounded-xl border border-ink-700/60 bg-ink-900/60 px-4 py-2.5 text-sm text-chalk-50 placeholder-chalk-300/30 focus:outline-none focus:border-accent/50"
            placeholder={isSignup ? "At least 8 characters" : ""}
          />
        </label>

        {error && (
          <p className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">{error}</p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-accent text-ink-950 px-4 py-2.5 text-sm font-semibold hover:bg-accent/90 disabled:opacity-50"
        >
          {busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-chalk-300/60">
        {isSignup ? (
          <>Already have an account? <Link href="/login" className="text-accent hover:underline">Sign in</Link></>
        ) : (
          <>Don&apos;t have an account? <Link href="/signup" className="text-accent hover:underline">Sign up</Link></>
        )}
      </p>
    </div>
  );
}
