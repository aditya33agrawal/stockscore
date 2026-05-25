"use client";

interface Props {
  label: string;
  hint: string;
  learnAnchor?: string;
}

export function HeaderHelp({ label, hint, learnAnchor }: Props) {
  return (
    <span className="relative group/tip inline-flex items-center gap-1 cursor-default">
      {label}
      <span className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full border border-chalk-300/30 text-chalk-300/50 text-[9px] leading-none select-none">
        ?
      </span>
      <span
        className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-52 rounded-lg border border-ink-700/60 bg-ink-900 px-3 py-2 text-xs text-chalk-300 shadow-xl opacity-0 group-hover/tip:opacity-100 transition-opacity z-50 text-left leading-relaxed"
      >
        {hint}
        {learnAnchor && (
          <a
            href={`/learn#${learnAnchor}`}
            className="pointer-events-auto mt-1.5 flex items-center gap-1 text-accent hover:underline"
          >
            Learn how to read this →
          </a>
        )}
      </span>
    </span>
  );
}
