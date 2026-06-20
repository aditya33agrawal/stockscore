import type { CompanyRaw } from "./types";

export type Tone = "excellent" | "good" | "neutral" | "warn" | "bad";

export interface Evaluation {
  sentence: string;
  tone: Tone;
}

export function evaluatePE(raw: CompanyRaw): Evaluation {
  const pe = raw.pe;
  const indPe = raw.industry_pe;
  if (!pe) return { sentence: "P/E data not available.", tone: "neutral" };
  if (!indPe)
    return {
      sentence: `Trades at ${pe.toFixed(1)}x earnings.`,
      tone: "neutral",
    };
  const disc = ((indPe - pe) / indPe) * 100;
  if (disc > 20)
    return {
      sentence: `Trading ${disc.toFixed(0)}% below industry median P/E - relatively cheap vs peers.`,
      tone: "good",
    };
  if (disc < -20)
    return {
      sentence: `Trading ${Math.abs(disc).toFixed(0)}% above industry median P/E - market pricing in high expectations.`,
      tone: "warn",
    };
  return {
    sentence: `P/E is broadly in line with the industry median of ${indPe.toFixed(1)}x.`,
    tone: "neutral",
  };
}

export function evaluatePB(raw: CompanyRaw, cmp?: number): Evaluation {
  const pbv = raw.pbv ?? (raw.book_value && cmp ? cmp / raw.book_value : undefined);
  if (!pbv) return { sentence: "Book value data not available.", tone: "neutral" };
  if (pbv < 1)
    return {
      sentence: `Trading below book value (P/B ${pbv.toFixed(2)}x) - could be a bargain, or a sign the market expects the business to keep destroying value. Check why before assuming it's cheap.`,
      tone: "neutral",
    };
  if (pbv <= 3)
    return {
      sentence: `P/B of ${pbv.toFixed(2)}x is a normal premium over book value for a profitable business.`,
      tone: "good",
    };
  if (pbv <= 6)
    return {
      sentence: `P/B of ${pbv.toFixed(2)}x is rich - only justified if returns on those assets (ROE/ROCE) are well above average.`,
      tone: "warn",
    };
  return {
    sentence: `P/B of ${pbv.toFixed(2)}x is very high - you're paying many multiples of net worth, which only makes sense for exceptional, capital-light compounders.`,
    tone: "bad",
  };
}

export function evaluateROE(raw: CompanyRaw): Evaluation {
  const roe = raw.roe;
  if (!roe) return { sentence: "ROE data not available.", tone: "neutral" };
  if (roe >= 25)
    return {
      sentence: `ROE of ${roe.toFixed(1)}% - exceptional returns on shareholders' capital.`,
      tone: "excellent",
    };
  if (roe >= 18)
    return {
      sentence: `ROE of ${roe.toFixed(1)}% - strong return on shareholders' capital.`,
      tone: "good",
    };
  if (roe >= 12)
    return {
      sentence: `ROE of ${roe.toFixed(1)}% is decent; capital is being used reasonably well.`,
      tone: "neutral",
    };
  if (roe >= 8)
    return {
      sentence: `ROE of ${roe.toFixed(1)}% is below par. Returns on equity could be stronger.`,
      tone: "warn",
    };
  return {
    sentence: `ROE of ${roe.toFixed(1)}% - very weak; capital is barely earning a return.`,
    tone: "bad",
  };
}

export function evaluateROCE(raw: CompanyRaw): Evaluation {
  const roce = raw.roce;
  if (!roce) return { sentence: "ROCE data not available.", tone: "neutral" };
  if (roce >= 25)
    return {
      sentence: `ROCE of ${roce.toFixed(1)}% - exceptional capital efficiency.`,
      tone: "excellent",
    };
  if (roce >= 18)
    return {
      sentence: `ROCE of ${roce.toFixed(1)}% - strong capital efficiency across the business.`,
      tone: "good",
    };
  if (roce >= 12)
    return {
      sentence: `ROCE of ${roce.toFixed(1)}% - business earns a fair return on deployed capital.`,
      tone: "neutral",
    };
  if (roce >= 8)
    return {
      sentence: `ROCE of ${roce.toFixed(1)}% is approaching cost-of-capital territory. Watch closely.`,
      tone: "warn",
    };
  return {
    sentence: `ROCE of ${roce.toFixed(1)}% - below cost-of-capital; value destruction risk.`,
    tone: "bad",
  };
}

