import clsx from "clsx";
import { scoreColor, classificationLabel, classificationStyle } from "@/lib/format";

/* ── ScoreBadge ──────────────────────────────────────────────────────────────
 * Displays the numerical score + optional classification pill.
 * Replaces the old opaque rectangle with a clean number-first layout.
 */
export function ScoreBadge({
  score,
  classification,
  size = "md",
  raw,
}: {
  score: number;
  classification?: string;
  size?: "sm" | "md" | "lg";
  raw?: number;
}) {
  const sizeMap = {
    sm: { score: "text-2xl",  label: "text-[10px]", gap: "gap-1"   },
    md: { score: "text-4xl",  label: "text-[11px]", gap: "gap-1.5" },
    lg: { score: "text-6xl",  label: "text-xs",     gap: "gap-2"   },
  } as const;

  const { score: scoreSize, label: labelSize, gap } = sizeMap[size];

  return (
    <div className={clsx("inline-flex flex-col items-center", gap)}>
      {/* Large mono score number */}
      <span className={clsx("num font-bold leading-none tracking-tight", scoreSize, scoreColor(score))}>
        {score.toFixed(1)}
      </span>

      {/* Max points */}
      <span className="num text-[10px] text-chalk-300/35 leading-none">
        {raw != null ? `${raw}/100` : "/ 100"}
      </span>

      {/* Classification pill */}
      {classification && (
        <span
          className={clsx(
            "mt-0.5 inline-block rounded-md border px-2 py-0.5 font-bold uppercase tracking-wider leading-none",
            labelSize,
            classificationStyle(classification),
          )}
        >
          {classificationLabel(classification)}
        </span>
      )}
    </div>
  );
}

/* ── ScoreBar ────────────────────────────────────────────────────────────────
 * Slim progress bar with gradient fill.
 */
export function ScoreBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  const gradient =
    score >= 70
      ? "#6D8196"
      : score >= 50
      ? "#C9962B"
      : "#D96A6A";

  return (
    <div className="relative h-1 w-full overflow-hidden rounded-full bg-ink-700/60">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: gradient }}
      />
    </div>
  );
}

/* Legacy alias - keeps old import paths working */
export { ScoreBar as ScoreBarChart };
