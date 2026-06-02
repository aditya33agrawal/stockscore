"use client";

import { useEffect, useState } from "react";
import { List, X } from "lucide-react";
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
  const [sheetOpen, setSheetOpen] = useState(false);

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

  // Lock body scroll when sheet open
  useEffect(() => {
    if (sheetOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [sheetOpen]);

  // Close sheet on Esc
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setSheetOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [sheetOpen]);

  const activeLabel = ITEMS.find((i) => i.id === active)?.label ?? "On this page";

  return (
    <>
      {/* Desktop / XL fixed sidebar */}
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

      {/* Mobile/tablet floating "sections" button */}
      <button
        type="button"
        onClick={() => setSheetOpen(true)}
        aria-label="Open page sections"
        className="xl:hidden fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 rounded-full border border-accent/35 bg-ink-900/90 backdrop-blur-xl px-4 py-2.5 text-xs font-semibold text-accent shadow-[0_8px_24px_rgba(0,0,0,0.4)] hover:bg-ink-800/90 transition-colors"
      >
        <List className="h-4 w-4" />
        <span className="max-w-[140px] truncate">{activeLabel}</span>
      </button>

      {/* Mobile sheet */}
      {sheetOpen && (
        <div className="xl:hidden fixed inset-0 z-50 flex items-end sm:items-center sm:justify-center">
          <div
            className="absolute inset-0 bg-ink-950/70 backdrop-blur-sm fade-in"
            onClick={() => setSheetOpen(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-label="Page sections"
            className="relative w-full sm:max-w-md sm:rounded-2xl rounded-t-2xl border border-[rgba(0,210,255,0.18)] bg-ink-950/95 backdrop-blur-xl p-5 sheet-up shadow-[0_-12px_40px_rgba(0,0,0,0.5)] max-h-[80vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-chalk-300/60">On this page</p>
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                aria-label="Close"
                className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-chalk-300/70 hover:bg-ink-800 hover:text-chalk-50 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <ul className="space-y-0.5">
              {ITEMS.map((item) => {
                const isActive = active === item.id;
                return (
                  <li key={item.id}>
                    <a
                      href={`#${item.id}`}
                      onClick={() => setSheetOpen(false)}
                      className={clsx(
                        "block rounded-lg px-3 py-2.5 text-sm transition-colors",
                        isActive
                          ? "bg-accent/10 text-accent"
                          : "text-chalk-200 hover:bg-ink-800 hover:text-chalk-50",
                      )}
                    >
                      {item.label}
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
