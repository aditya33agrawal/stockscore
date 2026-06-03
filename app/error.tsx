"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw, ArrowLeft } from "lucide-react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md px-6 py-24 text-center">
      <div className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-bad/30 bg-bad/10">
        <AlertTriangle className="h-7 w-7 text-bad" />
      </div>
      <h1 className="text-2xl font-bold text-chalk-50 mb-3">Something broke loading this page.</h1>
      <p className="text-sm text-chalk-300/60 mb-8">
        We&apos;ve logged the error. Try again, or head back home.
        {error?.digest && (
          <span className="block mt-3 text-[11px] text-chalk-300/40 num">
            Reference: {error.digest}
          </span>
        )}
      </p>
      <div className="flex justify-center gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-xl bg-accent text-ink-950 px-5 py-2.5 text-sm font-semibold hover:bg-accent/90 active:scale-[0.98] transition-all"
        >
          <RotateCw className="h-4 w-4" /> Try again
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 rounded-xl border border-[rgb(var(--chalk-100)_/_0.08)] px-5 py-2.5 text-sm font-medium text-chalk-300 hover:text-chalk-50 hover:border-[rgb(var(--chalk-100)_/_0.18)] transition-all"
        >
          <ArrowLeft className="h-4 w-4" /> Back home
        </Link>
      </div>
    </div>
  );
}
