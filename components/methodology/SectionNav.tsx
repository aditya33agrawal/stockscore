"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

interface NavItem {
  id: string;
  label: string;
}

const ITEMS: NavItem[] = [
  { id: "philosophy", label: "Philosophy" },
  { id: "math", label: "Scoring math" },
  { id: "categories", label: "Categories" },
  { id: "bonuses", label: "Bonuses" },
  { id: "penalties", label: "Penalties" },
  { id: "bands", label: "Score bands" },
  { id: "limits", label: "Limitations" },
];

export function SectionNav() {
  const [active, setActive] = useState<string>("philosophy");

  useEffect(() => {
    const sections = ITEMS
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) return;

    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) {
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
      aria-label="Jump to section"
      className="hidden xl:block fixed top-24 left-4 w-44 z-30"
    >
      <p className="text-[9px] font-semibold uppercase tracking-[0.14em] text-chalk-300/40 mb-3 pl-3">
        On this page
      </p>
      <ul className="space-y-0.5 border-l border-[rgb(var(--chalk-100)_/_0.06)]">
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
