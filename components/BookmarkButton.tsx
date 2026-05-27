"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bookmark } from "lucide-react";
import clsx from "clsx";

interface Props {
  sectorSlug: string;
  companySlug: string;
  companyTicker?: string;
  companyName?: string;
}

export function BookmarkButton({ sectorSlug, companySlug, companyTicker, companyName }: Props) {
  const router = useRouter();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meRes, bmRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/bookmarks"),
        ]);
        const me = await meRes.json().catch(() => ({}));
        if (cancelled) return;
        const hasUser = !!me?.user;
        setSignedIn(hasUser);
        if (hasUser && bmRes.ok) {
          const bm = await bmRes.json().catch(() => ({ bookmarks: [] }));
          if (cancelled) return;
          const found = (bm.bookmarks ?? []).some(
            (b: { sector_slug: string; company_slug: string }) =>
              b.sector_slug === sectorSlug && b.company_slug === companySlug,
          );
          setBookmarked(found);
        }
      } catch {
        if (!cancelled) setSignedIn(false);
      }
    })();
    return () => { cancelled = true; };
  }, [sectorSlug, companySlug]);

  async function toggle() {
    if (signedIn === false) {
      router.push("/login");
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      if (bookmarked) {
        const url = `/api/bookmarks?sector_slug=${encodeURIComponent(sectorSlug)}&company_slug=${encodeURIComponent(companySlug)}`;
        const res = await fetch(url, { method: "DELETE" });
        if (res.ok) setBookmarked(false);
      } else {
        const res = await fetch("/api/bookmarks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sector_slug: sectorSlug,
            company_slug: companySlug,
            company_ticker: companyTicker,
            company_name: companyName,
          }),
        });
        if (res.status === 401) {
          router.push("/login");
          return;
        }
        if (res.ok) setBookmarked(true);
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy || signedIn === null}
      title={bookmarked ? "Remove bookmark" : signedIn === false ? "Sign in to bookmark" : "Bookmark this company"}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all",
        bookmarked
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-[rgba(255,255,255,0.08)] text-chalk-300/70 hover:border-[rgba(255,255,255,0.15)] hover:text-chalk-50",
      )}
    >
      <Bookmark className={clsx("h-3.5 w-3.5", bookmarked && "fill-current")} />
      {bookmarked ? "Bookmarked" : "Bookmark"}
    </button>
  );
}
