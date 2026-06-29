"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (newPassword !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Could not reset password");
        return;
      }
      toast.success("Password reset - signing you in");
      router.push("/watchlist");
      router.refresh();
    } catch {
      setError("Network error - check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-chalk-50 mb-2">Reset password</h1>
      <p className="text-sm text-chalk-300/60 mb-8">
        Enter the email on your account and choose a new password. You&apos;ll be signed in once it&apos;s updated.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-xs font-medium text-chalk-300/70 uppercase tracking-wider">Email</span>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="mt-1.5 w-full rounded-xl border border-ink-700/60 bg-ink-900/60 px-4 py-2.5 text-sm text-chalk-50 placeholder-chalk-300/30 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-chalk-300/70 uppercase tracking-wider">New password</span>
          <div className="relative mt-1.5">
            <input
              type={showPw ? "text" : "password"}
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className="w-full rounded-xl border border-ink-700/60 bg-ink-900/60 pl-4 pr-11 py-2.5 text-sm text-chalk-50 placeholder-chalk-300/30 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all"
              placeholder="At least 8 characters"
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
        </label>

        <label className="block">
          <span className="text-xs font-medium text-chalk-300/70 uppercase tracking-wider">Confirm new password</span>
          <input
            type={showPw ? "text" : "password"}
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            className={`mt-1.5 w-full rounded-xl border ${
              confirm && confirm !== newPassword ? "border-bad/50" : "border-ink-700/60"
            } bg-ink-900/60 px-4 py-2.5 text-sm text-chalk-50 placeholder-chalk-300/30 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all`}
          />
          {confirm && confirm !== newPassword && (
            <p className="mt-1 text-[11px] text-bad">Passwords don&apos;t match yet</p>
          )}
          {confirm && confirm === newPassword && (
            <p className="mt-1 text-[11px] text-accent flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Passwords match
            </p>
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
          {busy ? "Updating…" : "Reset password"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-chalk-300/60">
        Remembered it? <Link href="/login" className="text-accent hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
