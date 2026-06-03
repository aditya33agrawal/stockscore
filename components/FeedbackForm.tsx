"use client";

import { useState } from "react";
import { Send, CheckCircle } from "lucide-react";
import clsx from "clsx";

const TYPES = [
  { value: "opportunity", label: "Opportunity",  placeholder: "Tell me about the role, team, or organisation — I'd love to hear more." },
  { value: "feedback",    label: "Feedback",     placeholder: "Any thoughts, suggestions, or general observations?" },
  { value: "feature",     label: "Feature",      placeholder: "What would make Stockscore more useful for you?" },
  { value: "bug",         label: "Bug",          placeholder: "What went wrong? Where did you see it?" },
  { value: "other",       label: "Other",        placeholder: "What's on your mind?" },
] as const;

type FeedbackType = (typeof TYPES)[number]["value"];

export function FeedbackForm() {
  const [type, setType]         = useState<FeedbackType>("opportunity");
  const [message, setMessage]   = useState("");
  const [email, setEmail]       = useState("");
  const [status, setStatus]     = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const selectedType = TYPES.find((t) => t.value === type)!;
  const charLimit = 2000;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;

    setStatus("loading");
    setErrorMsg("");

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message: message.trim(), email: email.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error?.message ?? "Something went wrong");
      }

      setStatus("done");
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to send. Please try again.");
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/15 text-accent ring-1 ring-accent/30">
          <CheckCircle className="h-7 w-7" />
        </span>
        <div>
          <p className="text-lg font-semibold text-chalk-50">Message received.</p>
          <p className="mt-1 text-sm text-chalk-300/60">
            {type === "opportunity"
              ? "Thank you for reaching out. I will get back to you shortly."
              : `Your ${selectedType.label.toLowerCase()} has been noted.${email ? " I will follow up if needed." : ""}`}
          </p>
        </div>
        <button
          onClick={() => { setStatus("idle"); setMessage(""); setEmail(""); setType("opportunity"); }}
          className="mt-2 text-sm text-accent hover:underline underline-offset-2"
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Type pill selector */}
      <div>
        <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-chalk-300/50">
          Nature of enquiry
        </p>
        <div className="flex flex-wrap gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={clsx(
                "rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition-all duration-150",
                type === t.value
                  ? "bg-accent/15 text-accent ring-accent/40"
                  : "bg-ink-800/50 text-chalk-300 ring-ink-700 hover:bg-ink-800 hover:text-chalk-50",
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message */}
      <div>
        <label
          htmlFor="feedback-message"
          className="mb-2 block text-xs font-semibold uppercase tracking-widest text-chalk-300/50"
        >
          Message <span className="text-accent">*</span>
        </label>
        <textarea
          id="feedback-message"
          required
          rows={4}
          maxLength={charLimit}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={selectedType.placeholder}
          className="w-full resize-none rounded-xl border border-ink-700/60 bg-ink-900/50 px-4 py-3 text-sm text-chalk-50 placeholder-chalk-300/30 outline-none ring-0 transition focus:border-accent/40 focus:bg-ink-900 focus:ring-1 focus:ring-accent/20"
        />
        <p className="mt-1 text-right text-xs text-chalk-300/30">
          {message.length} / {charLimit}
        </p>
      </div>

      {/* Email */}
      <div>
        <label
          htmlFor="feedback-email"
          className="mb-2 block text-xs font-semibold uppercase tracking-widest text-chalk-300/50"
        >
          Email{" "}
          <span className="font-normal normal-case tracking-normal text-chalk-300/30">
            — {type === "opportunity" ? "required for follow-up" : "optional, for a reply"}
          </span>
        </label>
        <input
          id="feedback-email"
          type="email"
          required={type === "opportunity"}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          className="w-full rounded-xl border border-ink-700/60 bg-ink-900/50 px-4 py-3 text-sm text-chalk-50 placeholder-chalk-300/30 outline-none transition focus:border-accent/40 focus:bg-ink-900 focus:ring-1 focus:ring-accent/20"
        />
      </div>

      {/* Error */}
      {status === "error" && (
        <p className="rounded-lg bg-bad/10 px-4 py-2.5 text-sm text-bad ring-1 ring-bad/20">
          {errorMsg}
        </p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={status === "loading" || !message.trim()}
        className={clsx(
          "flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold transition-all duration-150",
          status === "loading" || !message.trim()
            ? "cursor-not-allowed bg-accent/30 text-accent/50"
            : "bg-accent/20 text-accent ring-1 ring-accent/30 hover:bg-accent/30 hover:ring-accent/50 active:scale-[0.99]",
        )}
      >
        {status === "loading" ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-accent/30 border-t-accent" />
            Sending…
          </>
        ) : (
          <>
            <Send className="h-4 w-4" />
            Send message
          </>
        )}
      </button>
    </form>
  );
}
