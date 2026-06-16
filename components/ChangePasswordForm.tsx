"use client";

import { useState } from "react";
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
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
      toast.success("Password updated");
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch {
      setError("Network error - check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  function eyeBtn(show: boolean, setShow: (v: boolean) => void) {
    return (
      <button
        type="button"
        onClick={() => setShow(!show)}
        aria-label={show ? "Hide password" : "Show password"}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-chalk-300/50 hover:text-chalk-100 transition-colors p-1"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    );
  }

  const inputCls =
    "w-full rounded-xl border border-ink-700/60 bg-ink-900/60 pl-4 pr-11 py-2.5 text-sm text-chalk-50 placeholder-chalk-300/30 focus:outline-none focus:border-accent/60 focus:ring-2 focus:ring-accent/20 transition-all";

  return (
    <div className="glass border-subtle rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-1">
        <KeyRound className="h-4 w-4 text-accent" />
        <h2 className="text-base font-semibold text-chalk-50">Change password</h2>
      </div>
      <p className="text-xs text-chalk-300/60 mb-5">
        You&apos;ll stay signed in on this device; other sessions will be signed out.
      </p>

      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="text-xs font-medium text-chalk-300/70 uppercase tracking-wider">Current password</span>
          <div className="relative mt-1.5">
            <input
              type={showCurrent ? "text" : "password"}
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              autoComplete="current-password"
              className={inputCls}
            />
            {eyeBtn(showCurrent, setShowCurrent)}
          </div>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-chalk-300/70 uppercase tracking-wider">New password</span>
          <div className="relative mt-1.5">
            <input
              type={showNew ? "text" : "password"}
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              className={inputCls}
              placeholder="At least 8 characters"
            />
            {eyeBtn(showNew, setShowNew)}
          </div>
        </label>

        <label className="block">
          <span className="text-xs font-medium text-chalk-300/70 uppercase tracking-wider">Confirm new password</span>
          <input
            type={showNew ? "text" : "password"}
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
          {confirm && confirm === newPassword && newPassword.length >= 8 && (
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
          {busy ? "Updating…" : "Update password"}
        </button>
      </form>
    </div>
  );
}
