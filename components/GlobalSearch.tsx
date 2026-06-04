"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Search, X, TrendingUp, Building2 } from "lucide-react";
import type { SectorIndexEntry } from "@/lib/types";
import type { CompanyIndexEntry } from "@/lib/data";

type Result =
  | { kind: "sector";  sector:  SectorIndexEntry }
  | { kind: "company"; company: CompanyIndexEntry };

export function GlobalSearch({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [q, setQ]               = useState("");
  const [sectors, setSectors]   = useState<SectorIndexEntry[]>([]);
  const [companies, setCompanies] = useState<CompanyIndexEntry[]>([]);
  const [fetched, setFetched]   = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Fetch index data once on first open
  useEffect(() => {
    if (open && !fetched) {
      fetch("/api/search")
        .then((r) => r.json())
        .then((d) => {
          setSectors(d.sectors ?? []);
          setCompanies(d.companies ?? []);
          setFetched(true);
        })
        .catch(() => setFetched(true));
    }
  }, [open, fetched]);

  // Focus + reset
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => inputRef.current?.focus(), 40);
      return () => clearTimeout(t);
    } else {
      setQ("");
    }
  }, [open]);

  // Escape
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [open, onClose]);

  // Body scroll lock
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  const needle = q.trim().toLowerCase();
  const results = useMemo<Result[]>(() => {
    if (!needle) return [];
    return [
      ...sectors
        .filter((s) => s.name.toLowerCase().includes(needle) || (s.description ?? "").toLowerCase().includes(needle))
        .map((s) => ({ kind: "sector" as const, sector: s })),
      ...companies
        .filter((c) => c.name.toLowerCase().includes(needle) || c.ticker.toLowerCase().includes(needle))
        .map((c) => ({ kind: "company" as const, company: c })),
    ].slice(0, 9);
  }, [needle, sectors, companies]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[72px] px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ background: "rgb(var(--ink-950) / 0.65)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input row */}
        <div
          className="flex items-center gap-3 rounded-2xl border px-5 py-1"
          style={{
            background: "rgb(var(--ink-900) / 0.78)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            borderColor: "rgb(var(--ink-700))",
            boxShadow: "0 20px 60px rgba(74,74,74,0.16)",
          }}
        >
          <Search className="h-4 w-4 shrink-0 text-accent/60" />
          <input
            ref={inputRef}
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search any company or sector…"
            className="flex-1 bg-transparent py-3.5 text-[15px] text-chalk-100 placeholder:text-chalk-300/50 outline-none focus-visible:outline-none"
          />
          <button
            onClick={onClose}
            aria-label="Close search"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-chalk-300/50 hover:text-chalk-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Results list */}
        {results.length > 0 && (
          <div
            className="mt-2 rounded-2xl border overflow-hidden"
            style={{
              background: "rgb(var(--ink-900) / 0.85)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderColor: "rgb(var(--ink-700))",
              boxShadow: "0 20px 60px rgba(74,74,74,0.16)",
            }}
          >
            <ul>
              {results.map((r) =>
                r.kind === "sector" ? (
                  <li key={`s-${r.sector.slug}`}>
                    <Link
                      href={`/sector/${r.sector.slug}`}
                      onClick={onClose}
                      className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-accent/[0.05] transition-colors border-b last:border-0"
                      style={{ borderColor: "rgb(var(--ink-700)/0.5)" }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent/10 text-accent shrink-0">
                          <TrendingUp className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-chalk-50 text-sm truncate">{r.sector.name}</p>
                          <p className="text-[11px] text-chalk-300/60 mt-0.5">
                            Sector · {r.sector.companies_count} companies
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-medium text-accent/60 shrink-0">Sector →</span>
                    </Link>
                  </li>
                ) : (
                  <li key={`c-${r.company.ticker}`}>
                    <Link
                      href={`/sector/${r.company.sector_slug}/${r.company.slug}`}
                      onClick={onClose}
                      className="flex items-center justify-between gap-4 px-5 py-3.5 hover:bg-accent/[0.05] transition-colors border-b last:border-0"
                      style={{ borderColor: "rgb(var(--ink-700)/0.5)" }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
                          style={{ background: "rgb(var(--ink-800))", color: "rgb(var(--chalk-300)/0.7)" }}
                        >
                          <Building2 className="h-3.5 w-3.5" />
                        </span>
                        <div className="min-w-0">
                          <p className="font-semibold text-chalk-50 text-sm truncate">{r.company.name}</p>
                          <p className="text-[11px] text-chalk-300/60 mt-0.5 num">
                            {r.company.ticker} · {r.company.sector_name}
                          </p>
                        </div>
                      </div>
                      <span className="num text-sm font-bold text-accent shrink-0">
                        {r.company.final_score.toFixed(1)}
                      </span>
                    </Link>
                  </li>
                ),
              )}
            </ul>
          </div>
        )}

        {needle && results.length === 0 && (
          <div
            className="mt-2 rounded-2xl border px-5 py-6 text-sm text-chalk-300/60"
            style={{
              background: "rgb(var(--ink-900) / 0.85)",
              backdropFilter: "blur(16px)",
              WebkitBackdropFilter: "blur(16px)",
              borderColor: "rgb(var(--ink-700))",
              boxShadow: "0 20px 60px rgba(74,74,74,0.12)",
            }}
          >
            No results for{" "}
            <span className="text-chalk-100 font-medium">&ldquo;{q}&rdquo;</span>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
