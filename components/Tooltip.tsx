"use client";

import { ReactNode, useState, useId } from "react";

export interface TooltipContent {
  title?: string;
  body: ReactNode;
}

interface TooltipProps {
  content: TooltipContent | string;
  /** When set, wraps the children; when omitted, renders a small info trigger. */
  children?: ReactNode;
  /** ARIA label for the trigger if no children are passed. */
  triggerLabel?: string;
  className?: string;
  /** Horizontal anchor of the popover. "start" pins it to the left edge
   *  (so it expands rightward), "end" to the right edge. Default centered. */
  align?: "start" | "center" | "end";
}

/**
 * Lightweight, accessible tooltip with hover + focus + tap-to-toggle support.
 * Uses CSS hover/focus-within for desktop and a `data-open` flag for touch
 * devices. Content is delivered through a single shared shape so we can keep
 * every label's explanation consistent.
 */
export function Tooltip({ content, children, triggerLabel, className, align = "center" }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const c: TooltipContent =
    typeof content === "string" ? { body: content } : content;

  const popover = (
    <span
      role="tooltip"
      id={id}
      data-align={align}
      className="tooltip-pop"
    >
      {c.title && <span className="tooltip-title">{c.title}</span>}
      <span className="tooltip-body">{c.body}</span>
    </span>
  );

  if (children) {
    return (
      <span
        className={`tooltip-wrap ${className ?? ""}`}
        data-open={open || undefined}
        onTouchStart={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
      >
        <span aria-describedby={id} tabIndex={0} className="outline-none">
          {children}
        </span>
        {popover}
      </span>
    );
  }

  return (
    <span
      className={`tooltip-wrap ${className ?? ""}`}
      data-open={open || undefined}
    >
      <button
        type="button"
        aria-label={triggerLabel ?? "More info"}
        aria-describedby={id}
        onClick={(e) => {
          e.preventDefault();
          setOpen((v) => !v);
        }}
        onBlur={() => setOpen(false)}
        className="tooltip-trigger"
      >
        i
      </button>
      {popover}
    </span>
  );
}
