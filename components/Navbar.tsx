import Link from "next/link";
import { LineChart } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-ink-700/60 bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-accent/15 text-accent ring-1 ring-accent/30">
            <LineChart className="h-4 w-4" />
          </span>
          <span className="font-semibold tracking-tight">
            Aditya<span className="text-accent">.</span>finance
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm text-chalk-300">
          {[
            { href: "/", label: "Sectors" },
            { href: "/methodology", label: "Methodology" },
            { href: "/about", label: "About" },
            { href: "/resume", label: "Resume" },
            { href: "/contact", label: "Contact" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-md px-3 py-1.5 hover:bg-ink-800 hover:text-chalk-50 transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
