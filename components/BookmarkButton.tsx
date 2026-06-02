"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, Loader2 } from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";

interface Props {
  sectorSlug: string;
  companySlug: string;
  companyTicker?: string;
  companyName?: string;
}

export function BookmarkButton({ sectorSlug, companySlug, companyTicker, companyName }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pop, setPop] = useState(false);
  const iconRef = useRef<SVGSVGElement | null>(null);

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

  function pulse() {
    setPop(true);
    window.setTimeout(() => setPop(false), 340);
  }

  async function toggle() {
    if (signedIn === false) {
      const next = encodeURIComponent(pathname || "/");
      router.push(`/login?next=${next}`);
      return;
    }
    if (busy) return;
    setBusy(true);
    try {
      if (bookmarked) {
        const url = `/api/bookmarks?sector_slug=${encodeURIComponent(sectorSlug)}&company_slug=${encodeURIComponent(companySlug)}`;
        const res = await fetch(url, { method: "DELETE" });
        if (res.ok) {
          setBookmarked(false);
          toast.success("Removed from bookmarks");
        } else {
          toast.error("Couldn't remove — try again");
        }
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
          const next = encodeURIComponent(pathname || "/");
          router.push(`/login?next=${next}`);
          return;
        }
        if (res.ok) {
          setBookmarked(true);
          pulse();
          toast.success(`Saved ${companyTicker ?? companyName ?? "company"}`);
        } else {
          toast.error("Couldn't save — try again");
        }
      }
    } catch {
      toast.error("Network error — check your connection");
    } finally {
      setBusy(false);
    }
  }

  const loading = signedIn === null;

  return (
    <button
      onClick={toggle}
      disabled={busy || loading}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
      aria-pressed={bookmarked}
      title={bookmarked ? "Remove bookmark" : signedIn === false ? "Sign in to bookmark" : "Bookmark this company"}
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.97]",
        bookmarked
          ? "border-accent/40 bg-accent/10 text-accent hover:bg-accent/15"
          : "border-[rgba(255,255,255,0.08)] text-chalk-300/70 hover:border-[rgba(255,255,255,0.18)] hover:text-chalk-50",
        (busy || loading) && "opacity-70 cursor-wait",
      )}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Bookmark
          ref={iconRef}
          className={clsx("h-3.5 w-3.5 transition-transform", bookmarked && "fill-current", pop && "bookmark-pop")}
        />
      )}
      {bookmarked ? "Bookmarked" : "Bookmark"}
    </button>
  );
}