export function evaluateOPM(raw: CompanyRaw): Evaluation {
  const opm = raw.opm;
  if (!opm) return { sentence: "OPM data not available.", tone: "neutral" };
  if (opm >= 30)
    return {
      sentence: `Operating margin of ${opm.toFixed(1)}% - exceptional; pricing power and scale.`,
      tone: "excellent",
    };
  if (opm >= 20)
    return {
      sentence: `Operating margin of ${opm.toFixed(1)}% is strong - wide competitive moat.`,
      tone: "good",
    };
  if (opm >= 10)
    return {
      sentence: `Operating margin of ${opm.toFixed(1)}% is healthy; room to improve further.`,
      tone: "neutral",
    };
  if (opm >= 5)
    return {
      sentence: `Operating margin of ${opm.toFixed(1)}% is thin - vulnerable to input cost swings.`,
      tone: "warn",
    };
  return {
    sentence: `Operating margin of ${opm.toFixed(1)}% - very thin or negative; serious profitability concern.`,
    tone: "bad",
  };
}

export function evaluateDE(raw: CompanyRaw): Evaluation {
  const de = raw.debt_to_equity;
  if (de == null)
    return { sentence: "D/E data not available.", tone: "neutral" };
  if (de < 0.1)
    return {
      sentence: `D/E of ${de.toFixed(2)} - virtually debt-free. Pristine balance sheet.`,
      tone: "excellent",
    };
  if (de < 0.5)
    return {
      sentence: `D/E of ${de.toFixed(2)} - low leverage. Strong balance sheet.`,
      tone: "good",
    };
  if (de < 1)
    return {
      sentence: `D/E of ${de.toFixed(2)} - manageable leverage; not a concern at this level.`,
      tone: "neutral",
    };
  if (de < 2)
    return {
      sentence: `D/E of ${de.toFixed(2)} - high leverage. Monitor debt servicing capacity.`,
      tone: "warn",
    };
  return {
    sentence: `D/E of ${de.toFixed(2)} - very high leverage. Interest coverage and free cash flow are critical here.`,
    tone: "bad",
  };
}

export function evaluateDividend(raw: CompanyRaw): Evaluation {
  const dy = raw.dividend_yield;
  if (!dy)
    return {
      sentence:
        "No dividend paid currently - earnings are being retained for growth.",
      tone: "neutral",
    };
  if (dy >= 3)
    return {
      sentence: `Dividend yield of ${dy.toFixed(2)}% - strong income component alongside capital gains.`,
      tone: "good",
    };
  if (dy >= 1)
    return {
      sentence: `Dividend yield of ${dy.toFixed(2)}% - modest; business retains most earnings.`,
      tone: "neutral",
    };
  return {
    sentence: `Dividend yield of ${dy.toFixed(2)}% - minimal cash returned to shareholders currently.`,
    tone: "neutral",
  };
}

export interface TrendResult {
  trend: "up" | "down" | "sideways";
  /** Granular strength within the trend bucket */
  strength: "strong" | "mild" | "neutral";
  /** Raw composite score (-12 to +12) */
  score: number;
  /** Display label for the trend tag (e.g. "↑↑ Strong Uptrend") */
  label: string;
  sentence: string;
  tone: Tone;
  pctAbove50: number | null;
  pctAbove200: number | null;
}

