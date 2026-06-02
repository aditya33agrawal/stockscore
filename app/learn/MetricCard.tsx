"use client";

import { useState } from "react";
import type { MetricEntry } from "@/lib/learn/types";

type Tab = "plain" | "method" | "read" | "traps";

const TABS: { id: Tab; label: string }[] = [
  { id: "plain", label: "Plain-English" },
  { id: "method", label: "Methodology" },
  { id: "read", label: "How to read" },
  { id: "traps", label: "Traps & Pairs" },
];

export default function MetricCard({ m }: { m: MetricEntry }) {
  const [tab, setTab] = useState<Tab>("plain");

  return (
    <section id={m.id} className="scroll-mt-20">
      <div className="rounded-2xl border border-ink-700/60 bg-ink-900/40 p-6 sm:p-8">
        {/* Header */}
        <div className="mb-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-accent mb-1">
            {m.category.replace("-", " ")}
          </p>
          <h2 className="text-2xl font-bold text-chalk-50">{m.term}</h2>
          <p className="mt-1 text-chalk-300/80 italic">{m.tagline}</p>
          {m.alsoCalled && m.alsoCalled.length > 0 && (
            <p className="mt-2 text-xs text-chalk-300/60">
              Also called: {m.alsoCalled.join(" · ")}
            </p>
          )}
        </div>

        {/* Tabs */}
        <div className="mb-5 flex flex-wrap gap-1.5 border-b border-ink-700/60">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={
                "px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors " +
                (tab === t.id
                  ? "bg-ink-800 text-accent border border-ink-700/60 border-b-transparent -mb-px"
                  : "text-chalk-300 hover:text-chalk-100")
              }
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "plain" && <PlainTab m={m} />}
        {tab === "method" && <MethodTab m={m} />}
        {tab === "read" && <ReadTab m={m} />}
        {tab === "traps" && <TrapsTab m={m} />}
      </div>
    </section>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <h3 className="text-[10px] font-semibold uppercase tracking-widest text-chalk-300/60 mb-2">
        {title}
      </h3>
      <div className="text-sm text-chalk-200 leading-relaxed">{children}</div>
    </div>
  );
}

function PlainTab({ m }: { m: MetricEntry }) {
  return (
    <>
      <Section title="In one sentence">{m.inOneSentence}</Section>
      <Section title="Intuition">{m.intuition}</Section>
      <div className="mb-5 rounded-lg border border-accent/20 bg-accent/5 p-4">
        <p className="text-[10px] font-semibold uppercase tracking-widest text-accent mb-2">
          Worked example
        </p>
        <p className="text-sm text-chalk-200 leading-relaxed mb-2">
          <span className="text-chalk-300/70">Setup. </span>
          {m.concreteExample.setup}
        </p>
        <p className="text-sm text-chalk-200 leading-relaxed mb-2 font-mono text-xs sm:text-sm">
          {m.concreteExample.walkthrough}
        </p>
        <p className="text-sm text-chalk-200 leading-relaxed">
          <span className="text-chalk-300/70">Takeaway. </span>
          {m.concreteExample.takeaway}
        </p>
      </div>
    </>
  );
}

