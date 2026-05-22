import clsx from "clsx";
import { scoreBg, scoreColor } from "@/lib/format";

export function ScoreBadge({
  score,
  size = "md",
  raw,
}: {
  score: number;
  size?: "sm" | "md" | "lg";
  raw?: number;
}) {
  const sizes = {
    sm: "h-10 w-16 text-base",
    md: "h-16 w-24 text-2xl",
    lg: "h-24 w-32 text-4xl",
  } as const;

  return (
    <div
      className={clsx(
        "inline-flex flex-col items-center justify-center rounded-xl border num font-semibold",
        sizes[size],
        scoreBg(score),
        scoreColor(score),
      )}
    >
      <span className="leading-none">{score.toFixed(1)}</span>
      <span className="text-[10px] uppercase tracking-widest text-chalk-300/70 mt-1">
        {raw ? `${raw}/1000` : "/ 100"}
      </span>
    </div>
  );
}

export function ScoreBar({ score }: { score: number }) {
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="relative h-2 w-full overflow-hidden rounded-full bg-ink-800">
      <div
        className={clsx(
          "h-full rounded-full transition-all",
          score >= 70 ? "bg-accent" : score >= 50 ? "bg-warn" : "bg-bad",
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
