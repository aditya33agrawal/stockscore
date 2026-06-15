"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Search } from "lucide-react";
import { useEffect, useState } from "react";
import clsx from "clsx";
import { UserMenu } from "@/components/UserMenu";
import { ThemeToggle } from "@/components/ThemeToggle";
import { GlobalSearch } from "@/components/GlobalSearch";

const NAV_LINKS = [
  { href: "/sectors",          label: "Sectors" },
  { href: "/learn",            label: "Learn" },
  { href: "/methodology",      label: "Methodology" },
  { href: "/asset-allocation", label: "Asset Allocation" },
  { href: "/blog",             label: "Blog" },
  { href: "/contact",          label: "Contact" },
];

function WaveformIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  );
}

export function Navbar() {
  const [open, setOpen]           = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  // Lock body scroll when mobile menu open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  // Add subtle border lift on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={clsx(
        "sticky top-0 z-40 transition-all duration-200",
        scrolled
          ? "border-b border-[rgb(var(--accent)_/_0.12)] bg-ink-950/90 backdrop-blur-xl shadow-[0_4px_24px_rgba(0,0,0,0.35)]"
          : "border-b border-[rgb(var(--accent)_/_0.07)] bg-ink-950/80 backdrop-blur-xl",
      )}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent transition-all group-hover:border-accent/40 group-hover:bg-accent/15">
            <WaveformIcon />
          </span>
          <span className="text-[15px] font-bold tracking-tight text-chalk-50">
            Stock<span className="text-accent">score</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5 text-sm">
          {NAV_LINKS.map((l) => {
            const active = pathname === l.href || pathname.startsWith(l.href + "/");
            return (
              <Link
                key={l.href}
                href={l.href}
                className={clsx(
                  "rounded-lg px-3.5 py-2 font-medium transition-all duration-150",
                  active
                    ? "text-accent bg-accent/10"
                    : "text-chalk-300 hover:text-chalk-50 hover:bg-ink-800",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Desktop right CTA */}
        <div className="hidden md:flex items-center gap-2">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink-700 text-chalk-300 hover:text-accent hover:border-accent/30 transition-colors"
          >
            <Search className="h-4 w-4" />
          </button>
          <ThemeToggle />
          <UserMenu />
        </div>

        {/* Mobile: search + hamburger */}
        <div className="md:hidden flex items-center gap-1">
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-chalk-300 hover:bg-ink-800 hover:text-chalk-50 transition-colors"
          >
            <Search className="h-5 w-5" />
          </button>
          <ThemeToggle />
          <button
            className="flex h-9 w-9 items-center justify-center rounded-lg text-chalk-300 hover:bg-ink-800 hover:text-chalk-50 transition-colors"
            onClick={() => setOpen((o) => !o)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 top-16 z-30 bg-ink-950/70 backdrop-blur-sm fade-in"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile dropdown */}
      {open && (
        <nav className="md:hidden relative z-40 border-t border-[rgb(var(--accent)_/_0.07)] bg-ink-950 px-4 py-3 drawer-down">
          <ul className="space-y-0.5">
            {[...NAV_LINKS, { href: "/contact", label: "Contact" }, { href: "/profile", label: "Profile" }, { href: "/bookmarks", label: "My Bookmarks" }].map((l) => {
              const active = pathname === l.href || pathname.startsWith(l.href + "/");
              return (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className={clsx(
                      "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "text-accent bg-accent/10"
                        : "text-chalk-300 hover:bg-ink-800 hover:text-chalk-50",
                    )}
                  >
                    {l.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      )}
      <GlobalSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  );
}