function MethodTab({ m }: { m: MetricEntry }) {
  return (
    <>
      <Section title="Formula">
        <code className="block rounded bg-ink-950/60 px-3 py-2 text-xs sm:text-sm text-accent font-mono">
          {m.formula.plain}
        </code>
      </Section>

      <Section title="Inputs">
        <ul className="space-y-2">
          {m.inputs.map((i) => (
            <li key={i.name} className="text-sm">
              <span className="text-chalk-50 font-medium">{i.name}</span>
              <span className="text-chalk-300/60"> — {i.meaning} </span>
              <span className="rounded border border-ink-700/60 bg-ink-900 px-1.5 py-0.5 text-[10px] uppercase tracking-wider text-chalk-300/60">
                {i.source}
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section title="How we compute it">{m.methodology}</Section>
      <Section title="Why this construction">{m.whyThisConstruction}</Section>

      <div className="grid sm:grid-cols-2 gap-4 mb-2">
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-accent mb-2">
            Benefits
          </h3>
          <ul className="space-y-1.5">
            {m.benefits.map((b, i) => (
              <li key={i} className="text-xs text-chalk-200 leading-relaxed flex gap-2">
                <span className="text-accent mt-0.5">+</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-widest text-warn mb-2">
            Limitations
          </h3>
          <ul className="space-y-1.5">
            {m.limitations.map((b, i) => (
              <li key={i} className="text-xs text-chalk-200 leading-relaxed flex gap-2">
                <span className="text-warn mt-0.5">−</span>
                <span>{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {m.alternatives && m.alternatives.length > 0 && (
        <Section title="When to use an alternative">
          <ul className="space-y-1.5">
            {m.alternatives.map((a, i) => (
              <li key={i} className="text-sm flex gap-2">
                <span className="font-medium text-chalk-50 shrink-0">{a.name}:</span>
                <span className="text-chalk-300">{a.whenBetter}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}

function ReadTab({ m }: { m: MetricEntry }) {
  return (
    <>
      <Section title="How to read it">
        <div className="space-y-2">
          {m.howToRead.map((h, i) => (
            <div key={i} className="flex gap-3 items-start text-sm">
              <span className="shrink-0 mt-0.5 rounded border border-accent/30 bg-accent/10 text-accent text-xs px-1.5 py-0.5 font-medium">
                {h.label}
              </span>
              <span className="text-chalk-300 leading-relaxed">{h.desc}</span>
            </div>
          ))}
        </div>
      </Section>

      {m.ranges && (
        <Section title="Range guide">
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-bad/20 bg-bad/5 p-3">
              <p className="text-xs font-semibold text-bad mb-1">Watch out</p>
              <p className="text-xs text-chalk-300">{m.ranges.bad}</p>
            </div>
            <div className="rounded-lg border border-warn/20 bg-warn/5 p-3">
              <p className="text-xs font-semibold text-warn mb-1">Acceptable</p>
              <p className="text-xs text-chalk-300">{m.ranges.ok}</p>
            </div>
            <div className="rounded-lg border border-accent/20 bg-accent/5 p-3">
              <p className="text-xs font-semibold text-accent mb-1">Ideal</p>
              <p className="text-xs text-chalk-300">{m.ranges.good}</p>
            </div>
          </div>
          {m.ranges.note && (
            <p className="mt-2 text-xs text-chalk-300/60 italic">{m.ranges.note}</p>
          )}
        </Section>
      )}

      {m.sectorNotes && m.sectorNotes.length > 0 && (
        <Section title="Sector notes">
          <ul className="space-y-2">
            {m.sectorNotes.map((s, i) => (
              <li key={i} className="text-sm">
                <span className="text-accent font-medium">{s.sector}.</span>{" "}
                <span className="text-chalk-300">{s.note}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </>
  );
}

function TrapsTab({ m }: { m: MetricEntry }) {
  return (
    <>
      <Section title="Common traps">
        <ul className="space-y-2">
          {m.traps.map((t, i) => (
            <li key={i} className="flex gap-2 text-sm">
              <span className="shrink-0 text-warn mt-0.5">⚠</span>
              <span className="text-chalk-300 leading-relaxed">{t}</span>
            </li>
          ))}
        </ul>
      </Section>

      {m.redFlags && m.redFlags.length > 0 && (
        <Section title="Red flag combinations">
          <ul className="space-y-2">
            {m.redFlags.map((r, i) => (
              <li key={i} className="flex gap-2 text-sm">
                <span className="shrink-0 text-bad mt-0.5">●</span>
                <span className="text-chalk-300 leading-relaxed">{r}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {m.pairsWellWith && m.pairsWellWith.length > 0 && (
        <Section title="Pairs well with">
          <div className="flex flex-wrap gap-1.5">
            {m.pairsWellWith.map((id) => (
              <a
                key={id}
                href={`#${id}`}
                className="rounded-md border border-ink-700/60 bg-ink-900/40 px-2 py-1 text-xs text-chalk-200 hover:border-accent/40 hover:text-accent transition-colors"
              >
                {id}
              </a>
            ))}
          </div>
        </Section>
      )}
    </>
  );
}
