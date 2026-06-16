/**
 * lib/scorer.ts - StockScore v2 Scoring Engine
 *
 * Implements the algorithm described in docs/scoring-algorithm-v2-plan.md.
 * All category scores use continuous logistic/linear primitives (no step rubrics).
 * Logistic curves are parameterised as logistic(x, x0, half_width) where:
 *   x0         = midpoint (score = 0.5)
 *   half_width = distance from x0 at which score reaches 0.9 (or 0.1)
 */

import type { RawCompanyData } from "./scraper/types";
import type {
  Company,
  CategoryScore,
  ScoreItem,
  Penalty,
  Bonus,
  TopItem,
  CompanyRaw,
  FactorRow,
} from "./types";
import {
  clamp,
  linUp,
  linDown,
  band,
  logistic,
  cv,
  olsSlope,
  percentileRank,
  cagr,
  last,
  mean,
} from "./scoring/primitives";
import { getSectorOpmPrior } from "./scoring/sector_stats";

// ─── Options ──────────────────────────────────────────────────────────────────

export interface ScoreOptions {
  /** True if the sector is tagged cyclical in sectors_config.json - cap at 90. */
  cyclical?: boolean;
  /** Sector slug for priors lookup. */
  sectorSlug?: string;
  /** Override OPM median (e.g. computed from live peer set). */
  sectorOpmMedian?: number;
}

// ─── Parsing utilities ────────────────────────────────────────────────────────

function parseNum(s: string | undefined | null): number {
  if (!s || ["-", "NA", "N/A", ""].includes(s.trim())) return 0;
  const cleaned = s
    .replace(/[₹,%\s]/g, "")
    .replace(/Cr\.?/g, "")
    .trim();
  const noComma = cleaned.replace(/,/g, "");
  const m = noComma.match(/-?[\d.]+/);
  return m ? parseFloat(m[0]) : 0;
}

function parsePercent(s: string | undefined | null): number {
  return parseNum(s);
}