/**
 * Multi-factor trend classification.
 *
 * Five weighted factors produce a composite score in the range [-12, +12]:
 *   1. % above 50 DMA   - ±3 pts (graduated thresholds)
 *   2. % above 200 DMA  - ±3 pts (graduated thresholds)
 *   3. DMA structure    - ±2 pts (50 DMA vs 200 DMA crossover direction)
 *   4. 1-yr price CAGR  - ±2 pts (momentum confirmation)
 *   5. 52-week range    - ±2 pts (price position within annual high/low)
 *
 * Score buckets → trend label:
 *   ≥  7 → Strong Uptrend
 *   ≥  3 → Uptrend
 *   ≥ -2 → Sideways
 *   ≥ -6 → Downtrend
 *   < -6 → Strong Downtrend
 */
export function evaluateTrend(cmp: number, raw: CompanyRaw): TrendResult {
  const { dma50, dma200, high52w, low52w, stock_1y_cagr } = raw;

  // If no DMA data at all, return a neutral result
  if (!dma50 && !dma200) {
    return {
      trend: "sideways",
      strength: "neutral",
      score: 0,
      label: "→ Sideways",
      pctAbove50: null,
      pctAbove200: null,
      sentence: "Technical data unavailable.",
      tone: "neutral",
    };
  }

  const pctAbove50 = dma50 ? ((cmp - dma50) / dma50) * 100 : null;
  const pctAbove200 = dma200 ? ((cmp - dma200) / dma200) * 100 : null;

  // ── Factor 1: % above 50 DMA  (±3 pts) ────────────────────────────────────
  let f1 = 0;
  if (pctAbove50 !== null) {
    if (pctAbove50 >= 15) f1 = 3;
    else if (pctAbove50 >= 5) f1 = 2;
    else if (pctAbove50 >= 0) f1 = 1;
    else if (pctAbove50 >= -5) f1 = 0;
    else if (pctAbove50 >= -10) f1 = -1;
    else if (pctAbove50 >= -15) f1 = -2;
    else f1 = -3;
  }

  // ── Factor 2: % above 200 DMA  (±3 pts) ───────────────────────────────────
  let f2 = 0;
  if (pctAbove200 !== null) {
    if (pctAbove200 >= 20) f2 = 3;
    else if (pctAbove200 >= 10) f2 = 2;
    else if (pctAbove200 >= 0) f2 = 1;
    else if (pctAbove200 >= -5) f2 = 0;
    else if (pctAbove200 >= -10) f2 = -1;
    else if (pctAbove200 >= -20) f2 = -2;
    else f2 = -3;
  }

  // ── Factor 3: DMA crossover structure  (±2 pts, magnitude-aware) ─────────────
  // Scaled by how far apart the DMAs are - a barely-crossed DMA gets ±1,
  // a well-established trend (50 DMA clearly above/below 200 DMA) gets ±2.
  let f3 = 0;
  if (dma50 && dma200) {
    const pct50vs200 = ((dma50 - dma200) / dma200) * 100;
    if (pct50vs200 >= 5)
      f3 = 2; // 50 DMA well above 200 - strong bull structure
    else if (pct50vs200 >= 1)
      f3 = 1; // 50 DMA slightly above 200 - early golden cross
    else if (pct50vs200 >= -1)
      f3 = 0; // DMAs intertwined - neutral
    else if (pct50vs200 >= -5)
      f3 = -1; // 50 DMA slightly below 200 - early death cross
    else f3 = -2; // 50 DMA well below 200 - established downtrend
  }

  // ── Factor 4: 1-year price CAGR  (±2 pts) ─────────────────────────────────
  let f4 = 0;
  if (stock_1y_cagr !== undefined && stock_1y_cagr !== null) {
    if (stock_1y_cagr >= 30) f4 = 2;
    else if (stock_1y_cagr >= 10) f4 = 1;
    else if (stock_1y_cagr >= 0) f4 = 0;
    else if (stock_1y_cagr >= -15) f4 = -1;
    else f4 = -2;
  }

  // ── Factor 5: 52-week range position  (±2 pts) ────────────────────────────
  let f5 = 0;
  if (high52w && low52w && high52w > low52w) {
    const pos = (cmp - low52w) / (high52w - low52w); // 0 = at 52w low, 1 = at 52w high
    if (pos >= 0.8) f5 = 2;
    else if (pos >= 0.6) f5 = 1;
    else if (pos >= 0.4) f5 = 0;
    else if (pos >= 0.2) f5 = -1;
    else f5 = -2;
  }

  const score = f1 + f2 + f3 + f4 + f5;

  // ── Classify ───────────────────────────────────────────────────────────────
  let trend: TrendResult["trend"];
  let strength: TrendResult["strength"];
  let label: string;
  let tone: Tone;

  // Max possible score is 12, min is -12.
  // Thresholds calibrated so "Strong" requires clear multi-factor confirmation:
  //   ≥  9 → Strong Uptrend   (75%+ of max, needs several factors aligned)
  //   ≥  4 → Uptrend          (clearly positive but not exceptional)
  //   ≥ -3 → Sideways         (mixed or muted signals)
  //   ≥ -8 → Downtrend        (clearly negative but not extreme)
  //   < -8 → Strong Downtrend (multi-factor bearish confirmation)
  if (score >= 9) {
    trend = "up";
    strength = "strong";
    label = "↑↑ Strong Uptrend";
    tone = "good";
  } else if (score >= 4) {
    trend = "up";
    strength = "mild";
    label = "↑ Uptrend";
    tone = "good";
  } else if (score >= -3) {
    trend = "sideways";
    strength = "neutral";
    label = "→ Sideways";
    tone = "neutral";
  } else if (score >= -8) {
    trend = "down";
    strength = "mild";
    label = "↓ Downtrend";
    tone = "warn";
  } else {
    trend = "down";
    strength = "strong";
    label = "↓↓ Strong Downtrend";
    tone = "warn";
  }

  // ── Build a descriptive sentence ───────────────────────────────────────────
  const parts: string[] = [];

  if (pctAbove50 !== null && pctAbove200 !== null) {
    const sign50 = pctAbove50 >= 0 ? "above" : "below";
    const sign200 = pctAbove200 >= 0 ? "above" : "below";
    parts.push(
      `${Math.abs(pctAbove50).toFixed(1)}% ${sign50} 50 DMA and ${Math.abs(pctAbove200).toFixed(1)}% ${sign200} 200 DMA`,
    );
  } else if (pctAbove50 !== null) {
    const sign = pctAbove50 >= 0 ? "above" : "below";
    parts.push(`${Math.abs(pctAbove50).toFixed(1)}% ${sign} 50 DMA`);
  } else if (pctAbove200 !== null) {
    const sign = pctAbove200 >= 0 ? "above" : "below";
    parts.push(`${Math.abs(pctAbove200).toFixed(1)}% ${sign} 200 DMA`);
  }

  if (stock_1y_cagr !== undefined && stock_1y_cagr !== null) {
    parts.push(
      `1yr return ${stock_1y_cagr >= 0 ? "+" : ""}${stock_1y_cagr.toFixed(0)}%`,
    );
  }

  if (high52w && low52w && high52w > low52w) {
    const pos = Math.round(((cmp - low52w) / (high52w - low52w)) * 100);
    parts.push(`at ${pos}% of 52w range`);
  }

  // Contextual tail based on DMA structure
  let tail = "";
  if (dma50 && dma200) {
    if (dma50 > dma200) {
      if (trend === "up") tail = " - bullish DMA alignment.";
      else if (trend === "sideways")
        tail = " - consolidating above long-term support.";
      else tail = " - pulling back through moving averages; watch for support.";
    } else {
      if (trend === "down") tail = " - bearish DMA alignment.";
      else if (trend === "sideways")
        tail = " - recovery attempt; long-term trend still bearish.";
      else
        tail = " - price testing resistance; longer-term trend still bearish.";
    }
  } else {
    if (trend === "up") tail = " - positive momentum.";
    else if (trend === "down") tail = " - negative momentum.";
    else tail = " - mixed signals.";
  }

  const sentence = parts.length
    ? `Price is ${parts.join("; ")}${tail}`
    : `Technical data incomplete - trend score ${score > 0 ? "+" : ""}${score}.`;

  return {
    trend,
    strength,
    score,
    label,
    pctAbove50,
    pctAbove200,
    sentence,
    tone,
  };
}

