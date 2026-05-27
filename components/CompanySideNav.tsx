"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

interface NavItem {
  id: string;
  label: string;
}

// Order must match the actual section order in
// app/sector/[slug]/[company]/page.tsx so the active highlight tracks
// linearly as the user scrolls.
const ITEMS: NavItem[] = [
  { id: "overview",      label: "Overview" },
  { id: "breakdown",     label: "Score Breakdown" },
  { id: "bonuses",       label: "Bonuses" },
  { id: "penalties",     label: "Penalties" },
  { id: "strengths",     label: "Strengths & Risks" },
  { id: "peers",         label: "Peers" },
  { id: "about-company", label: "About Company" },
  { id: "ratios",        label: "Key Ratios" },
  { id: "growth",        label: "Growth & CAGR" },
  { id: "technicals",    label: "Price & Technicals" },
  { id: "charts",        label: "Financial Charts" },
  { id: "tables",        label: "Financial Tables" },
  { id: "announcements", label: "Announcements" },
];

export function CompanySideNav() {
  const [active, setActive] = useState<string>("overview");

  useEffect(() => {
    // Track which section is currently most visible
    const sections = ITEMS
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
          // Choose the one closest to the top of the viewport
          visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: "-20% 0px -60% 0px", threshold: 0 },
    );

    sections.forEach((s) => obs.observe(s));
    return () => obs.disconnect();
  }, []);

  return (
    <nav
      aria-label="Page sections"
      className="hidden xl:block fixed top-24 left-4 w-44 z-30"
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-chalk-300/40 mb-3 pl-3">
        On this page
      </p>
      <ul className="space-y-0.5 border-l border-[rgba(255,255,255,0.06)]">
        {ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={clsx(
                  "block pl-3 pr-2 py-1.5 text-[12px] leading-snug transition-colors border-l-2 -ml-px",
                  isActive
                    ? "border-accent text-accent"
                    : "border-transparent text-chalk-300/45 hover:text-chalk-100",
                )}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
