"use client";

import type { ReactNode, MouseEvent } from "react";

interface Props {
  targetId: string;
  children: ReactNode;
  className?: string;
}

/** Scrolls to and opens the matching <details> category breakdown below. */
export function CategoryJumpLink({ targetId, children, className }: Props) {
  function handleClick(e: MouseEvent<HTMLAnchorElement>) {
    e.preventDefault();
    const el = document.getElementById(targetId);
    if (!el) return;
    if (el instanceof HTMLDetailsElement) el.open = true;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${targetId}`);
  }

  return (
    <a href={`#${targetId}`} onClick={handleClick} className={className}>
      {children}
    </a>
  );
}
