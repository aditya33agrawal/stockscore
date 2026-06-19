"use client";

import { Tooltip } from "./Tooltip";

interface Props {
  label: string;
  hint: string;
  learnAnchor?: string;
}

export function HeaderHelp({ label, hint, learnAnchor }: Props) {
  return (
    <Tooltip
      content={{
        body: (
          <>
            {hint}
            {learnAnchor && (
              <a
                href={`/learn#${learnAnchor}`}
                className="pointer-events-auto mt-1.5 flex items-center gap-1 text-accent hover:underline"
              >
                Learn how to read this →
              </a>
            )}
          </>
        ),
      }}
    >
      <span className="inline-flex items-center gap-1 cursor-default">
        {label}
        <span className="inline-flex items-center justify-center h-3.5 w-3.5 rounded-full border border-chalk-300/30 text-chalk-300/50 text-[9px] leading-none select-none">
          ?
        </span>
      </span>
    </Tooltip>
  );
}
