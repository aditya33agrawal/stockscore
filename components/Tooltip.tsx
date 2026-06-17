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

  // Trigger is a <span role="button">, not a real <button> - this Tooltip is
  // very often nested inside another clickable element (a row toggle, a tab
  // button, a <summary>), and a real <button> there is invalid HTML. Browsers
  // "fix" the DOM by hoisting the inner button out of its parent, which is
  // what was corrupting layout and making the trigger appear misplaced/hidden.
  return (
    <span
      className={`tooltip-wrap ${className ?? ""}`}
      data-open={open || undefined}
    >
      <span
        role="button"
        tabIndex={0}
        aria-label={triggerLabel ?? "More info"}
        aria-describedby={id}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }
        }}
        onBlur={() => setOpen(false)}
        className="tooltip-trigger"
      >
        i
      </span>
      {popover}
    </span>
  );
}
