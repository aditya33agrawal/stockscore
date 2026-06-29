"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Star, Loader2 } from "lucide-react";
import clsx from "clsx";
import { toast } from "sonner";

interface Props {
  sectorSlug: string;
  companySlug: string;
  companyTicker?: string;
  companyName?: string;
}

export function WatchlistButton({ sectorSlug, companySlug, companyTicker, companyName }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [watching, setWatching] = useState(false);
  const [count, setCount] = useState(0);
  const [max, setMax] = useState(50);
  const [busy, setBusy] = useState(false);
  const [pop, setPop] = useState(false);
  const iconRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [meRes, wlRes] = await Promise.all([
          fetch("/api/auth/me"),
          fetch("/api/watchlist"),
        ]);
        const me = await meRes.json().catch(() => ({}));
        if (cancelled) return;
        const hasUser = !!me?.user;
        setSignedIn(hasUser);
        if (hasUser && wlRes.ok) {
          const wl = await wlRes.json().catch(() => ({ watchlist: [] }));
          if (cancelled) return;
          const list = wl.watchlist ?? [];
          const found = list.some(
            (b: { sector_slug: string; company_slug: string }) =>
              b.sector_slug === sectorSlug && b.company_slug === companySlug,
          );
          setWatching(found);
          setCount(typeof wl.count === "number" ? wl.count : list.length);
          if (typeof wl.max === "number") setMax(wl.max);
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
    if (!watching && count >= max) {
      toast.error(`Watchlist full (${max}/${max}) — remove a stock to add another.`);
      return;
    }
    setBusy(true);
    try {
      if (watching) {
        const url = `/api/watchlist?sector_slug=${encodeURIComponent(sectorSlug)}&company_slug=${encodeURIComponent(companySlug)}`;
        const res = await fetch(url, { method: "DELETE" });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          setWatching(false);
          if (typeof data.count === "number") setCount(data.count);
          toast.success("Removed from watchlist");
        } else {
          toast.error("Couldn't remove - try again");
        }
      } else {
        const res = await fetch("/api/watchlist", {
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
        if (res.status === 409) {
          const data = await res.json().catch(() => ({}));
          toast.error(data?.error?.message ?? `Watchlist full (${max}/${max}) — remove a stock to add another.`);
          setCount(max);
          return;
        }
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          setWatching(true);
          if (typeof data.count === "number") setCount(data.count);
          pulse();
          toast.success(`Added ${companyTicker ?? companyName ?? "company"} to watchlist`);
        } else {
          toast.error("Couldn't save - try again");
        }
      }
    } catch {
      toast.error("Network error - check your connection");
    } finally {
      setBusy(false);
    }
  }

  const loading = signedIn === null;
  const isFull = !watching && count >= max;

  return (
    <button
      onClick={toggle}
      disabled={busy || loading}
      aria-label={watching ? "Remove from watchlist" : "Add to watchlist"}
      aria-pressed={watching}
      title={
        watching
          ? "Remove from watchlist"
          : signedIn === false
            ? "Sign in to add to watchlist"
            : isFull
              ? `Watchlist full (${max}/${max})`
              : "Add to watchlist"
      }
      className={clsx(
        "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-medium transition-all active:scale-[0.97]",
        watching
          ? "border-accent/40 bg-accent/10 text-accent hover:bg-accent/15"
          : "border-[rgb(var(--chalk-100)_/_0.08)] text-chalk-300/70 hover:border-[rgb(var(--chalk-100)_/_0.18)] hover:text-chalk-50",
        (busy || loading) && "opacity-70 cursor-wait",
        isFull && !busy && !loading && "opacity-70 cursor-not-allowed",
      )}
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Star
          ref={iconRef}
          className={clsx("h-3.5 w-3.5 transition-transform", watching && "fill-current", pop && "bookmark-pop")}
        />
      )}
      {watching ? "Watching" : "Watch"}
    </button>
  );
}
