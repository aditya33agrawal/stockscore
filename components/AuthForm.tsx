"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  mode: "login" | "signup";
}

function passwordStrength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw) return { score: 0, label: "" };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++;
  const labels = ["Too short", "Weak", "Fair", "Good", "Strong"];
  return { score: score as 0 | 1 | 2 | 3 | 4, label: labels[score] };
}

export function AuthForm({ mode }: Props) {
  const router = useRouter();
  const search = useSearchParams();
  const next = search?.get("next") || "/bookmarks";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [capsOn, setCapsOn] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const isSignup = mode === "signup";
  const endpoint = isSignup ? "/api/auth/signup" : "/api/auth/login";
  const strength = isSignup ? passwordStrength(password) : null;

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
      toast.success(isSignup ? "Welcome to Stockscore" : "Welcome back");
      // Admins land on the admin dashboard unless an explicit non-default
      // destination was requested via ?next=.
      const explicitNext = search?.get("next");
      const dest = data?.isAdmin && !explicitNext ? "/admin" : next;
      router.push(dest);
      router.refresh();
    } catch {
      setError("Network error - check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  const strengthBars = [0, 1, 2, 3];
  const strengthColor = (i: number) => {
    if (!strength || strength.score === 0) return "bg-ink-700/60";
    if (i >= strength.score) return "bg-ink-700/60";
    if (strength.score <= 1) return "bg-bad";
    if (strength.score === 2) return "bg-warn";
    if (strength.score === 3) return "bg-accent/70";
    return "bg-accent";
  };

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

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        {isSignup && (
          <label className="block">
            <span className="text-xs font-medium text-chalk-300/70 uppercase tracking-wider">Name (optional)</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
              autoFocus
              className="mt-1.5 w-full rounded-xl border border-ink-700/60 bg-ink-900/60 px-4 py-2.5 text-sm text-chalk-50 placeholder-chalk-300/30 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all"
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
            autoFocus={!isSignup}
            className="mt-1.5 w-full rounded-xl border border-ink-700/60 bg-ink-900/60 px-4 py-2.5 text-sm text-chalk-50 placeholder-chalk-300/30 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all"
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
          <div className="relative mt-1.5">
            <input
              type={showPw ? "text" : "password"}
              required
              minLength={isSignup ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyUp={(e) => setCapsOn(e.getModifierState && e.getModifierState("CapsLock"))}
              onBlur={() => setCapsOn(false)}
              autoComplete={isSignup ? "new-password" : "current-password"}
              className="w-full rounded-xl border border-ink-700/60 bg-ink-900/60 pl-4 pr-11 py-2.5 text-sm text-chalk-50 placeholder-chalk-300/30 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all"
              placeholder={isSignup ? "At least 8 characters" : ""}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              aria-label={showPw ? "Hide password" : "Show password"}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-chalk-300/50 hover:text-chalk-100 transition-colors p-1"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {capsOn && (
            <p className="mt-1.5 text-[11px] text-warn flex items-center gap-1">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-warn" /> Caps Lock is on
            </p>
          )}

          {isSignup && password && (
            <div className="mt-2">
              <div className="flex gap-1">
                {strengthBars.map((i) => (
                  <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${strengthColor(i)}`} />
                ))}
              </div>
              <p className="mt-1 text-[11px] text-chalk-300/60">{strength?.label}</p>
            </div>
          )}
        </label>

        {error && (
          <p role="alert" aria-live="polite" className="rounded-lg border border-bad/30 bg-bad/10 px-3 py-2 text-sm text-bad">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-accent text-ink-950 px-4 py-2.5 text-sm font-semibold hover:bg-accent/90 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all"
        >
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {busy ? (isSignup ? "Creating account…" : "Signing in…") : isSignup ? "Create account" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-chalk-300/60">
        {isSignup ? (
          <>Already have an account? <Link href={`/login${next !== "/bookmarks" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-accent hover:underline">Sign in</Link></>
        ) : (
          <>Don&apos;t have an account? <Link href={`/signup${next !== "/bookmarks" ? `?next=${encodeURIComponent(next)}` : ""}`} className="text-accent hover:underline">Sign up</Link></>
        )}
      </p>
    </div>
  );
}
