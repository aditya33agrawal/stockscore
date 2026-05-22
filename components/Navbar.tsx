"use client";

import Link from "next/link";
import { LineChart, Menu, X } from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { href: "/", label: "Sectors" },
  { href: "/methodology", label: "Methodology" },
  { href: "/about", label: "About" },
  { href: "/terms", label: "Terms" },
  { href: "/resume", label: "Resume" },
  { href: "/contact", label: "Contact" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/60 bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="/"
          className="flex items-center gap-2 group"
          onClick={() => setOpen(false)}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/15 text-accent ring-1 ring-accent/30">
            <LineChart className="h-4 w-4" />
          </span>
          <span className="font-semibold tracking-tight">
            Stock<span className="text-accent">score</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-1 text-sm text-chalk-300">
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 hover:bg-ink-800 hover:text-chalk-50 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex items-center justify-center h-9 w-9 rounded-md text-chalk-300 hover:bg-ink-800 hover:text-chalk-50 transition-colors"
          onClick={() => setOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {open && (
        <nav className="md:hidden border-t border-ink-700/60 bg-ink-950 px-4 py-3">
          <ul className="space-y-0.5">
            {NAV_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-3 py-2.5 text-sm text-chalk-300 hover:bg-ink-800 hover:text-chalk-50 transition-colors"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
