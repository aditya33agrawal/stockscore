"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import clsx from "clsx";
import { UserMenu } from "@/components/UserMenu";

const NAV_LINKS = [
  { href: "/sectors",          label: "Sectors" },
  { href: "/methodology",      label: "Methodology" },
  { href: "/asset-allocation", label: "Asset Allocation" },
  { href: "/blog",             label: "Blog" },
  { href: "/about",            label: "About" },
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
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(0,210,255,0.07)] bg-ink-950/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-accent/20 bg-accent/10 text-accent transition-all group-hover:border-accent/40 group-hover:bg-accent/15 group-hover:shadow-glow-sm">
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
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/contact"
            className="text-sm font-medium text-chalk-300 hover:text-chalk-50 transition-colors px-3 py-2"
          >
            Contact
          </Link>
          <UserMenu />
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex h-9 w-9 items-center justify-center rounded-lg text-chalk-300 hover:bg-ink-800 hover:text-chalk-50 transition-colors"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="md:hidden border-t border-[rgba(0,210,255,0.07)] bg-ink-950 px-4 py-3">
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
    </header>
  );
}