export function evaluateCashConversion(
  cfoCrArr: (number | null)[],
  profitArr: (number | null)[],
): Evaluation & { ratio: number | null } {
  const pairs = cfoCrArr
    .map((cfo, i) => ({ cfo, profit: profitArr[i] }))
    .filter(
      ({ cfo, profit }) => cfo !== null && profit !== null && profit! > 0,
    );
  if (pairs.length === 0) {
    return {
      ratio: null,
      sentence: "Cash flow data not available for quality assessment.",
      tone: "neutral",
    };
  }
  const recent = pairs.slice(-3);
  const avg =
    recent.reduce((sum, { cfo, profit }) => sum + cfo! / profit!, 0) /
    recent.length;
  const ratio = parseFloat(avg.toFixed(2));
  if (ratio >= 1.0)
    return {
      ratio,
      sentence: `CFO averages ${(ratio * 100).toFixed(0)}% of net profit - earnings are fully cash-backed. High quality.`,
      tone: "good",
    };
  if (ratio >= 0.7)
    return {
      ratio,
      sentence: `CFO covers ${(ratio * 100).toFixed(0)}% of net profit on average - reasonable cash conversion.`,
      tone: "neutral",
    };
  return {
    ratio,
    sentence: `CFO covers only ${(ratio * 100).toFixed(0)}% of net profit - watch for accrual-heavy earnings.`,
    tone: "warn",
  };
}

