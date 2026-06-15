"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Bookmark, LogIn, LogOut, User, RefreshCw } from "lucide-react";
import { toast } from "sonner";

interface SessionUser {
  id: number;
  email: string;
  name: string | null;
}

function initialFor(u: SessionUser): string {
  const src = (u.name ?? u.email ?? "?").trim();
  return src.charAt(0).toUpperCase();
}

export function UserMenu() {
  const router = useRouter();
  const pathname = usePathname();
  // Session state is fetched client-side (kept out of the server render so
  // pages aren't forced dynamic by a per-request DB session lookup).
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Fetch on mount and again on route change — keeps the menu correct after a
  // client-side login/logout transition (the navbar stays mounted across it).
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { cache: "no-store", credentials: "same-origin" })
      .then((r) => r.json())
      .then((d) => { if (!cancelled) { setUser(d?.user ?? null); setIsAdmin(d?.isAdmin ?? false); setLoaded(true); } })
      .catch(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast.success("Signed out");
    } catch {
      toast.error("Couldn't sign out — try again");
    }
    setUser(null);
    setOpen(false);
    router.push("/");
    router.refresh();
  }

  // Avoid a "Sign in" flash for already-logged-in users while the session
  // check is in flight — render an empty placeholder of the same size.
  if (!loaded) {
    return <div className="h-9 w-9" aria-hidden="true" />;
  }

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex items-center gap-1.5 rounded-xl border border-accent/20 bg-accent/10 px-3 py-2 text-sm font-semibold text-accent hover:bg-accent/15 hover:border-accent/40 transition-all"
      >
        <LogIn className="h-3.5 w-3.5" /> Sign in
      </Link>
    );
  }

  const displayName = user.name?.trim() || user.email.split("@")[0];

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        title={user.email}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-accent text-sm font-semibold hover:border-accent/50 hover:bg-accent/15 transition-all"
      >
        {initialFor(user)}
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-64 rounded-2xl border border-[rgb(var(--accent)_/_0.12)] bg-ink-950/95 backdrop-blur-xl shadow-2xl shadow-black/40 overflow-hidden z-50"
        >
          <div className="px-4 py-3 border-b border-[rgb(var(--accent)_/_0.07)]">
            <p className="text-sm font-semibold text-chalk-50 truncate">{displayName}</p>
            <p className="text-xs text-chalk-300/60 truncate mt-0.5">{user.email}</p>
          </div>
          <div className="py-1">
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-chalk-200 hover:bg-ink-800 hover:text-chalk-50 transition-colors"
            >
              <User className="h-4 w-4 text-chalk-300/70" /> Profile
            </Link>
            <Link
              href="/bookmarks"
              onClick={() => setOpen(false)}
              role="menuitem"
              className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-chalk-200 hover:bg-ink-800 hover:text-chalk-50 transition-colors"
            >
              <Bookmark className="h-4 w-4 text-chalk-300/70" /> My Bookmarks
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setOpen(false)}
                role="menuitem"
                className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-chalk-200 hover:bg-ink-800 hover:text-chalk-50 transition-colors"
              >
                <RefreshCw className="h-4 w-4 text-chalk-300/70" /> Admin Dashboard
              </Link>
            )}
            <button
              onClick={logout}
              role="menuitem"
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-chalk-200 hover:bg-ink-800 hover:text-chalk-50 transition-colors text-left"
            >
              <LogOut className="h-4 w-4 text-chalk-300/70" /> Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