function parseCsv(csv: string | null | undefined): string[][] {
  if (!csv) return [];
  return csv.split("\n").map((line) => {
    const cells: string[] = [];
    let cur = "";
    let inQ = false;
    for (const ch of line) {
      if (ch === '"') {
        inQ = !inQ;
      } else if (ch === "," && !inQ) {
        cells.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());
    return cells;
  });
}

function findRow(rows: string[][], label: string): string[] | null {
  const lo = label.toLowerCase();
  return rows.find((r) => r[0]?.toLowerCase().includes(lo)) ?? null;
}

function rowNums(row: string[] | null): number[] {
  if (!row) return [];
  return row.slice(1).map(parseNum);
}

function rowPercents(row: string[] | null): number[] {
  if (!row) return [];
  return row.slice(1).map(parsePercent);
}

// ─── Extended metrics ─────────────────────────────────────────────────────────

interface Metrics {
  // Basic ratios
  pe: number;
  bookValue: number;
  dividendYield: number;
  roce: number;
  roe: number;
  marketCap: number;
  high52w: number;
  low52w: number;
  currentRatio: number;
  debtEquity: number;
  pledgedPct: number;
  cmp: number;
  dma50: number;
  dma200: number;
  pegRatio: number;
  intrinsicValue: number;

  // CAGR tables
  salesCagr10y: number;
  salesCagr5y: number;
  salesCagr3y: number;
  salesCagrTtm: number;
  profitCagr10y: number;
  profitCagr5y: number;
  profitCagr3y: number;
  profitCagrTtm: number;
  stockCagr5y: number;
  stockCagr3y: number;
  stockCagr1y: number;
  roe5y: number;
  roe3y: number;
  roeLastYear: number;

  // P&L time series
  annualSales: number[];
  annualOpm: number[];
  annualNetProfit: number[];
  annualEps: number[];
  annualDepreciation: number[];
  otherIncomeCr: number;
  dividendPayout: number;

  // Balance sheet time series
  annualReserves: number[];
  annualBorrowings: number[];
  annualTotalAssets: number[];
  annualEquityCapital: number[];
  cashEquivalents: number;

  // Cash flow
  annualCfo: number[];
  annualCapex: number[]; // absolute values of investing cash flow
  annualFcf: number[];

  // Ratio table series
  debtorDays: number;
  debtorDaysSeries: number[];
  inventoryDays: number;
  inventoryDaysSeries: number[];
  cashConversionCycle: number;
  workingCapitalDays: number;
  annualRoce: number[];
  cfoToOp: number;

  // Shareholding
  promoterHolding: number;
  fiiHolding: number;
  diiHolding: number;
  publicHolding: number;
  fiiTrend8q: number;
  diiTrend8q: number;
  promoterTrend8q: number;
  shareholdingHistory: {
    promoter: number[];
    fii: number[];
    dii: number[];
    public: number[];
  };

  // Quarterly
  qtrlySales: number[];
  qtrlyOpm: number[];
  qtrlyNetProfit: number[];
  qtrlyEps: number[];
  qtrlyPbt: number[];
  qtrlyOtherIncome: number[];

  // Peer comparison medians (from raw peer table)
  peerPeMedian: number;
  peerRoceMedian: number;
  peerOpmMedian: number;
  peerPeArr: number[];
  peerRoceArr: number[];
  peerOpmArr: number[];
  peerQtrProfitGrowthArr: number[];
  peerQtrSalesGrowthArr: number[];
  peerDebtMcapArr: number[];
  peerDivYieldArr: number[];
  peerMcapArr: number[];

  // Meta
  pros: string[];
  cons: string[];
  industry: string;
}

function extractMetrics(raw: RawCompanyData): Metrics {
  const r = raw.ratios;
  const gt = raw.growthTables;

  const cmpStr = r["Current Price"] ?? raw.currentPrice;
  const cmp = parseNum(cmpStr.split(/[+\-](?=\d)/)[0]);

  const hlRaw = r["High / Low"] ?? "";
  const hlParts = hlRaw.split("/");
  const high52w = parseNum(hlParts[0]);
  const low52w = parseNum(hlParts[1] ?? "0");

  const sg =
    gt["Compounded Sales Growth"] ?? gt["compounded sales growth"] ?? {};
  const pg =
    gt["Compounded Profit Growth"] ?? gt["compounded profit growth"] ?? {};
  const sc = gt["Stock Price CAGR"] ?? gt["stock price cagr"] ?? {};
  const re = gt["Return on Equity"] ?? gt["return on equity"] ?? {};

  // ── P&L rows ──
  const plRows = parseCsv(raw.profitLoss);
  const annualSales = rowNums(findRow(plRows, "sales"));
  const annualOpm = rowPercents(findRow(plRows, "opm %"));
  const annualNetProfit = rowNums(findRow(plRows, "net profit"));
  const annualEps = rowNums(findRow(plRows, "eps"));
  const annualDepreciation = rowNums(findRow(plRows, "depreciation"));
  const otherIncomeRow = findRow(plRows, "other income");
  const otherIncomeCr = otherIncomeRow
    ? (last(rowNums(otherIncomeRow)) as number)
    : 0;
  const dividendPayoutRow = findRow(plRows, "dividend payout");
  const dividendPayout = dividendPayoutRow
    ? (last(rowPercents(dividendPayoutRow)) as number)
    : 0;

  // ── Balance sheet rows ──
  const bsRows = parseCsv(raw.balanceSheet);
  const annualReserves = rowNums(findRow(bsRows, "reserves"));
  const annualBorrowings = rowNums(findRow(bsRows, "borrowings"));
  const annualTotalAssets = rowNums(findRow(bsRows, "total assets"));
  const annualEquityCapital = rowNums(findRow(bsRows, "share capital"));
  const cashRow = findRow(bsRows, "cash") ?? findRow(bsRows, "cash equivalent");
  const cashEquivalents = cashRow ? (last(rowNums(cashRow)) as number) : 0;

  // ── D/E with fallback ──
  let debtEquity = parseNum(r["Debt / Equity"] ?? r["Debt to equity"] ?? "");
  if (
    !debtEquity &&
    annualBorrowings.length &&
    annualReserves.length &&
    annualEquityCapital.length
  ) {
    const equity =
      (last(annualReserves) as number) + (last(annualEquityCapital) as number);
    if (equity > 0) debtEquity = (last(annualBorrowings) as number) / equity;
  }

  // ── Cash flow rows ──
  const cfRows = parseCsv(raw.cashFlow);
  const annualCfo = rowNums(findRow(cfRows, "cash from operating"));
  const annualInvesting = rowNums(findRow(cfRows, "cash from investing"));
  // Capex = absolute value of investing outflows (conservative proxy)
  const annualCapex = annualInvesting.map((v) => Math.abs(v));
  const annualFcf = annualCfo.map((c, i) => c - (annualCapex[i] ?? 0));

  // ── Ratios table rows ──
  const ratiosRows = parseCsv(raw.ratiosTable);
  const cfoOpRow =
    findRow(ratiosRows, "cfo") ?? findRow(ratiosRows, "cash from oper");
  let cfoToOp = cfoOpRow ? parsePercent(cfoOpRow[cfoOpRow.length - 1]) : 0;
  // Fallback: compute CFO / Operating Profit from raw P&L + cash flow data
  if (!cfoToOp && annualCfo.length && annualSales.length && annualOpm.length) {
    const recentOp = annualSales
      .map((s, i) => s * ((annualOpm[i] ?? 0) / 100))
      .filter((v) => v > 0);
    const recentCfo = annualCfo.slice(-recentOp.length);
    const validPairs = recentCfo
      .map((c, i) => ({ c, op: recentOp[i] }))
      .filter(({ op }) => op > 0);
    if (validPairs.length >= 2) {
      const avgRatio =
        validPairs.reduce((sum, { c, op }) => sum + c / op, 0) /
        validPairs.length;
      cfoToOp = parseFloat((avgRatio * 100).toFixed(1));
    }
  }
  const debtorDaysSeries = rowNums(findRow(ratiosRows, "debtor days"));
  const inventoryDaysSeries = rowNums(
    findRow(ratiosRows, "inventory days") ??
      findRow(ratiosRows, "inventory turnover"),
  );
  const debtorDays = (last(debtorDaysSeries) as number) || 0;
  const inventoryDays = (last(inventoryDaysSeries) as number) || 0;
  const ccc =
    (last(rowNums(findRow(ratiosRows, "cash conversion cycle"))) as number) ||
    0;
  const wcd =
    (last(rowNums(findRow(ratiosRows, "working capital days"))) as number) || 0;
  const annualRoce = rowPercents(findRow(ratiosRows, "roce"));

  // ── Current ratio ──
  const currentRatioRow = findRow(ratiosRows, "current ratio");
  let currentRatio = currentRatioRow
    ? (last(rowNums(currentRatioRow)) as number)
    : parseNum(r["Current Ratio"] ?? "0");
  // Fallback: compute from balance sheet current assets / current liabilities
  if (!currentRatio) {
    const caRow =
      findRow(bsRows, "current assets") ??
      findRow(bsRows, "total current assets");
    const clRow =
      findRow(bsRows, "current liabilities") ??
      findRow(bsRows, "total current liabilities");
    if (caRow && clRow) {
      const ca = last(rowNums(caRow)) as number;
      const cl = last(rowNums(clRow)) as number;
      if (ca > 0 && cl > 0) currentRatio = parseFloat((ca / cl).toFixed(2));
    }
  }

  // ── Shareholding ──
  const shRows = parseCsv(raw.shareholding);
  const promoterRow = findRow(shRows, "promoters");
  const fiiRow = findRow(shRows, "fii");
  const diiRow = findRow(shRows, "dii");
  const publicRow = findRow(shRows, "public");
  const promoterNums = rowPercents(promoterRow);
  const fiiNums = rowPercents(fiiRow);
  const diiNums = rowPercents(diiRow);
  const publicNums = rowPercents(publicRow);
  let promoterHolding = (last(promoterNums) as number) || 0;
  if (!promoterHolding) {
    promoterHolding = parsePercent(r["Promoter holding"] ?? "") || 0;
  }
  const fiiHolding = (last(fiiNums) as number) || 0;
  const diiHolding = (last(diiNums) as number) || 0;
  const publicHolding = (last(publicNums) as number) || 0;
  // 8-quarter deltas
  const fiiTrend8q =
    fiiNums.length >= 9 ? fiiHolding - fiiNums[fiiNums.length - 9] : 0;
  const diiTrend8q =
    diiNums.length >= 9 ? diiHolding - diiNums[diiNums.length - 9] : 0;
  const promoterTrend8q =
    promoterNums.length >= 9
      ? promoterHolding - promoterNums[promoterNums.length - 9]
      : 0;

  // ── Quarterly rows ──
  const qRows = parseCsv(raw.quarters);
  const qtrlySales = rowNums(findRow(qRows, "sales"));
  const qtrlyOpm = rowPercents(findRow(qRows, "opm %"));
  const qtrlyNetProfit = rowNums(findRow(qRows, "net profit"));
  const qtrlyEps = rowNums(findRow(qRows, "eps"));
  const qtrlyPbt = rowNums(findRow(qRows, "profit before tax"));
  const qtrlyOtherIncome = rowNums(findRow(qRows, "other income"));

  // ── Peer comparison ──
  const peersRows = parseCsv(raw.peers);
  // Skip header row (index 0) and median row
  const peerDataRows = peersRows.filter(
    (r, i) => i > 0 && !r[0]?.toLowerCase().includes("median"),
  );
  const medianRow = peersRows.find((r) =>
    r[0]?.toLowerCase().includes("median"),
  );

  let peerPeMedian = 0;
  let peerRoceMedian = 0;
  let peerOpmMedian = 0;
  if (medianRow && medianRow.length > 10) {
    peerPeMedian = parseNum(medianRow[3]);
    peerRoceMedian = parseNum(medianRow[10]);
    peerOpmMedian = parseNum(medianRow[11] ?? "0");
  }
  // Fallback: use screener.in "Industry PE" key ratio when peer table median is unavailable
  if (!peerPeMedian || peerPeMedian <= 0) {
    peerPeMedian = parseNum(r["Industry PE"] ?? "0");
  }

  // Peer arrays for percentile scoring (columns: PE=3, ROCE=10, OPM=11, QtrProfitVar=6, QtrSalesVar=8, Loan=9, DivYld=4, MarCap=2)
  const peerPeArr = peerDataRows
    .map((r) => parseNum(r[3]))
    .filter((v) => v > 0);
  const peerRoceArr = peerDataRows
    .map((r) => parseNum(r[10]))
    .filter((v) => v > 0);
  const peerOpmArr = peerDataRows
    .map((r) => parseNum(r[11]))
    .filter((v) => v > 0);
  const peerQtrProfitGrowthArr = peerDataRows.map((r) => parseNum(r[6]));
  const peerQtrSalesGrowthArr = peerDataRows.map((r) => parseNum(r[8]));
  const peerMcapArr = peerDataRows
    .map((r) => parseNum(r[2]))
    .filter((v) => v > 0);
  const peerLoanArr = peerDataRows.map((r) => parseNum(r[9]));
  const peerDivYieldArr = peerDataRows
    .map((r) => parseNum(r[4]))
    .filter((v) => v >= 0);
  // Debt/Mcap ratio per peer
  const peerDebtMcapArr = peerDataRows.map((r) => {
    const mcap = parseNum(r[2]);
    const loan = parseNum(r[9]);
    return mcap > 0 ? loan / mcap : 0;
  });

  // ── PEG ratio ──
  let pegRatio = parseNum(r["PEG Ratio"]);
  if (!pegRatio && r["Stock P/E"] && pg["5 Years"]) {
    const pe5 = parseNum(r["Stock P/E"]);
    const pc5 = parsePercent(pg["5 Years"] ?? pg["5 Yrs"] ?? "");
    if (pc5 > 0) pegRatio = pe5 / pc5;
  }

  // ── Intrinsic Value ──
  let intrinsicValue = parseNum(r["Intrinsic Value"]);
  if (!intrinsicValue) {
    const eps = (last(annualEps) as number) || parseNum(r["EPS"]);
    const bv = parseNum(r["Book Value"]);
    if (eps > 0 && bv > 0) {
      intrinsicValue = Math.sqrt(22.5 * eps * bv);
    }
  }

  // ── 10yr CAGRs (computed from time series when growth tables are missing) ──
  const salesCagr10y = (() => {
    const v = parsePercent(sg["10 Years"] ?? sg["10 Yrs"] ?? "");
    if (v) return v;
    if (annualSales.length >= 11) {
      return cagr(
        annualSales[annualSales.length - 11],
        last(annualSales) as number,
        10,
      );
    }
    return 0;
  })();
  const profitCagr10y = (() => {
    const v = parsePercent(pg["10 Years"] ?? pg["10 Yrs"] ?? "");
    if (v) return v;
    if (annualNetProfit.length >= 11) {
      return cagr(
        Math.abs(annualNetProfit[annualNetProfit.length - 11]),
        Math.abs(last(annualNetProfit) as number),
        10,
      );
    }
    return 0;
  })();

  // ── Industry classification ──
  const fullText = (
    raw.about +
    raw.prosCons.pros.join(" ") +
    raw.prosCons.cons.join(" ")
  ).toLowerCase();
  let industry = "general";
  if (/(tobacco|cigarette)/i.test(fullText)) industry = "tobacco";
  else if (/(bank|nbfc|insurance|lending)/i.test(fullText))
    industry = "financial";
  else if (/(pharma|pharmaceutical)/i.test(fullText)) industry = "pharma";
  else if (/(software|it services|technology)/i.test(fullText))
    industry = "technology";
  else if (/(oil|petroleum|refin|exploration)/i.test(fullText))
    industry = "energy";

  return {
    pe: parseNum(r["Stock P/E"]),
    bookValue: parseNum(r["Book Value"]),
    dividendYield: parsePercent(r["Dividend Yield"]),
    roce: parsePercent(r["ROCE"]),
    roe: parsePercent(r["ROE"]),
    marketCap: parseNum(r["Market Cap"]),
    high52w,
    low52w,
    currentRatio,
    debtEquity,
    pledgedPct: parsePercent(r["Pledged percentage"] ?? r["Pledge"] ?? "0"),
    cmp,
    dma50: parseNum(r["DMA 50"]),
    dma200: parseNum(r["DMA 200"]),
    pegRatio,
    intrinsicValue,
    salesCagr10y,
    salesCagr5y: parsePercent(sg["5 Years"] ?? sg["5 Yrs"] ?? ""),
    salesCagr3y: parsePercent(sg["3 Years"] ?? sg["3 Yrs"] ?? ""),
    salesCagrTtm: parsePercent(sg["TTM"] ?? ""),
    profitCagr10y,
    profitCagr5y: parsePercent(pg["5 Years"] ?? pg["5 Yrs"] ?? ""),
    profitCagr3y: parsePercent(pg["3 Years"] ?? pg["3 Yrs"] ?? ""),
    profitCagrTtm: parsePercent(pg["TTM"] ?? ""),
    stockCagr5y: parsePercent(sc["5 Years"] ?? sc["5 Yrs"] ?? ""),
    stockCagr3y: parsePercent(sc["3 Years"] ?? sc["3 Yrs"] ?? ""),
    stockCagr1y: parsePercent(sc["1 Year"] ?? sc["1 Yr"] ?? ""),
    roe5y: parsePercent(re["5 Years"] ?? re["5 Yrs"] ?? ""),
    roe3y: parsePercent(re["3 Years"] ?? re["3 Yrs"] ?? ""),
    roeLastYear: parsePercent(re["Last Year"] ?? ""),
    annualSales,
    annualOpm,
    annualNetProfit,
    annualEps,
    annualDepreciation,
    otherIncomeCr,
    dividendPayout,
    annualReserves,
    annualBorrowings,
    annualTotalAssets,
    annualEquityCapital,
    cashEquivalents,
    annualCfo,
    annualCapex,
    annualFcf,
    debtorDays,
    debtorDaysSeries,
    inventoryDays,
    inventoryDaysSeries,
    cashConversionCycle: ccc,
    workingCapitalDays: wcd,
    annualRoce,
    cfoToOp,
    promoterHolding,
    fiiHolding,
    diiHolding,
    publicHolding,
    fiiTrend8q,
    diiTrend8q,
    promoterTrend8q,
    shareholdingHistory: {
      promoter: promoterNums,
      fii: fiiNums,
      dii: diiNums,
      public: publicNums,
    },
    qtrlySales,
    qtrlyOpm,
    qtrlyNetProfit,
    qtrlyEps,
    qtrlyPbt,
    qtrlyOtherIncome,
    peerPeMedian,
    peerRoceMedian,
    peerOpmMedian,
    peerPeArr,
    peerRoceArr,
    peerOpmArr,
    peerQtrProfitGrowthArr,
    peerQtrSalesGrowthArr,
    peerDebtMcapArr,
    peerDivYieldArr,
    peerMcapArr,
    pros: raw.prosCons.pros,
    cons: raw.prosCons.cons,
    industry,
  };
}

// ─── Item builder helpers ────────────────────────────────────────────────────

function makeItem(
  label: string,
  score01: number,
  weight: number,
  detail: string,
  tooltip: string,
): ScoreItem & { score01: number; weight: number } {
  const points = parseFloat((clamp(score01, 0, 1) * weight).toFixed(2));
  return { label, points, detail, tooltip, score01, weight };
}

function toFactorRow(
  item: ScoreItem & { score01: number; weight: number },
  category: string,
  rawValue: number | null,
  source: FactorRow["source"],
  notes?: string,
): FactorRow {
  return {
    factor: item.label,
    category,
    raw_value: rawValue,
    score_01: parseFloat(item.score01.toFixed(3)),
    weight: item.weight,
    points: item.points,
    source,
    notes,
  };
}

// ─── Category 1: Quality of Business (18) ────────────────────────────────────

function scoreQuality(m: Metrics, opts: ScoreOptions) {
  const assumptions: string[] = [];
  const opmSectorMedian =
    opts.sectorOpmMedian ?? getSectorOpmPrior(opts.sectorSlug ?? "_default");
  const opmSource = opts.sectorOpmMedian ? "live" : "prior";

  // ROCE consistency: mean × (1 − cv) mapped via logistic
  const annualRoce5 = m.annualRoce.slice(-5).filter((v) => v > 0);
  const roceMean5 = mean(annualRoce5);
  const roceCv5 = cv(annualRoce5);
  const roceConsistencyVal = roceMean5 * (1 - Math.min(roceCv5, 1));

  // OPM 3yr slope
  const opm3y = m.annualOpm.slice(-3);
  const opmSlope = opm3y.length >= 3 ? olsSlope(opm3y) : 0;

  // Sales CV (for gross profitability proxy)
  const salesCv = m.annualSales.length >= 5 ? cv(m.annualSales.slice(-5)) : 0.5;
  const grossProxy =
    salesCv > 0
      ? ((last(m.annualOpm) as number) || 0) / (salesCv * 100 + 1)
      : 0;

  // Capex / Depreciation 5yr avg
  let capexDepRatio = 1; // default = replacing assets
  if (m.annualCapex.length >= 3 && m.annualDepreciation.length >= 3) {
    const capex5 = mean(m.annualCapex.slice(-5));
    const dep5 = mean(m.annualDepreciation.slice(-5).filter((v) => v > 0));
    if (dep5 > 0) capexDepRatio = capex5 / dep5;
  } else {
    assumptions.push("Capex/Depreciation skipped - <3 years of data");
  }

  const items = [
    makeItem(
      "ROCE (latest)",
      logistic(m.roce, 18, 8.8),
      5,
      `ROCE ${m.roce.toFixed(1)}%`,
      "logistic(x0=18%, hw=8.8pp) - midpoint at 18%; full score at ~27%; near-zero at 9%",
    ),
    makeItem(
      "ROCE 5yr consistency",
      logistic(roceConsistencyVal, 16, 8),
      2.5,
      `Adj. ROCE ${roceConsistencyVal.toFixed(1)}% (mean × (1−CV))`,
      "Penalises cyclical ROCE swings - logistic(x0=16, hw=8) on mean×(1−CV)",
    ),
    makeItem(
      "ROE (latest)",
      logistic(m.roe, 18, 11),
      3.5,
      `ROE ${m.roe.toFixed(1)}%`,
      "logistic(x0=18%, hw=11pp) - wider band as ROE is noisier than ROCE",
    ),
    makeItem(
      "OPM vs Sector Median",
      logistic(
        m.annualOpm.length
          ? (last(m.annualOpm) as number) - opmSectorMedian
          : 0,
        0,
        6,
      ),
      3,
      `OPM ${((last(m.annualOpm) as number) || 0).toFixed(1)}% vs ${opmSectorMedian.toFixed(1)}% sector (${opmSource})`,
      "Relative factor - logistic(Δ vs sector median, x0=0, hw=6pp). Scored vs sector prior when live peers <8.",
    ),
    makeItem(
      "OPM Trend (3yr slope)",
      logistic(opmSlope, 0, 1.1),
      2,
      `OPM slope ${opmSlope >= 0 ? "+" : ""}${opmSlope.toFixed(2)}pp/yr`,
      "OLS slope of last 3 annual OPM% values - logistic(x0=0, hw=1.1pp/yr)",
    ),
    makeItem(
      "Capex / Depreciation",
      band(capexDepRatio, 0.5, 1.0, 2.5, 4.0),
      1.5,
      `Capex/Dep ${capexDepRatio.toFixed(2)}x (5yr avg)`,
      "Goldilocks: band(0.5, 1.0, 2.5, 4.0) - 1.0–2.5x is reinvesting for growth without over-spending",
    ),
    makeItem(
      "Margin Stability",
      linUp(grossProxy, 0, 30),
      0.5,
      `OPM / sales_volatility proxy = ${grossProxy.toFixed(1)}`,
      "Rewards stable margins on stable revenue - penalises commodity-like earnings volatility",
    ),
  ];

  return { items, assumptions };
}

// ─── Category 2: Growth (16) ─────────────────────────────────────────────────

function scoreGrowth(m: Metrics) {
  const assumptions: string[] = [];

  // EPS CAGR 5yr from series
  const epsCagr5 =
    m.annualEps.length >= 6
      ? cagr(
          Math.abs(m.annualEps[m.annualEps.length - 6]),
          Math.abs((last(m.annualEps) as number) || 0.001),
          5,
        )
      : m.profitCagr5y; // fallback

  // Growth durability - fraction of last 10 years with positive YoY sales growth
  let durabilityFraction = 0.5;
  if (m.annualSales.length >= 2) {
    let positive = 0;
    const n = Math.min(m.annualSales.length - 1, 10);
    for (let i = m.annualSales.length - n; i < m.annualSales.length; i++) {
      if (m.annualSales[i] > m.annualSales[i - 1]) positive++;
    }
    durabilityFraction = positive / n;
  }

  // Sales–profit alignment
  const salesProfitAlignment = (() => {
    if (!m.profitCagr5y || !m.salesCagr5y || m.salesCagr5y <= 0) return 0;
    if (m.profitCagr5y > m.salesCagr5y) return 1;
    return linUp(m.profitCagr5y / m.salesCagr5y, 0, 1);
  })();

  // Earnings acceleration (C1): gated by sign of 5yr CAGR
  const accelerationScore = (() => {
    if (m.profitCagr5y <= 0) {
      assumptions.push("Earnings acceleration gated - 5yr PAT CAGR ≤ 0");
      return 0;
    }
    // PAT TTM = sum of last 4 quarters; prior = sum of 4 quarters before that
    const patTtm =
      m.qtrlyNetProfit.length >= 4
        ? m.qtrlyNetProfit.slice(-4).reduce((a, b) => a + b, 0)
        : null;
    const patPrior =
      m.qtrlyNetProfit.length >= 8
        ? m.qtrlyNetProfit.slice(-8, -4).reduce((a, b) => a + b, 0)
        : null;
    if (!patTtm || !patPrior || patPrior <= 0) {
      assumptions.push("Earnings acceleration: insufficient quarterly data");
      return 0.5; // neutral
    }
    const oneYearGrowth = ((patTtm - patPrior) / patPrior) * 100;
    const accel = oneYearGrowth - m.profitCagr5y;
    return logistic(accel, 0, 10);
  })();

  // Redistribute 10yr weights if data missing
  const has10y = m.salesCagr10y !== 0 || m.profitCagr10y !== 0;
  const salesW10 = has10y ? 2 : 0;
  const profW10 = has10y ? 2 : 0;
  const salesW5 = has10y ? 2 : 3;
  const profW5 = has10y ? 2 : 3;
  if (!has10y)
    assumptions.push("10yr CAGR unavailable - weight redistributed to 5yr/3yr");

  const items = [
    makeItem(
      "Sales CAGR 10yr",
      logistic(m.salesCagr10y, 10, 8),
      salesW10,
      `${m.salesCagr10y.toFixed(1)}% CAGR`,
      "logistic(x0=10%, hw=8pp) - long-term franchise durability",
    ),
    makeItem(
      "Sales CAGR 5yr",
      logistic(m.salesCagr5y, 12, 8),
      salesW5,
      `${m.salesCagr5y.toFixed(1)}% CAGR`,
      "logistic(x0=12%, hw=8pp) - medium-term growth",
    ),
    makeItem(
      "Sales CAGR 3yr",
      logistic(m.salesCagr3y, 15, 8),
      1,
      `${m.salesCagr3y.toFixed(1)}% CAGR`,
      "logistic(x0=15%, hw=8pp) - recent window held to higher bar",
    ),
    makeItem(
      "PAT CAGR 10yr",
      logistic(m.profitCagr10y, 12, 9),
      profW10,
      `${m.profitCagr10y.toFixed(1)}% CAGR`,
      "logistic(x0=12%, hw=9pp)",
    ),
    makeItem(
      "PAT CAGR 5yr",
      logistic(m.profitCagr5y, 15, 9),
      profW5,
      `${m.profitCagr5y.toFixed(1)}% CAGR`,
      "logistic(x0=15%, hw=9pp)",
    ),
    makeItem(
      "PAT CAGR 3yr",
      logistic(m.profitCagr3y, 18, 9),
      1,
      `${m.profitCagr3y.toFixed(1)}% CAGR`,
      "logistic(x0=18%, hw=9pp) - highest bar for recent earnings",
    ),
    makeItem(
      "EPS CAGR 5yr",
      logistic(epsCagr5, 15, 9),
      1,
      `${epsCagr5.toFixed(1)}% CAGR`,
      "Per-share earnings growth (dilution-aware) - logistic(x0=15%, hw=9pp)",
    ),
    makeItem(
      "Earnings Acceleration",
      accelerationScore,
      2,
      `TTM growth vs 5yr CAGR (${m.profitCagr5y.toFixed(1)}%)`,
      "TTM PAT growth minus 5yr CAGR - logistic(x0=0, hw=10pp). Gated: no credit if 5yr CAGR ≤ 0.",
    ),
    makeItem(
      "Sales–Profit Alignment",
      salesProfitAlignment,
      1,
      `PAT CAGR (${m.profitCagr5y.toFixed(1)}%) vs Sales CAGR (${m.salesCagr5y.toFixed(1)}%)`,
      "Operating leverage check - full score if profit grows faster than sales",
    ),
    makeItem(
      "Growth Durability",
      linUp(durabilityFraction, 0.5, 1.0),
      2,
      `${Math.round(durabilityFraction * 100)}% of years with positive YoY sales growth`,
      "Fraction of last 10 years with positive YoY sales - linUp(0.5, 1.0). Anti-volatility.",
    ),
  ];

  return { items, assumptions };
}

// ─── Category 3: Valuation (14) ──────────────────────────────────────────────

function scoreValuation(m: Metrics, qualityScore01: number) {
  const assumptions: string[] = [];
  const pbv = m.bookValue > 0 ? m.cmp / m.bookValue : 0;

  // P/E vs industry (C2: guard)
  const peVsIndustry = (() => {
    if (!m.pe || m.pe <= 0) {
      assumptions.push("P/E non-positive - P/E vs Industry factor scored 0");
      return makeItem(
        "P/E vs Industry",
        0,
        4,
        "P/E unavailable",
        "linDown(pe/industry_pe, 0.5, 1.8)",
      );
    }
    if (!m.peerPeMedian || m.peerPeMedian <= 0) {
      assumptions.push(
        "Industry P/E unavailable - P/E vs Industry factor scored 0",
      );
      return makeItem(
        "P/E vs Industry",
        0,
        4,
        "Industry P/E unavailable",
        "linDown(pe/industry_pe, 0.5, 1.8)",
      );
    }
    const r = m.pe / m.peerPeMedian;
    return makeItem(
      "P/E vs Industry",
      linDown(r, 0.5, 1.8),
      4,
      `P/E ${m.pe.toFixed(1)}x vs sector ${m.peerPeMedian.toFixed(1)}x (ratio ${r.toFixed(2)}x)`,
      "linDown(pe/industry_pe, lo=0.5, hi=1.8) - full score at 50% of sector PE; zero at 1.8×",
    );
  })();

  // P/E absolute (C2: guard)
  const peAbsolute = (() => {
    if (!m.pe || m.pe <= 0) {
      assumptions.push("P/E non-positive - P/E Absolute scored 0");
      return makeItem(
        "P/E Absolute",
        0,
        2,
        "P/E unavailable",
        "linDown(pe, 12, 40)",
      );
    }
    return makeItem(
      "P/E Absolute",
      linDown(m.pe, 12, 40),
      2,
      `P/E ${m.pe.toFixed(1)}x`,
      "linDown(12, 40) - full score at P/E ≤12; zero at P/E ≥40",
    );
  })();

  // P/B (C2: guard)
  const pbRatio = (() => {
    if (!m.bookValue || m.bookValue <= 0) {
      assumptions.push("Book value ≤ 0 - P/B factor scored 0");
      return makeItem(
        "Price to Book",
        0,
        2,
        "Book value unavailable or negative",
        "Requires BV > 0",
      );
    }
    const score = pbv <= 1 ? 1 : linDown(pbv, 1.0, 3.0);
    return makeItem(
      "Price to Book",
      score,
      2,
      `P/B ${pbv.toFixed(2)}x (BV ₹${m.bookValue.toFixed(0)})`,
      "If CMP ≤ BV → full score. Else linDown(P/B, 1.0, 3.0); zero above 3×.",
    );
  })();

  // PEG (C2: guard)
  const pegItem = (() => {
    if (!m.pegRatio || m.pegRatio <= 0 || m.profitCagr5y <= 0) {
      assumptions.push(
        "PEG invalid (growth ≤ 0 or unavailable) - PEG factor scored 0",
      );
      return makeItem(
        "PEG Ratio",
        0,
        2,
        "PEG invalid - growth ≤ 0",
        "linDown(peg, 0.5, 2.5)",
      );
    }
    return makeItem(
      "PEG Ratio",
      linDown(m.pegRatio, 0.5, 2.5),
      2,
      `PEG ${m.pegRatio.toFixed(2)}`,
      "linDown(0.5, 2.5) - full score at PEG ≤0.5 (cheap growth); zero at PEG ≥2.5",
    );
  })();

  // Graham/IV gap
  const ivGap = (() => {
    if (!m.intrinsicValue || m.intrinsicValue <= 0) {
      assumptions.push("Intrinsic Value unavailable - IV Gap scored neutral");
      return makeItem(
        "Margin of Safety (IV)",
        0.5,
        2,
        "IV not available",
        "linUp(gap, −0.2, 0.5)",
      );
    }
    const gap = (m.intrinsicValue - m.cmp) / m.intrinsicValue;
    const ivSource = parseNum(String(m.intrinsicValue))
      ? "screener"
      : "Graham formula";
    assumptions.push(`Intrinsic Value source: ${ivSource}`);
    return makeItem(
      "Margin of Safety (IV)",
      linUp(gap, -0.2, 0.5),
      2,
      `CMP ₹${m.cmp.toFixed(0)} vs IV ₹${m.intrinsicValue.toFixed(0)} (${gap >= 0 ? "+" : ""}${(gap * 100).toFixed(1)}% MoS)`,
      "linUp(gap, lo=−0.2, hi=0.5) - 50% margin of safety = full score; overvalued = 0",
    );
  })();

  // Dividend yield
  const divYield = makeItem(
    "Dividend Yield",
    logistic(m.dividendYield, 2, 1.5),
    1,
    `${m.dividendYield.toFixed(2)}% yield`,
    "logistic(x0=2%, hw=1.5pp) - caps gracefully at ~5% to avoid yield trap",
  );

  // 52w drawdown - quality-gated (C3)
  const drawdown = (() => {
    if (!m.high52w || !m.cmp)
      return makeItem(
        "52w Drawdown",
        0,
        1,
        "Price range unavailable",
        "Requires 52w high",
      );
    const pct = (m.high52w - m.cmp) / m.high52w;
    if (qualityScore01 < 0.6) {
      assumptions.push(
        `Drawdown points withheld - quality score ${(qualityScore01 * 100).toFixed(0)}% < 60% (avoiding falling knife)`,
      );
      return makeItem(
        "52w Drawdown",
        0,
        1,
        `${(pct * 100).toFixed(1)}% below 52w high - withheld (quality gate)`,
        "Quality-gated: only rewards 'buying quality on weakness', not falling knives",
      );
    }
    return makeItem(
      "52w Drawdown",
      linUp(pct, 0.1, 0.4),
      1,
      `${(pct * 100).toFixed(1)}% below 52w high ₹${m.high52w.toFixed(0)}`,
      "linUp(0.10, 0.40) - 10–40% drawdown from high is an attractive entry zone",
    );
  })();

  return {
    items: [
      peVsIndustry,
      peAbsolute,
      pbRatio,
      pegItem,
      ivGap,
      divYield,
      drawdown,
    ],
    assumptions,
  };
}

// ─── Category 4: Balance Sheet & Solvency (12) ───────────────────────────────

const SECTOR_DE_BANDS: Record<string, [number, number, number, number]> = {
  utilities: [0, 0.3, 2.5, 4.5],
  telecom: [0, 0.3, 2.0, 4.0],
  infrastructure: [0, 0.3, 2.0, 3.5],
  "real-estate": [0, 0.3, 1.8, 3.5],
  "construction-infra": [0, 0.3, 1.8, 3.5],
  power: [0, 0.3, 2.0, 4.0],
  "renewable-energy": [0, 0.3, 2.5, 4.5],
  aviation: [0, 0.3, 2.0, 4.0],
  automobile: [0, 0.2, 1.5, 3.0],
  _default: [0, 0.2, 1.5, 3.0],
};

function scoreBalanceSheet(m: Metrics, opts: ScoreOptions) {
  const assumptions: string[] = [];

  // D/E sector-aware band (C4)
  const deScore = (() => {
    const bv =
      (last(m.annualReserves) as number) +
      (last(m.annualEquityCapital) as number);
    if (bv <= 0) {
      assumptions.push("Negative book value - D/E undefined, scored 0");
      return makeItem(
        "Debt to Equity",
        0,
        4,
        "Negative book value",
        "Sector-aware band",
      );
    }
    const [a, b, c, d] =
      SECTOR_DE_BANDS[opts.sectorSlug ?? "_default"] ??
      SECTOR_DE_BANDS["_default"];
    assumptions.push(
      `D/E band: [${a}, ${b}, ${c}, ${d}] for sector "${opts.sectorSlug ?? "default"}"`,
    );
    return makeItem(
      "Debt to Equity",
      band(m.debtEquity, a, b, c, d),
      4,
      `D/E ${m.debtEquity.toFixed(2)}x`,
      `Sector-aware band(${a}, ${b}, ${c}, ${d}) - Goldilocks zone ${b}–${c}×`,
    );
  })();

  // Debt trajectory 5yr
  const debtTraj5 = (() => {
    const borrow5yAgo =
      m.annualBorrowings.length >= 6
        ? m.annualBorrowings[m.annualBorrowings.length - 6]
        : null;
    const currentBorrow = last(m.annualBorrowings) as number;
    if (!borrow5yAgo || borrow5yAgo <= 0) {
      assumptions.push("Debt trajectory 5yr: insufficient data");
      return makeItem(
        "Debt Trend (5yr)",
        0.5,
        2,
        "Insufficient data",
        "linDown(current/5yAgo, 0.8, 2.0)",
      );
    }
    const ratio = currentBorrow / borrow5yAgo;
    return makeItem(
      "Debt Trend (5yr)",
      linDown(ratio, 0.8, 2.0),
      2,
      `Debt ${ratio < 1 ? "↓" : "↑"} ${ratio.toFixed(2)}× vs 5yr ago`,
      "linDown(0.8, 2.0) - debt shrinking scores high; doubling scores 0",
    );
  })();

  // Debt trajectory 10yr
  const debtTraj10 = (() => {
    const borrow10yAgo =
      m.annualBorrowings.length >= 11
        ? m.annualBorrowings[m.annualBorrowings.length - 11]
        : null;
    const currentBorrow = last(m.annualBorrowings) as number;
    if (!borrow10yAgo || borrow10yAgo <= 0) {
      assumptions.push("Debt trajectory 10yr: insufficient data");
      return makeItem(
        "Debt Trend (10yr)",
        0.5,
        1,
        "Insufficient data",
        "linDown(current/10yAgo, 0.8, 2.0)",
      );
    }
    const ratio = currentBorrow / borrow10yAgo;
    return makeItem(
      "Debt Trend (10yr)",
      linDown(ratio, 0.8, 2.0),
      1,
      `Debt ${ratio.toFixed(2)}× vs 10yr ago`,
      "linDown(0.8, 2.0) on 10-year horizon",
    );
  })();

  // Pledged %
  const pledgeItem = makeItem(
    "Pledged Shares",
    linDown(m.pledgedPct, 0, 10),
    2,
    m.pledgedPct > 0
      ? `${m.pledgedPct.toFixed(1)}% pledged`
      : m.pledgedPct === 0
        ? "No shares pledged"
        : "Pledge data not available",
    "linDown(0, 10) - 0% pledged = full score; ≥10% = 0. Heavy penalty also in §5 if ≥25%.",
  );

  // Debt vs market cap
  const totalDebt = last(m.annualBorrowings) as number;
  const debtMcap = makeItem(
    "Debt vs Market Cap",
    m.marketCap > 0 ? linDown(totalDebt / m.marketCap, 0.1, 0.6) : 0,
    1,
    `Debt ₹${totalDebt.toFixed(0)} Cr vs MCap ₹${m.marketCap.toFixed(0)} Cr`,
    "linDown(debt/mcap, 0.1, 0.6) - debt >60% of market cap scores 0",
  );

  // Current ratio
  const crItem = makeItem(
    "Current Ratio",
    band(m.currentRatio, 0.8, 1.5, 3.0, 5.0),
    1,
    m.currentRatio
      ? `Current ratio ${m.currentRatio.toFixed(2)}`
      : "Current ratio unavailable",
    "band(0.8, 1.5, 3.0, 5.0) - Goldilocks 1.5–3.0; >5 = idle capital; <0.8 = liquidity risk",
  );

  // Reserves CAGR 5yr
  const reserves5yCagr =
    m.annualReserves.length >= 6
      ? cagr(
          m.annualReserves[m.annualReserves.length - 6],
          last(m.annualReserves) as number,
          5,
        )
      : 0;
  const reservesCagr = makeItem(
    "Reserves CAGR 5yr",
    logistic(reserves5yCagr, 10, 7),
    1,
    `${reserves5yCagr.toFixed(1)}% CAGR`,
    "logistic(x0=10%, hw=7pp) - compounding equity base",
  );

  return {
    items: [
      deScore,
      debtTraj5,
      debtTraj10,
      pledgeItem,
      debtMcap,
      crItem,
      reservesCagr,
    ],
    assumptions,
  };
}

// ─── Category 5: Cash Flow Quality (10) ──────────────────────────────────────

function scoreCashFlow(m: Metrics) {
  const assumptions: string[] = [];

  // CFO/PAT 5yr avg (loosened hw=0.55 per S1)
  const cfoPat = (() => {
    const pairs = m.annualCfo
      .map((c, i) => ({ cfo: c, pat: m.annualNetProfit[i] }))
      .filter(({ pat }) => pat != null && pat > 0)
      .slice(-5);
    if (pairs.length < 2) {
      assumptions.push("CFO/PAT: insufficient data");
      return { ratio: 0, n: 0 };
    }
    const ratio = mean(pairs.map(({ cfo, pat }) => cfo / pat));
    return { ratio, n: pairs.length };
  })();

  // FCF positive years (of last 5)
  const fcfPositive = m.annualFcf.slice(-5).filter((v) => v > 0).length;

  // FCF yield
  const fcfYield =
    m.marketCap > 0 && m.annualFcf.length
      ? ((last(m.annualFcf) as number) / m.marketCap) * 100
      : 0;

  // Receivable days OLS slope
  const recSlope =
    m.debtorDaysSeries.length >= 3 ? olsSlope(m.debtorDaysSeries.slice(-5)) : 0;
  if (m.debtorDaysSeries.length < 3)
    assumptions.push("Receivable days trend: insufficient data");

  // Inventory days OLS slope
  const invSlope =
    m.inventoryDaysSeries.length >= 3
      ? olsSlope(m.inventoryDaysSeries.slice(-5))
      : 0;
  if (m.inventoryDaysSeries.length < 3)
    assumptions.push("Inventory days trend: insufficient data");

  // CFO growth normalised slope
  const cfoSlope =
    m.annualCfo.length >= 3 ? olsSlope(m.annualCfo.slice(-5)) : 0;
  const cfoMean = mean(m.annualCfo.filter((v) => v > 0).slice(-5));
  const cfoNormSlope = cfoMean > 0 ? cfoSlope / cfoMean : 0;

  const items = [
    makeItem(
      "Earnings Quality (CFO/PAT)",
      logistic(cfoPat.ratio, 0.85, 0.55),
      3,
      cfoPat.n > 0
        ? `5yr avg CFO/PAT = ${cfoPat.ratio.toFixed(2)} (n=${cfoPat.n})`
        : "Insufficient data",
      "logistic(x0=0.85, hw=0.55) - measures profit-to-cash conversion quality; <0.5 triggers penalty",
    ),
    makeItem(
      "FCF Positive Years",
      fcfPositive / 5,
      2,
      `${fcfPositive}/5 years with positive FCF`,
      "Fraction of last 5 years with positive free cash flow × 2",
    ),
    makeItem(
      "FCF Yield",
      linUp(fcfYield, 1, 7),
      2,
      m.marketCap > 0
        ? `FCF yield ${fcfYield.toFixed(2)}%`
        : "Market cap unavailable",
      "linUp(1%, 7%) - 7%+ FCF yield = full score",
    ),
    makeItem(
      "Receivable Days Trend",
      linDown(Math.max(recSlope, 0), 0, 15),
      1.5,
      `Debtor days slope: ${recSlope.toFixed(1)} days/yr`,
      "linDown(slope, 0, 15) - stretching >15 days/yr = 0 score. Deteriorating working capital.",
    ),
    makeItem(
      "Inventory Days Trend",
      linDown(Math.max(invSlope, 0), 0, 20),
      1,
      `Inventory days slope: ${invSlope.toFixed(1)} days/yr`,
      "linDown(slope, 0, 20) - bloating >20 days/yr = 0 score",
    ),
    makeItem(
      "CFO Growth Trend",
      logistic(cfoNormSlope, 0, 0.5),
      0.5,
      `Normalised CFO slope: ${cfoNormSlope.toFixed(2)}`,
      "OLS slope / mean CFO - logistic(x0=0, hw=0.5). Rewards steadily growing cash generation.",
    ),
  ];

  return { items, assumptions };
}

// ─── Category 6: Quarterly Momentum (10) ─────────────────────────────────────

function scoreQuarterly(m: Metrics) {
  const assumptions: string[] = [];

  if (m.qtrlySales.length < 5) {
    assumptions.push(
      "Quarterly momentum: insufficient quarterly data (<5 quarters)",
    );
    return {
      items: [] as ReturnType<typeof makeItem>[],
      assumptions,
      quarterlyMult: 1,
    };
  }

  const n = m.qtrlySales.length;

  // YoY (latest vs same quarter 4 quarters ago)
  const revYoy =
    m.qtrlySales[n - 5] > 0
      ? ((m.qtrlySales[n - 1] - m.qtrlySales[n - 5]) / m.qtrlySales[n - 5]) *
        100
      : 0;
  const revQoq =
    m.qtrlySales[n - 2] > 0
      ? ((m.qtrlySales[n - 1] - m.qtrlySales[n - 2]) / m.qtrlySales[n - 2]) *
        100
      : 0;

  const profYoy =
    m.qtrlyNetProfit.length >= 5 && m.qtrlyNetProfit[n - 5] > 0
      ? ((m.qtrlyNetProfit[n - 1] - m.qtrlyNetProfit[n - 5]) /
          m.qtrlyNetProfit[n - 5]) *
        100
      : 0;

  const epsYoy =
    m.qtrlyEps.length >= 5 && m.qtrlyEps[n - 5] > 0
      ? ((m.qtrlyEps[n - 1] - m.qtrlyEps[n - 5]) / m.qtrlyEps[n - 5]) * 100
      : profYoy; // fallback

  // OPM YoY delta
  const opmYoyDelta =
    m.qtrlyOpm.length >= 5
      ? m.qtrlyOpm[m.qtrlyOpm.length - 1] - m.qtrlyOpm[m.qtrlyOpm.length - 5]
      : 0;

  // OPM 4-quarter OLS slope
  const opmSlope4q =
    m.qtrlyOpm.length >= 4 ? olsSlope(m.qtrlyOpm.slice(-4)) : 0;

  // PAT 2yr stacked CAGR (base-effect resilient): (latest_q / q_8_ago)^0.5 - 1
  const pat2yCagr =
    m.qtrlyNetProfit.length >= 9 && m.qtrlyNetProfit[n - 9] > 0
      ? (Math.pow(
          Math.abs(m.qtrlyNetProfit[n - 1]) / m.qtrlyNetProfit[n - 9],
          0.5,
        ) -
          1) *
        100
      : profYoy * 0.5; // rough fallback

  // Other-income share of PBT (positive-only factor, §3.6)
  const latestPbt = m.qtrlyPbt.length ? m.qtrlyPbt[m.qtrlyPbt.length - 1] : 0;
  const latestOtherIncome = m.qtrlyOtherIncome.length
    ? m.qtrlyOtherIncome[m.qtrlyOtherIncome.length - 1]
    : 0;
  const otherIncomeShare = latestPbt > 0 ? latestOtherIncome / latestPbt : 0;

  // Sequential profit growth streak (capped at 4 quarters)
  let streak = 0;
  for (let i = m.qtrlyNetProfit.length - 1; i >= 5 && streak < 4; i--) {
    if (m.qtrlyNetProfit[i] > m.qtrlyNetProfit[i - 4]) streak++;
    else break;
  }

  const items = [
    makeItem(
      "Revenue YoY",
      logistic(revYoy, 10, 10),
      1.5,
      `${revYoy.toFixed(1)}% YoY`,
      "logistic(x0=10%, hw=10pp)",
    ),
    makeItem(
      "Revenue QoQ",
      logistic(revQoq, 0, 5),
      0.5,
      `${revQoq.toFixed(1)}% QoQ`,
      "logistic(x0=0, hw=5pp)",
    ),
    makeItem(
      "Net Profit YoY",
      logistic(profYoy, 10, 10),
      1.5,
      `${profYoy.toFixed(1)}% YoY`,
      "logistic(x0=10%, hw=10pp)",
    ),
    makeItem(
      "PAT 2yr Stacked CAGR",
      logistic(pat2yCagr, 10, 12),
      1,
      `${pat2yCagr.toFixed(1)}% 2yr CAGR`,
      "logistic(x0=10%, hw=12pp) - wider hw for base-effect resilience",
    ),
    makeItem(
      "EPS YoY",
      logistic(epsYoy, 10, 10),
      1,
      `${epsYoy.toFixed(1)}% YoY`,
      "logistic(x0=10%, hw=10pp)",
    ),
    makeItem(
      "OPM YoY Δ",
      logistic(opmYoyDelta, 0, 2.7),
      1.5,
      `${opmYoyDelta >= 0 ? "+" : ""}${opmYoyDelta.toFixed(1)}pp YoY`,
      "logistic(x0=0, hw=2.7pp) - margin expansion above peer growth",
    ),
    makeItem(
      "OPM Trend (4Q OLS)",
      logistic(opmSlope4q, 0, 1.1),
      1,
      `OLS slope ${opmSlope4q.toFixed(2)}pp/qtr`,
      "logistic(x0=0, hw=1.1) on 4-quarter OPM trend",
    ),
    makeItem(
      "Other-Income Quality",
      linDown(otherIncomeShare, 0.1, 0.3),
      1,
      `Other income ${(otherIncomeShare * 100).toFixed(1)}% of PBT`,
      "linDown(0.10, 0.30) - score 1 if <10%; 0 if >30%. Tail-risk penalty for >30% in §5.",
    ),
    makeItem(
      "Profit Growth Streak",
      linUp(streak, 0, 4),
      1,
      `${streak} consecutive YoY profit-growth quarters`,
      "Consecutive quarters of YoY PAT growth - capped at 4 to avoid base-effect gaming",
    ),
  ];

  return { items, assumptions };
}

// ─── Category 7: Shareholding (8) ─────────────────────────────────────────────

function scoreShareholding(m: Metrics) {
  // FII+DII joint buying confirmation
  const jointBuying = m.fiiTrend8q > 0 && m.diiTrend8q > 0 ? 1 : 0;

  const items = [
    makeItem(
      "Promoter Holding Level",
      linUp(m.promoterHolding, 25, 60),
      2,
      `${m.promoterHolding.toFixed(1)}%`,
      "linUp(25%, 60%) - full score at ≥60%; zero if <25%",
    ),
    makeItem(
      "Promoter Trend (8Q)",
      logistic(m.promoterTrend8q, 0, 2),
      3,
      `${m.promoterTrend8q >= 0 ? "+" : ""}${m.promoterTrend8q.toFixed(2)}pp over 8 quarters`,
      "logistic(x0=0, hw=2pp) - direction of promoter stake matters most. Exit penalty in §5.",
    ),
    makeItem(
      "FII Trend (8Q)",
      logistic(m.fiiTrend8q, 0, 3),
      1.5,
      `FII ${m.fiiTrend8q >= 0 ? "+" : ""}${m.fiiTrend8q.toFixed(2)}pp over 8Q`,
      "logistic(x0=0, hw=3pp) - wider band as FII flows are more volatile",
    ),
    makeItem(
      "DII Trend (8Q)",
      logistic(m.diiTrend8q, 0, 3),
      1,
      `DII ${m.diiTrend8q >= 0 ? "+" : ""}${m.diiTrend8q.toFixed(2)}pp over 8Q`,
      "logistic(x0=0, hw=3pp)",
    ),
    makeItem(
      "FII + DII Joint Buying",
      jointBuying,
      0.5,
      jointBuying
        ? "Both FII and DII added stake over 8Q"
        : "No joint institutional buying",
      "Binary: +0.5 if both FII and DII trends positive - smart-money confirmation",
    ),
  ];

  return { items };
}

// ─── Category 8: Peer-relative composite (6) ─────────────────────────────────

function scorePeers(m: Metrics) {
  const assumptions: string[] = [];

  const totalPeers = m.peerPeArr.length;
  if (totalPeers < 3) {
    assumptions.push(
      `Peer composite skipped - only ${totalPeers} peers (min 3 required)`,
    );
    return {
      items: [] as ReturnType<typeof makeItem>[],
      peerPercentile: undefined,
      assumptions,
    };
  }

  // Add self to peer arrays so rank is computed relative to full peer set
  const peScores = percentileRank(m.pe, [...m.peerPeArr, m.pe], false); // lower PE = better
  const roceScores = percentileRank(m.roce, [...m.peerRoceArr, m.roce], true);
  const opmScores = percentileRank(
    last(m.annualOpm) as number,
    [...m.peerOpmArr, last(m.annualOpm) as number],
    true,
  );
  const profGScores = percentileRank(
    m.profitCagrTtm,
    [...m.peerQtrProfitGrowthArr, m.profitCagrTtm],
    true,
  );
  const salesGScores = percentileRank(
    m.salesCagrTtm,
    [...m.peerQtrSalesGrowthArr, m.salesCagrTtm],
    true,
  );
  const myDebtMcap =
    m.marketCap > 0 ? (last(m.annualBorrowings) as number) / m.marketCap : 0;
  const debtScores = percentileRank(
    myDebtMcap,
    [...m.peerDebtMcapArr, myDebtMcap],
    false,
  ); // lower debt = better
  const divScores = percentileRank(
    m.dividendYield,
    [...m.peerDivYieldArr, m.dividendYield],
    true,
  );
  const mcapScore = percentileRank(
    Math.log1p(m.marketCap),
    m.peerMcapArr.map((v) => Math.log1p(v)),
    true,
  );

  // Composite peer percentile (weighted)
  const weightedPercentile =
    (peScores * 1.0 +
      roceScores * 1.0 +
      opmScores * 1.0 +
      profGScores * 1.0 +
      salesGScores * 0.5 +
      debtScores * 0.5 +
      divScores * 0.5 +
      mcapScore * 0.5) /
    (1 + 1 + 1 + 1 + 0.5 + 0.5 + 0.5 + 0.5);

  const items = [
    makeItem(
      "Peer: P/E Rank",
      peScores,
      1.0,
      `${(peScores * 100).toFixed(0)}th percentile (lower PE better)`,
      "Percentile rank within peer set - lower P/E = higher rank",
    ),
    makeItem(
      "Peer: ROCE Rank",
      roceScores,
      1.0,
      `${(roceScores * 100).toFixed(0)}th percentile`,
      "Higher ROCE = better rank",
    ),
    makeItem(
      "Peer: OPM Rank",
      opmScores,
      1.0,
      `${(opmScores * 100).toFixed(0)}th percentile`,
      "Higher OPM = better rank",
    ),
    makeItem(
      "Peer: Profit Growth",
      profGScores,
      1.0,
      `${(profGScores * 100).toFixed(0)}th percentile`,
      "Higher quarterly profit growth = better rank",
    ),
    makeItem(
      "Peer: Sales Growth",
      salesGScores,
      0.5,
      `${(salesGScores * 100).toFixed(0)}th percentile`,
      "Higher quarterly sales growth = better rank",
    ),
    makeItem(
      "Peer: Debt Efficiency",
      debtScores,
      0.5,
      `${(debtScores * 100).toFixed(0)}th percentile (lower debt/mcap better)`,
      "Lower debt/mcap = better rank",
    ),
    makeItem(
      "Peer: Dividend Yield",
      divScores,
      0.5,
      `${(divScores * 100).toFixed(0)}th percentile`,
      "Higher dividend yield = better rank",
    ),
    makeItem(
      "Peer: Market Cap Size",
      mcapScore,
      0.5,
      `${(mcapScore * 100).toFixed(0)}th percentile (log-scaled)`,
      "Log-scaled market cap - larger = less illiquidity risk",
    ),
  ];

  return { items, peerPercentile: weightedPercentile, assumptions };
}

// ─── Category 9: Technical / Price Action (4) ────────────────────────────────

type Regime = "uptrend" | "sideways" | "downtrend";

function classifyRegime(
  cmp: number,
  dma50: number,
  dma200: number,
  low52: number,
  high52: number,
): { regime: Regime; points: number } {
  // Signal 1: DMA stack
  const stack =
    cmp > dma50 && dma50 > dma200 ? 1 : cmp < dma50 && dma50 < dma200 ? -1 : 0;

  // Signal 2: 52-week position
  const pos = high52 > low52 ? (cmp - low52) / (high52 - low52) : 0.5;
  const posSignal = pos > 0.66 ? 1 : pos < 0.33 ? -1 : 0;

  const total = stack + posSignal;
  if (total >= 2) return { regime: "uptrend", points: 4 };
  if (total === 1) return { regime: "uptrend", points: 3 };
  if (total === 0) return { regime: "sideways", points: 2 };
  if (total === -1) return { regime: "downtrend", points: 1 };
  return { regime: "downtrend", points: 0 };
}

function scoreTechnical(m: Metrics) {
  if (!m.dma50 && !m.dma200) {
    return {
      regime: "sideways" as Regime,
      items: [
        makeItem(
          "Price Regime",
          0.5,
          4,
          "DMA data unavailable - neutral",
          "2-signal: DMA stack + 52w position",
        ),
      ],
    };
  }

  const { regime, points } = classifyRegime(
    m.cmp,
    m.dma50,
    m.dma200,
    m.low52w,
    m.high52w,
  );

  const detail = [
    m.dma50
      ? `CMP ${m.cmp > m.dma50 ? "above" : "below"} 50 DMA (₹${m.dma50.toFixed(0)})`
      : null,
    m.dma200
      ? `${m.cmp > m.dma200 ? "above" : "below"} 200 DMA (₹${m.dma200.toFixed(0)})`
      : null,
    m.high52w && m.low52w
      ? `at ${(((m.cmp - m.low52w) / (m.high52w - m.low52w)) * 100).toFixed(0)}% of 52w range`
      : null,
  ]
    .filter(Boolean)
    .join("; ");

  return {
    regime,
    items: [
      makeItem(
        "Price Regime",
        points / 4,
        4,
        `${regime.charAt(0).toUpperCase() + regime.slice(1)} - ${detail}`,
        "2-signal regime: DMA stack (CMP vs 50/200 DMA) + 52w position (>0.66 up; <0.33 down). Minimalist - no fitted parameters.",
      ),
    ],
  };
}

// ─── Category 10: Size & Liquidity (2) ───────────────────────────────────────

function scoreSize(m: Metrics) {
  const score =
    m.marketCap > 50000
      ? 1
      : m.marketCap > 10000
        ? 0.75
        : m.marketCap > 1000
          ? 0.5
          : 0.25;

  const tier =
    m.marketCap > 50000
      ? "Large-cap"
      : m.marketCap > 10000
        ? "Mid-cap"
        : m.marketCap > 1000
          ? "Small-cap"
          : "Micro-cap";

  return {
    items: [
      makeItem(
        "Market Cap Tier",
        score,
        2,
        `${tier} - ₹${m.marketCap.toLocaleString("en-IN")} Cr`,
        "Investability tax: Large >₹50k Cr = 2pts; Mid = 1.5pts; Small = 1pt; Micro = 0.5pts",
      ),
    ],
  };
}

// ─── Bonuses ─────────────────────────────────────────────────────────────────

function calcBonuses(m: Metrics): Bonus[] {
  const bonuses: Bonus[] = [];

  const totalDebt = last(m.annualBorrowings) as number;
  if (totalDebt < m.cashEquivalents && m.cashEquivalents > 0) {
    bonuses.push({
      label: "Net Cash Company",
      points: 2,
      detail: "Total debt < cash equivalents - effectively debt-free",
    });
  }

  if (m.roe5y >= 18 && m.profitCagr5y >= 15 && m.debtEquity < 0.5) {
    bonuses.push({
      label: "Compounding Machine",
      points: 2,
      detail: `5yr ROE ${m.roe5y.toFixed(1)}%, 5yr PAT CAGR ${m.profitCagr5y.toFixed(1)}%, D/E ${m.debtEquity.toFixed(2)}`,
    });
  }

  if (m.dividendPayout >= 20 && m.dividendPayout <= 60 && m.dividendYield > 0) {
    bonuses.push({
      label: "Dividend Aristocrat",
      points: 1,
      detail: `${m.dividendPayout.toFixed(1)}% payout ratio - sustainable dividend track record`,
    });
  }

  if (m.promoterTrend8q >= 1.5) {
    bonuses.push({
      label: "Promoter Buying",
      points: 1,
      detail: `Promoters added ${m.promoterTrend8q.toFixed(2)}pp stake over 8 quarters`,
    });
  }

  const opmLast = last(m.annualOpm) as number;
  const opmPrev3 =
    m.annualOpm.length >= 4 ? mean(m.annualOpm.slice(-4, -1)) : opmLast;
  const roceLast = m.roce;
  const rocePrev3 =
    m.annualRoce.length >= 4 ? mean(m.annualRoce.slice(-4, -1)) : roceLast;
  if (opmLast - opmPrev3 >= 3 && roceLast - rocePrev3 >= 5) {
    bonuses.push({
      label: "Margin Expander",
      points: 1,
      detail: `OPM +${(opmLast - opmPrev3).toFixed(1)}pp and ROCE +${(roceLast - rocePrev3).toFixed(1)}pp over 3yr`,
    });
  }

  // Cap at +5
  let total = 0;
  return bonuses.filter((b) => {
    if (total + b.points > 5) return false;
    total += b.points;
    return true;
  });
}

// ─── Penalties ────────────────────────────────────────────────────────────────

function calcPenalties(m: Metrics): Penalty[] {
  const penalties: Penalty[] = [];

  if (m.industry === "tobacco") {
    penalties.push({
      label: "Sin Business - Tobacco",
      points: -4,
      detail: "Industry ceiling 75 also applied; ESG exclusion risk",
    });
  }

  if (m.pledgedPct >= 25) {
    penalties.push({
      label: "Heavy Promoter Pledge",
      points: -5,
      detail: `${m.pledgedPct.toFixed(1)}% of promoter shares pledged - material risk on sharp drawdowns`,
    });
  }

  // Promoter exit: 5pp+ drop over last 8 quarters (2yr)
  if (m.promoterTrend8q <= -5) {
    penalties.push({
      label: "Promoter Exit",
      points: -3,
      detail: `Promoters sold ${Math.abs(m.promoterTrend8q).toFixed(1)}pp stake in last 8 quarters`,
    });
  }

  // CFO/PAT quality failure
  const cfoPatPairs = m.annualCfo
    .map((c, i) => ({ cfo: c, pat: m.annualNetProfit[i] }))
    .filter(({ pat }) => pat != null && pat > 0)
    .slice(-5);
  if (cfoPatPairs.length >= 3) {
    const avgRatio = mean(cfoPatPairs.map(({ cfo, pat }) => cfo / pat));
    if (avgRatio < 0.5) {
      penalties.push({
        label: "Earnings Quality Red Flag",
        points: -3,
        detail: `5yr avg CFO/PAT = ${avgRatio.toFixed(2)} - persistent accrual earnings`,
      });
    }
  }

  // Other-income dependency (tail-risk gate beyond the continuous factor)
  const latestPbt = m.qtrlyPbt.length ? m.qtrlyPbt[m.qtrlyPbt.length - 1] : 0;
  const latestOI = m.qtrlyOtherIncome.length
    ? m.qtrlyOtherIncome[m.qtrlyOtherIncome.length - 1]
    : 0;
  if (latestPbt > 0) {
    const oiShare = latestOI / latestPbt;
    if (oiShare > 0.5) {
      penalties.push({
        label: "Other-Income Dependency",
        points: -4,
        detail: `Other income is ${(oiShare * 100).toFixed(0)}% of PBT - core operations may be weak`,
      });
    } else if (oiShare > 0.3) {
      penalties.push({
        label: "Other-Income Elevated",
        points: -2,
        detail: `Other income is ${(oiShare * 100).toFixed(0)}% of PBT - monitor for sustainability`,
      });
    }
  }

  // Float dominated by retail public
  if (
    m.publicHolding > Math.max(m.fiiHolding, m.diiHolding, m.promoterHolding)
  ) {
    penalties.push({
      label: "Float Dominated by Retail",
      points: -1.5,
      detail: `Public holds ${m.publicHolding.toFixed(1)}% - largest single bloc; institutional conviction low`,
    });
  }

  // Illiquid free float
  const freeFloat = 1 - m.promoterHolding / 100;
  if (freeFloat < 0.15 && m.marketCap < 5000) {
    penalties.push({
      label: "Illiquid Free Float",
      points: -2,
      detail: `Free float ${(freeFloat * 100).toFixed(1)}% with mcap <₹5,000 Cr - thin liquidity`,
    });
  }

  // Persistent FCF deficit
  const fcfNegCount = m.annualFcf.slice(-5).filter((v) => v < 0).length;
  if (fcfNegCount >= 4) {
    penalties.push({
      label: "Persistent FCF Deficit",
      points: -2,
      detail: `FCF negative in ${fcfNegCount}/5 years - capital-hungry business`,
    });
  }

  // Cap at -14
  let total = 0;
  return penalties.filter((p) => {
    if (total + p.points < -14) return false;
    total += p.points;
    return true;
  });
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function scoreCompany(
  raw: RawCompanyData,
  opts: ScoreOptions = {},
): Omit<Company, "rank"> {
  const m = extractMetrics(raw);
  const allAssumptions: string[] = [];

  // ── Score all categories ──────────────────────────────────────────────────
  const qualResult = scoreQuality(m, opts);
  allAssumptions.push(...qualResult.assumptions);
  const qualItems = qualResult.items;
  const qualTotal = clamp(
    qualItems.reduce((s, i) => s + i.points, 0),
    0,
    18,
  );
  const qualScore01 = qualTotal / 18; // for drawdown quality gate

  const growResult = scoreGrowth(m);
  allAssumptions.push(...growResult.assumptions);

  const valResult = scoreValuation(m, qualScore01);
  allAssumptions.push(...valResult.assumptions);

  const bsResult = scoreBalanceSheet(m, opts);
  allAssumptions.push(...bsResult.assumptions);

  const cfResult = scoreCashFlow(m);
  allAssumptions.push(...cfResult.assumptions);

  const qResult = scoreQuarterly(m);
  allAssumptions.push(...qResult.assumptions);

  const shResult = scoreShareholding(m);
  const sizeResult = scoreSize(m);

  const techResult = scoreTechnical(m);
  const { regime } = techResult;

  const peerResult = scorePeers(m);
  allAssumptions.push(...(peerResult.assumptions ?? []));

  // ── Freshness multipliers ─────────────────────────────────────────────────
  // Without actual date metadata from scraper, we default to 1.0 (fresh).
  // When screener adds last-updated dates, wire them here.
  const quarterlyMult = 1.0;
  const annualMult = 1.0;

  // ── Category max points (items capped to max) ─────────────────────────────
  function clampCat(
    items: ReturnType<typeof makeItem>[],
    catMax: number,
    mult = 1,
  ): { earned: number; items: ScoreItem[] } {
    const raw = items.reduce((s, i) => s + i.points, 0) * mult;
    const earned = parseFloat(clamp(raw, 0, catMax).toFixed(1));
    return {
      earned,
      items: items.map((i) => ({
        label: i.label,
        points: parseFloat((i.points * mult).toFixed(2)),
        detail: i.detail,
        tooltip: i.tooltip,
      })),
    };
  }

  const CATEGORIES: {
    name: string;
    max: number;
    result: ReturnType<typeof clampCat>;
  }[] = [
    {
      name: "Quality of Business",
      max: 18,
      result: clampCat(qualItems, 18, annualMult),
    },
    { name: "Growth", max: 16, result: clampCat(growResult.items, 16) },
    { name: "Valuation", max: 14, result: clampCat(valResult.items, 14) },
    { name: "Balance Sheet", max: 12, result: clampCat(bsResult.items, 12) },
    { name: "Cash Flow", max: 10, result: clampCat(cfResult.items, 10) },
    {
      name: "Quarterly Momentum",
      max: 10,
      result: clampCat(qResult.items, 10, quarterlyMult),
    },
    { name: "Shareholding", max: 8, result: clampCat(shResult.items, 8) },
    { name: "Peer Composite", max: 6, result: clampCat(peerResult.items, 6) },
    {
      name: "Price & Technical",
      max: 4,
      result: clampCat(techResult.items, 4),
    },
    { name: "Size & Liquidity", max: 2, result: clampCat(sizeResult.items, 2) },
  ];

  const categories: CategoryScore[] = CATEGORIES.map(
    ({ name, max, result }) => ({
      name,
      max,
      earned: result.earned,
      items: result.items,
    }),
  );

  // ── If peer composite has insufficient peers, redistribute its weight ────
  if (peerResult.items.length === 0) {
    allAssumptions.push(
      "Peer composite (6pts) redistributed - insufficient peer data",
    );
    // Add missing 6 to quality, growth, valuation, balance sheet proportionally
    const targets = [0, 1, 2, 3]; // indices
    const dist = [2.5, 1.5, 1, 1]; // redistribution
    targets.forEach((ti, i) => {
      categories[ti].earned = parseFloat(
        clamp(categories[ti].earned + dist[i], 0, CATEGORIES[ti].max).toFixed(
          1,
        ),
      );
    });
  }

  const rawTotal = parseFloat(
    clamp(
      categories.reduce((s, c) => s + c.earned, 0),
      0,
      100,
    ).toFixed(1),
  );

  // ── Bonuses & penalties ───────────────────────────────────────────────────
  const bonuses = calcBonuses(m);
  const penalties = calcPenalties(m);
  const bonusPoints = bonuses.reduce((s, b) => s + b.points, 0);
  const penaltyPoints = penalties.reduce((s, p) => s + p.points, 0);

  // ── Ceiling ───────────────────────────────────────────────────────────────
  const gamingGamblingSlug = opts.sectorSlug === "gaming-gambling";
  const isSin = m.industry === "tobacco" || gamingGamblingSlug;
  const ceiling = isSin ? 75 : opts.cyclical ? 90 : 100;

  const finalScore = parseFloat(
    clamp(rawTotal + bonusPoints + penaltyPoints, 0, ceiling).toFixed(1),
  );

  // ── Classification ────────────────────────────────────────────────────────
  const classification =
    finalScore < 40
      ? "Avoid"
      : finalScore < 55
        ? "Watchlist"
        : finalScore < 70
          ? "Accumulate"
          : finalScore < 85
            ? "Invest-grade"
            : "Exceptional";

  // ── Strengths / weaknesses ────────────────────────────────────────────────
  const allItems = CATEGORIES.flatMap(({ name, result }) =>
    result.items.map((i) => ({ ...i, category: name })),
  );

  const strengths: TopItem[] = [...allItems]
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)
    .map((i) => ({ label: i.label, category: i.category, points: i.points }));

  const weaknesses: TopItem[] = CATEGORIES.flatMap(({ name, max, result }) =>
    result.items.map((i) => ({
      label: i.label,
      category: name,
      missed:
        (CATEGORIES.find((c) => c.name === name)?.max ?? 0) > 0
          ? ((i as ScoreItem & { weight?: number }).weight ?? 1)
          : 0,
      points: i.points,
    })),
  )
    .filter((i) => i.missed > 0)
    .sort((a, b) => b.missed - b.points - (a.missed - a.points))
    .slice(0, 3)
    .map((i) => ({
      label: i.label,
      category: i.category,
      points: -(i.missed - i.points),
    }));

  // ── Factor breakdown (for paper / UI detail tab) ──────────────────────────
  const allTypedItems: (ReturnType<typeof makeItem> & { category: string })[] =
    [
      ...qualItems.map((i) => ({ ...i, category: "Quality of Business" })),
      ...growResult.items.map((i) => ({ ...i, category: "Growth" })),
      ...valResult.items.map((i) => ({ ...i, category: "Valuation" })),
      ...bsResult.items.map((i) => ({ ...i, category: "Balance Sheet" })),
      ...cfResult.items.map((i) => ({ ...i, category: "Cash Flow" })),
      ...qResult.items.map((i) => ({ ...i, category: "Quarterly Momentum" })),
      ...shResult.items.map((i) => ({ ...i, category: "Shareholding" })),
      ...peerResult.items.map((i) => ({ ...i, category: "Peer Composite" })),
      ...techResult.items.map((i) => ({ ...i, category: "Price & Technical" })),
      ...sizeResult.items.map((i) => ({ ...i, category: "Size & Liquidity" })),
    ];

  const factorSources: Record<string, FactorRow["source"]> = {
    "Quality of Business": "absolute",
    Growth: "absolute",
    Valuation: "absolute",
    "Balance Sheet": "absolute",
    "Cash Flow": "absolute",
    "Quarterly Momentum": "trend",
    Shareholding: "trend",
    "Peer Composite": "relative",
    "Price & Technical": "trend",
    "Size & Liquidity": "absolute",
  };

  const factor_breakdown: FactorRow[] = allTypedItems.map((i) => ({
    factor: i.label,
    category: i.category,
    raw_value: null,
    score_01: parseFloat(clamp(i.score01, 0, 1).toFixed(3)),
    weight: i.weight,
    points: i.points,
    source: factorSources[i.category] ?? "absolute",
    notes: i.tooltip,
  }));

  // ── Slug ──────────────────────────────────────────────────────────────────
  const slug = raw.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const pbv = m.bookValue > 0 ? m.cmp / m.bookValue : undefined;

  const rawMetrics: CompanyRaw = {
    pe: m.pe || undefined,
    industry_pe: m.peerPeMedian || undefined,
    pbv,
    roe: m.roe || undefined,
    roce: m.roce || undefined,
    opm: (last(m.annualOpm) as number) || undefined,
    debt_to_equity: m.debtEquity || undefined,
    current_ratio: m.currentRatio || undefined,
    dividend_yield: m.dividendYield || undefined,
    pledged_pct: m.pledgedPct || undefined,
    market_cap: m.marketCap || undefined,
    sales_5y_cagr: m.salesCagr5y || undefined,
    profit_5y_cagr: m.profitCagr5y || undefined,
    dma50: m.dma50 || undefined,
    dma200: m.dma200 || undefined,
    high52w: m.high52w || undefined,
    low52w: m.low52w || undefined,
    stock_1y_cagr: m.stockCagr1y || undefined,
    stock_3y_cagr: m.stockCagr3y || undefined,
    intrinsic_value: m.intrinsicValue || undefined,
    peg: m.pegRatio || undefined,
  };

  // Standard fallback assumptions
  if (!m.currentRatio) allAssumptions.push("Current ratio unavailable");
  if (!m.cfoToOp) allAssumptions.push("CFO/OP not available");
  if (!m.peerPeMedian) allAssumptions.push("Industry P/E not available");
  if (!m.pledgedPct && m.pledgedPct !== 0)
    allAssumptions.push("Pledge data unavailable");
  if (!m.intrinsicValue)
    allAssumptions.push(
      "Intrinsic Value not available - IV gap scored neutral",
    );

  return {
    slug,
    name: raw.name,
    ticker: raw.symbol,
    cmp: m.cmp,
    final_score: finalScore,
    raw_total: rawTotal,
    classification,
    score_version: "v2.0",
    regime,
    peer_percentile: peerResult.peerPercentile,
    freshness_multipliers: { quarterly: quarterlyMult, annual: annualMult },
    assumptions: allAssumptions.length ? allAssumptions : undefined,
    categories,
    penalties,
    bonuses,
    strengths,
    weaknesses,
    raw: rawMetrics,
    factor_breakdown,
  };
}