export function evaluateCurrentRatio(raw: CompanyRaw): Evaluation {
  const cr = raw.current_ratio;
  if (!cr)
    return { sentence: "Current ratio data not available.", tone: "neutral" };
  if (cr >= 2)
    return {
      sentence: `Current ratio of ${cr.toFixed(2)} - strong short-term liquidity; ample buffer to cover current liabilities.`,
      tone: cr >= 3 ? "excellent" : "good",
    };
  if (cr >= 1.5)
    return {
      sentence: `Current ratio of ${cr.toFixed(2)} - adequate liquidity; business can comfortably meet near-term obligations.`,
      tone: "neutral",
    };
  if (cr >= 1)
    return {
      sentence: `Current ratio of ${cr.toFixed(2)} - thin liquidity buffer; worth watching working capital management.`,
      tone: "warn",
    };
  return {
    sentence: `Current ratio of ${cr.toFixed(2)} is below 1 - current liabilities exceed current assets. Liquidity risk.`,
    tone: "bad",
  };
}

export function evaluateSalesProfit(raw: CompanyRaw): Evaluation {
  const sales = raw.sales_5y_cagr;
  const profit = raw.profit_5y_cagr;
  if (!sales && !profit)
    return { sentence: "5-year growth data not available.", tone: "neutral" };
  if (sales && profit) {
    if (profit > sales * 1.5 && profit >= 15)
      return {
        sentence: `Profit growing faster than sales (${profit.toFixed(0)}% vs ${sales.toFixed(0)}% 5Y CAGR) - margins are expanding.`,
        tone: "good",
      };
    if (sales >= 10 && profit >= 10)
      return {
        sentence: `Healthy 5Y CAGR: revenue ${sales.toFixed(0)}%, profit ${profit.toFixed(0)}% - a steady compounder.`,
        tone: "good",
      };
    if (profit < 0)
      return {
        sentence: `Profits declining over 5 years despite revenue growth - margin erosion risk.`,
        tone: "warn",
      };
    if (sales < 5 && profit < 5)
      return {
        sentence: `5Y growth is slow: revenue ${sales.toFixed(0)}%, profit ${profit.toFixed(0)}% - not a high-velocity compounder.`,
        tone: "neutral",
      };
  }
  if (profit && profit >= 15)
    return {
      sentence: `5Y profit CAGR of ${profit.toFixed(0)}% - solid long-term earnings growth.`,
      tone: "good",
    };
  return {
    sentence: `5Y growth is moderate - business is stable but not accelerating.`,
    tone: "neutral",
  };
}
