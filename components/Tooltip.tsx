"use client";

import { ReactNode, useState, useId, useRef, useCallback, useLayoutEffect } from "react";

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
  /** Preferred horizontal anchor relative to the trigger before viewport clamping.
   *  "start" prefers the trigger's left edge, "end" the right edge. Default centered. */
  align?: "start" | "center" | "end";
}

const VIEWPORT_MARGIN = 8;
const GAP = 8;

/**
 * Lightweight, accessible tooltip with hover + focus + tap-to-toggle support.
 * Position is computed in viewport coordinates and clamped to stay on-screen,
 * then applied via `position: fixed` - this is what lets the popover escape
 * `overflow-x-auto` table wrappers and the edges of the viewport instead of
 * being clipped or running off-screen.
 */
export function Tooltip({ content, children, triggerLabel, className, align = "center" }: TooltipProps) {
  const [open, setOpen] = useState(false);
  const [style, setStyle] = useState<{ top: number; left: number } | null>(null);
  const id = useId();
  const wrapRef = useRef<HTMLSpanElement>(null);
  const popRef = useRef<HTMLSpanElement>(null);
  const c: TooltipContent =
    typeof content === "string" ? { body: content } : content;

  const reposition = useCallback(() => {
    const trigger = wrapRef.current;
    const pop = popRef.current;
    if (!trigger || !pop) return;
    const a = trigger.getBoundingClientRect();
    const popWidth = pop.offsetWidth;
    const popHeight = pop.offsetHeight;

    let left =
      align === "start" ? a.left : align === "end" ? a.right - popWidth : a.left + a.width / 2 - popWidth / 2;
    left = Math.min(Math.max(left, VIEWPORT_MARGIN), window.innerWidth - VIEWPORT_MARGIN - popWidth);

    let top = a.top - popHeight - GAP;
    if (top < VIEWPORT_MARGIN) top = a.bottom + GAP;

    setStyle({ top, left });
  }, [align]);

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);

  const popover = (
    <span
      ref={popRef}
      role="tooltip"
      id={id}
      className="tooltip-pop"
      style={style ? { top: style.top, left: style.left, visibility: "visible" } : { visibility: "hidden" }}
    >
      {c.title && <span className="tooltip-title">{c.title}</span>}
      <span className="tooltip-body">{c.body}</span>
    </span>
  );

  const handleEnter = () => setOpen(true);
  const handleLeave = () => setOpen(false);

  if (children) {
    return (
      <span
        ref={wrapRef}
        className={`tooltip-wrap ${className ?? ""}`}
        data-open={open || undefined}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
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
      ref={wrapRef}
      className={`tooltip-wrap ${className ?? ""}`}
      data-open={open || undefined}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
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
        onFocus={handleEnter}
        onBlur={handleLeave}
        className="tooltip-trigger"
      >
        i
      </span>
      {popover}
    </span>
  );
}
