import { PriceChart } from "@/components/PriceChart";
import { PriceRuler } from "@/components/PriceRuler";
import { Tooltip } from "@/components/Tooltip";

interface Props {
  symbol: string;
  cmp: number;
  dma50?: number;
  dma200?: number;
  high52w?: number | null;
  low52w?: number | null;
}

export function PriceSnapshot({ symbol, cmp, dma50, dma200, high52w, low52w }: Props) {
  const hasRuler = dma50 || dma200 || high52w || low52w;

  return (
    <div className="glass border-subtle rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[rgb(var(--chalk-100)_/_0.06)]">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-chalk-100">Price</p>
          <Tooltip
            content={{
              body: "Candlestick chart with 50-day and 200-day moving averages. Below, the ruler shows where the current price sits relative to key technical levels.",
            }}
          />
        </div>
        <a href="#deep-dive" className="text-xs text-chalk-300/40 hover:text-accent transition-colors">
          Full chart →
        </a>
      </div>

      {/* Compact price chart */}
      <div className="px-2 pt-2">
        <PriceChart symbol={symbol} />
      </div>

      {/* Price ruler */}
      {hasRuler && (
        <div className="border-t border-[rgb(var(--chalk-100)_/_0.05)] mt-1">
          <PriceRuler
            cmp={cmp}
            dma50={dma50}
            dma200={dma200}
            high52w={high52w}
            low52w={low52w}
          />
        </div>
      )}

      {/* Quick chips */}
      <div className="flex flex-wrap gap-2 px-5 py-3 border-t border-[rgb(var(--chalk-100)_/_0.05)]">
        {dma50 != null && (
          <Tooltip content={{ body: "50-day moving average - short-term trend indicator. Price above = bullish momentum." }}>
            <span className="num rounded-md border border-ink-700/50 bg-ink-800/40 px-2 py-0.5 text-[11px] text-chalk-300/60 cursor-default">
              50D: ₹{dma50.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
          </Tooltip>
        )}
        {dma200 != null && (
          <Tooltip content={{ body: "200-day moving average - long-term trend indicator. Price above = secular uptrend." }}>
            <span className="num rounded-md border border-ink-700/50 bg-ink-800/40 px-2 py-0.5 text-[11px] text-chalk-300/60 cursor-default">
              200D: ₹{dma200.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
          </Tooltip>
        )}
        {high52w != null && (
          <Tooltip content={{ body: "Highest price over the last 52 weeks." }}>
            <span className="num rounded-md border border-ink-700/50 bg-ink-800/40 px-2 py-0.5 text-[11px] text-chalk-300/60 cursor-default">
              52wH: ₹{high52w.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
          </Tooltip>
        )}
        {low52w != null && (
          <Tooltip content={{ body: "Lowest price over the last 52 weeks." }}>
            <span className="num rounded-md border border-ink-700/50 bg-ink-800/40 px-2 py-0.5 text-[11px] text-chalk-300/60 cursor-default">
              52wL: ₹{low52w.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
            </span>
          </Tooltip>
        )}
      </div>
    </div>
  );
}
