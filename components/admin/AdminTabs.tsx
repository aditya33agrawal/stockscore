"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/refresh", label: "Refresh" },
  { href: "/admin/runs", label: "Run History" },
];

export function AdminTabs() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-1 border-b border-[rgb(var(--accent)_/_0.1)]">
      {TABS.map((t) => {
        const active = t.href === "/admin" ? pathname === "/admin" : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={clsx(
              "-mb-px border-b-2 px-3.5 py-2.5 text-sm font-medium transition-colors",
              active
                ? "border-accent text-accent"
                : "border-transparent text-chalk-300 hover:text-chalk-50",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
