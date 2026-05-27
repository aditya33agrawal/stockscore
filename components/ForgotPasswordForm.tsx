"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="mt-1.5 w-full rounded-xl border border-ink-700/60 bg-ink-900/60 px-4 py-2.5 text-sm text-chalk-50 placeholder-chalk-300/30 focus:outline-none focus:border-accent/50"
            placeholder="you@example.com"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-chalk-300/70 uppercase tracking-wider">New password</span>
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            className="mt-1.5 w-full rounded-xl border border-ink-700/60 bg-ink-900/60 px-4 py-2.5 text-sm text-chalk-50 placeholder-chalk-300/30 focus:outline-none focus:border-accent/50"
            placeholder="At least 8 characters"
          />
        </label>

        <label className="block">
          <span className="text-xs font-medium text-chalk-300/70 uppercase tracking-wider">Confirm new password</span>
          <input
            type="password"
            required
            minLength={8}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            className="mt-1.5 w-full rounded-xl border border-ink-700/60 bg-ink-900/60 px-4 py-2.5 text-sm text-chalk-50 placeholder-chalk-300/30 focus:outline-none focus:border-accent/50"
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
          {busy ? "Updating…" : "Reset password"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-chalk-300/60">
        Remembered it? <Link href="/login" className="text-accent hover:underline">Sign in</Link>
      </p>
    </div>
  );
}
