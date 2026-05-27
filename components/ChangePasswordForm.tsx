"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    if (newPassword !== confirm) {
      setError("New passwords do not match");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Could not change password");
        return;
      }
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch {
      setError("Network error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass border-subtle rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <KeyRound className="h-4 w-4 text-accent" />
        <h2 className="text-base font-semibold text-chalk-50">Change password</h2>
      </div>
      <p className="text-xs text-chalk-300/60 mb-5">
        You&apos;ll stay signed in on this device; other sessions will be signed out.
      </p>

      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block">
          <span className="text-xs font-medium text-chalk-300/70 uppercase tracking-wider">Current password</span>
          <input
            type="password"
            required
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            className="mt-1.5 w-full rounded-xl border border-ink-700/60 bg-ink-900/60 px-4 py-2.5 text-sm text-chalk-50 placeholder-chalk-300/30 focus:outline-none focus:border-accent/50"
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
        {success && (
          <p className="rounded-lg border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-accent">
            Password updated.
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-xl bg-accent text-ink-950 px-4 py-2.5 text-sm font-semibold hover:bg-accent/90 disabled:opacity-50"
        >
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
