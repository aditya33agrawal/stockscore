import type { RawCompanyData } from "./scraper/types";
import type {
  Company,
  CategoryScore,
  ScoreItem,
  Penalty,
  TopItem,
  CompanyRaw,
} from "./types";

// ---------------------------------------------------------------------------
// Parsing utilities
// ---------------------------------------------------------------------------

function parseNum(s: string | undefined | null): number {
  if (!s || ["-", "NA", "N/A", ""].includes(s.trim())) return 0;
  const cleaned = s.replace(/[₹,%\s]/g, "").replace(/Cr\.?/g, "").trim();
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
      if (ch === '"') { inQ = !inQ; }
      else if (ch === "," && !inQ) { cells.push(cur.trim()); cur = ""; }
      else { cur += ch; }
    }
    cells.push(cur.trim());
    return cells;
  });
}

function findRow(rows: string[][], label: string): string[] | null {
  const lo = label.toLowerCase();
  return (
    rows.find((r) => r[0]?.toLowerCase().includes(lo)) ?? null
  );
}

function rowNums(row: string[] | null): number[] {
  if (!row) return [];
  return row.slice(1).map(parseNum);
}

function rowPercents(row: string[] | null): number[] {
  if (!row) return [];
  return row.slice(1).map(parsePercent);
}

function last(arr: number[]): number {
  return arr.length ? arr[arr.length - 1] : 0;
}

function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function cagr(start: number, end: number, years: number): number {
  if (start <= 0 || years <= 0) return 0;
  return (Math.pow(end / start, 1 / years) - 1) * 100;
}

// ---------------------------------------------------------------------------
// Internal scoring helper types
// ---------------------------------------------------------------------------

interface Item {
  label: string;
  points: number;
  max: number;
  detail: string;
  category: string;
}

function rubric(
  value: number,
  thresholds: [number, number][]
): number {
  const sorted = [...thresholds].sort((a, b) => b[0] - a[0]);
  for (const [t, pts] of sorted) {
    if (value >= t) return pts;
  }
  return sorted[sorted.length - 1][1];
}

function item(
  label: string,
  points: number,
  max: number,
  detail: string,
  category: string
): Item {
  return { label, points: Math.max(0, Math.min(max, points)), max, detail, category };
}

// ---------------------------------------------------------------------------
// Metrics extraction
// ---------------------------------------------------------------------------

interface Metrics {
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

  salesCagr5y: number;
  salesCagr3y: number;
  salesCagrTtm: number;
  profitCagr5y: number;
  profitCagr3y: number;
  profitCagrTtm: number;
  stockCagr5y: number;
  stockCagr3y: number;
  stockCagr1y: number;
  roe5y: number;
  roe3y: number;
  roeLastYear: number;

  annualSales: number[];
  annualOpm: number[];
  annualNetProfit: number[];
  otherIncomeCr: number;
  dividendPayout: number;

  annualReserves: number[];
  annualBorrowings: number[];
  annualTotalAssets: number[];
  annualEquityCapital: number[];

  annualCfo: number[];
  annualFcf: number[];

  debtorDays: number;
  inventoryDays: number;
  cashConversionCycle: number;
  workingCapitalDays: number;
  annualRoce: number[];
  cfoToOp: number;

  promoterHolding: number;
  fiiHolding: number;
  diiHolding: number;
  fiiTrend2y: number;
  diiTrend2y: number;
  shareholdingHistory: { promoter: number[]; fii: number[]; dii: number[] };

  qtrlySales: number[];
  qtrlyOpm: number[];
  qtrlyNetProfit: number[];

  peerPeMedian: number;
  peerRoceMedian: number;
  peerOpmMedian: number;

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

  const sg = gt["Compounded Sales Growth"] ?? gt["compounded sales growth"] ?? {};
  const pg = gt["Compounded Profit Growth"] ?? gt["compounded profit growth"] ?? {};
  const sc = gt["Stock Price CAGR"] ?? gt["stock price cagr"] ?? {};
  const re = gt["Return on Equity"] ?? gt["return on equity"] ?? {};

  const ratiosRows = parseCsv(raw.ratiosTable);
  const cfoOpRow = findRow(ratiosRows, "cfo");
  const cfoToOp = cfoOpRow
    ? parsePercent(cfoOpRow[cfoOpRow.length - 1])
    : 0;

  const plRows = parseCsv(raw.profitLoss);
  const annualSales = rowNums(findRow(plRows, "sales"));
  const annualOpm = rowPercents(findRow(plRows, "opm %"));
  const annualNetProfit = rowNums(findRow(plRows, "net profit"));
  const otherIncomeRow = findRow(plRows, "other income");
  const otherIncomeCr = otherIncomeRow ? last(rowNums(otherIncomeRow)) : 0;
  const dividendPayoutRow = findRow(plRows, "dividend payout");
  const dividendPayout = dividendPayoutRow
    ? last(rowPercents(dividendPayoutRow))
    : 0;

  const bsRows = parseCsv(raw.balanceSheet);
  const annualReserves = rowNums(findRow(bsRows, "reserves"));
  const annualBorrowings = rowNums(findRow(bsRows, "borrowings"));
  const annualTotalAssets = rowNums(findRow(bsRows, "total assets"));
  const annualEquityCapital = rowNums(findRow(bsRows, "share capital"));

  let debtEquity = parseNum(r["Debt / Equity"] ?? r["Debt to equity"] ?? "");
  if (!debtEquity && annualBorrowings.length && annualReserves.length && annualEquityCapital.length) {
    const equity = last(annualReserves) + last(annualEquityCapital);
    if (equity > 0) debtEquity = last(annualBorrowings) / equity;
  }

  const cfRows = parseCsv(raw.cashFlow);
  const annualCfo = rowNums(findRow(cfRows, "cash from operating"));
  const annualCapex = rowNums(findRow(cfRows, "cash from investing"));
  const annualFcf = annualCfo.map((c, i) => c + (annualCapex[i] ?? 0));

  const debtorDays = parseNum(last(rowNums(findRow(ratiosRows, "debtor days"))).toString());
  const inventoryDays = parseNum(last(rowNums(findRow(ratiosRows, "inventory days") ?? findRow(ratiosRows, "inventory turnover"))).toString());
  const ccc = parseNum(last(rowNums(findRow(ratiosRows, "cash conversion cycle"))).toString());
  const wcd = parseNum(last(rowNums(findRow(ratiosRows, "working capital days"))).toString());
  const annualRoceRow = findRow(ratiosRows, "roce");
  const annualRoce = rowPercents(annualRoceRow);

  const shRows = parseCsv(raw.shareholding);
  const promoterRow = findRow(shRows, "promoters");
  const fiiRow = findRow(shRows, "fii");
  const diiRow = findRow(shRows, "dii");
  const promoterNums = rowPercents(promoterRow);
  const fiiNums = rowPercents(fiiRow);
  const diiNums = rowPercents(diiRow);
  const promoterHolding = last(promoterNums);
  const fiiHolding = last(fiiNums);
  const diiHolding = last(diiNums);
  const fiiTrend2y = fiiNums.length >= 8 ? fiiHolding - fiiNums[fiiNums.length - 9] : 0;
  const diiTrend2y = diiNums.length >= 8 ? diiHolding - diiNums[diiNums.length - 9] : 0;

  const pledgedPct = parsePercent(r["Pledged percentage"] ?? r["Pledge"] ?? "0");
  const currentRatio = parseNum(r["Current Ratio"] ?? "0");

  const qRows = parseCsv(raw.quarters);
  const qtrlySales = rowNums(findRow(qRows, "sales"));
  const qtrlyOpm = rowPercents(findRow(qRows, "opm %"));
  const qtrlyNetProfit = rowNums(findRow(qRows, "net profit"));

  const peersRows = parseCsv(raw.peers);
  const medianRow = peersRows.find((r) => r[0]?.toLowerCase().includes("median"));
  let peerPeMedian = 0;
  let peerRoceMedian = 0;
  let peerOpmMedian = 0;
  if (medianRow && medianRow.length > 10) {
    peerPeMedian = parseNum(medianRow[3]);
    peerRoceMedian = parseNum(medianRow[10]);
    peerOpmMedian = parseNum(medianRow[11] ?? "0");
  }

  const fullText = (raw.about + raw.prosCons.pros.join(" ") + raw.prosCons.cons.join(" ")).toLowerCase();
  let industry = "general";
  if (/(tobacco|cigarette)/.test(fullText)) industry = "tobacco";
  else if (/(bank|nbfc|insurance|lending)/.test(fullText)) industry = "financial";
  else if (/(pharma|pharmaceutical)/.test(fullText)) industry = "pharma";
  else if (/(software|it services|technology)/.test(fullText)) industry = "technology";
  else if (/(oil|petroleum|refin|exploration)/.test(fullText)) industry = "energy";

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
    pledgedPct,
    cmp,
    dma50: parseNum(r["DMA 50"]),
    dma200: parseNum(r["DMA 200"]),
    salesCagr5y: parsePercent(sg["5 Years"] ?? sg["5 Yrs"]),
    salesCagr3y: parsePercent(sg["3 Years"] ?? sg["3 Yrs"]),
    salesCagrTtm: parsePercent(sg["TTM"]),
    profitCagr5y: parsePercent(pg["5 Years"] ?? pg["5 Yrs"]),
    profitCagr3y: parsePercent(pg["3 Years"] ?? pg["3 Yrs"]),
    profitCagrTtm: parsePercent(pg["TTM"]),
    stockCagr5y: parsePercent(sc["5 Years"] ?? sc["5 Yrs"]),
    stockCagr3y: parsePercent(sc["3 Years"] ?? sc["3 Yrs"]),
    stockCagr1y: parsePercent(sc["1 Year"] ?? sc["1 Yr"]),
    roe5y: parsePercent(re["5 Years"] ?? re["5 Yrs"]),
    roe3y: parsePercent(re["3 Years"] ?? re["3 Yrs"]),
    roeLastYear: parsePercent(re["Last Year"]),
    annualSales,
    annualOpm,
    annualNetProfit,
    otherIncomeCr,
    dividendPayout,
    annualReserves,
    annualBorrowings,
    annualTotalAssets,
    annualEquityCapital,
    annualCfo,
    annualFcf,
    debtorDays: last(rowNums(findRow(ratiosRows, "debtor days"))),
    inventoryDays,
    cashConversionCycle: ccc,
    workingCapitalDays: wcd,
    annualRoce,
    cfoToOp,
    promoterHolding,
    fiiHolding,
    diiHolding,
    fiiTrend2y,
    diiTrend2y,
    shareholdingHistory: {
      promoter: promoterNums,
      fii: fiiNums,
      dii: diiNums,
    },
    qtrlySales,
    qtrlyOpm,
    qtrlyNetProfit,
    peerPeMedian,
    peerRoceMedian,
    peerOpmMedian,
    pros: raw.prosCons.pros,
    cons: raw.prosCons.cons,
    industry,
  };
}

// ---------------------------------------------------------------------------
// Category scorers
// ---------------------------------------------------------------------------

function scoreValuation(m: Metrics): Item[] {
  const pbv = m.bookValue > 0 ? m.cmp / m.bookValue : 0;

  const peVsSector = (() => {
    if (!m.peerPeMedian || !m.pe) return item("P/E vs Sector", 0, 3, `P/E ${m.pe.toFixed(1)} — no peer median`, "Valuation");
    const ratio = m.pe / m.peerPeMedian;
    const pts = rubric(1 / ratio, [[1.25, 3], [1.0, 2], [0.67, 1], [0, 0]]);
    return item("P/E vs Sector", pts, 3,
      `P/E ${m.pe.toFixed(1)} vs sector ${m.peerPeMedian.toFixed(1)} (${ratio.toFixed(2)}x)`, "Valuation");
  })();

  const peAbsolute = (() => {
    if (!m.pe) return item("P/E Absolute", 0, 2, "P/E not available", "Valuation");
    const actual = m.pe < 15 ? 2 : m.pe < 25 ? 1 : 0;
    return item("P/E Absolute", actual, 2, `P/E ${m.pe.toFixed(1)}`, "Valuation");
  })();

  const pbRatio = (() => {
    const pts = pbv < 1.5 ? 2 : pbv < 3 ? 1 : 0;
    return item("Price to Book", pts, 2, `P/B ${pbv.toFixed(2)}x`, "Valuation");
  })();

  const divYield = (() => {
    const pts = m.dividendYield > 3 ? 2 : m.dividendYield > 1 ? 1 : 0;
    return item("Dividend Yield", pts, 2, `Yield ${m.dividendYield.toFixed(2)}%`, "Valuation");
  })();

  const proximity52w = (() => {
    if (!m.high52w) return item("52-Week Position", 0, 1, "High/low not available", "Valuation");
    const drawdown = (m.high52w - m.cmp) / m.high52w;
    const pts = drawdown > 0.25 ? 1 : 0;
    return item("52-Week Position", pts, 1,
      `₹${m.cmp.toFixed(0)} vs 52w high ₹${m.high52w.toFixed(0)} (${(drawdown * 100).toFixed(1)}% below)`, "Valuation");
  })();

  return [peVsSector, peAbsolute, pbRatio, divYield, proximity52w];
}

function scoreProfitability(m: Metrics): Item[] {
  const latestOpm = last(m.annualOpm) || 0;
  const prevOpmAvg = m.annualOpm.length >= 4 ? avg(m.annualOpm.slice(-4, -1)) : latestOpm;
  const opmTrend = latestOpm - prevOpmAvg;
  const roe5yAvg = m.roe5y || avg(m.annualRoce.slice(-5));

  return [
    item("ROCE", rubric(m.roce, [[25, 5], [20, 4], [15, 3], [10, 1], [0, 0]]), 5,
      `ROCE ${m.roce.toFixed(1)}%`, "Profitability"),
    item("ROE", rubric(m.roe, [[20, 5], [15, 4], [10, 2], [0, 0]]), 5,
      `ROE ${m.roe.toFixed(1)}%`, "Profitability"),
    item("Operating Margin", rubric(latestOpm, [[25, 5], [15, 4], [10, 2], [5, 1], [0, 0]]), 5,
      `OPM ${latestOpm.toFixed(1)}%`, "Profitability"),
    item("OPM Trend", opmTrend > 1 ? 2 : opmTrend > -1 ? 1 : 0, 2,
      `OPM ${opmTrend >= 0 ? "+" : ""}${opmTrend.toFixed(1)}% vs 3yr avg`, "Profitability"),
    item("ROE Track Record", rubric(roe5yAvg, [[18, 3], [14, 2], [10, 1], [0, 0]]), 3,
      `5yr avg ROE ${roe5yAvg.toFixed(1)}%`, "Profitability"),
  ];
}

function scoreGrowth(m: Metrics): Item[] {
  const earningsAccel = (() => {
    if (!m.profitCagr5y) return 0;
    const diff = m.profitCagrTtm - m.profitCagr5y;
    return diff > 5 ? 2 : diff > -5 ? 1 : 0;
  })();

  return [
    item("Revenue CAGR 5yr", rubric(m.salesCagr5y, [[15, 4], [10, 3], [7, 2], [4, 1], [0, 0]]), 4,
      `${m.salesCagr5y.toFixed(1)}% CAGR`, "Growth"),
    item("Profit CAGR 5yr", rubric(m.profitCagr5y, [[15, 4], [10, 3], [6, 2], [2, 1], [0, 0]]), 4,
      `${m.profitCagr5y.toFixed(1)}% CAGR`, "Growth"),
    item("Revenue CAGR 3yr", rubric(m.salesCagr3y, [[12, 3], [8, 2], [5, 1], [0, 0]]), 3,
      `${m.salesCagr3y.toFixed(1)}% CAGR`, "Growth"),
    item("Profit CAGR 3yr", rubric(m.profitCagr3y, [[12, 2], [8, 1], [0, 0]]), 2,
      `${m.profitCagr3y.toFixed(1)}% CAGR`, "Growth"),
    item("Earnings Acceleration", earningsAccel, 2,
      `TTM ${m.profitCagrTtm.toFixed(1)}% vs 5yr ${m.profitCagr5y.toFixed(1)}%`, "Growth"),
  ];
}

function scoreQuarterlyMomentum(m: Metrics): Item[] {
  const revYoy = (() => {
    if (m.qtrlySales.length < 5) return 0;
    const latest = m.qtrlySales[m.qtrlySales.length - 1];
    const yago = m.qtrlySales[m.qtrlySales.length - 5];
    if (!yago) return 0;
    return ((latest - yago) / yago) * 100;
  })();

  const revQoq = (() => {
    if (m.qtrlySales.length < 2) return 0;
    const latest = m.qtrlySales[m.qtrlySales.length - 1];
    const prev = m.qtrlySales[m.qtrlySales.length - 2];
    if (!prev) return 0;
    return ((latest - prev) / prev) * 100;
  })();

  const profYoy = (() => {
    if (m.qtrlyNetProfit.length < 5) return 0;
    const latest = m.qtrlyNetProfit[m.qtrlyNetProfit.length - 1];
    const yago = m.qtrlyNetProfit[m.qtrlyNetProfit.length - 5];
    if (!yago) return 0;
    return ((latest - yago) / yago) * 100;
  })();

  const opmDir = (() => {
    if (m.qtrlyOpm.length < 5) return 0;
    const latest = m.qtrlyOpm[m.qtrlyOpm.length - 1];
    const yago = m.qtrlyOpm[m.qtrlyOpm.length - 5];
    return latest - yago;
  })();

  return [
    item("Revenue YoY", rubric(revYoy, [[15, 3], [10, 2], [5, 1], [0, 0]]), 3,
      `${revYoy.toFixed(1)}% YoY`, "Quarterly Momentum"),
    item("Revenue QoQ", revQoq > 0 ? 2 : revQoq > -5 ? 1 : 0, 2,
      `${revQoq.toFixed(1)}% QoQ`, "Quarterly Momentum"),
    item("Net Profit YoY", rubric(profYoy, [[15, 3], [10, 2], [5, 1], [0, 0]]), 3,
      `${profYoy.toFixed(1)}% YoY`, "Quarterly Momentum"),
    item("OPM Direction", opmDir > 0.5 ? 2 : opmDir > -0.5 ? 1 : 0, 2,
      `OPM ${opmDir >= 0 ? "+" : ""}${opmDir.toFixed(1)}pp YoY`, "Quarterly Momentum"),
  ];
}

function scoreBalanceSheet(m: Metrics): Item[] {
  const reserves5yCagr = m.annualReserves.length >= 6
    ? cagr(m.annualReserves[m.annualReserves.length - 6], last(m.annualReserves), 5)
    : 0;

  const assetTurnover = last(m.annualTotalAssets) > 0
    ? last(m.annualSales) / last(m.annualTotalAssets)
    : 0;

  const bvCagr = m.annualReserves.length >= 6 && m.annualEquityCapital.length >= 6
    ? (() => {
        const oldBv = m.annualReserves[m.annualReserves.length - 6] + m.annualEquityCapital[m.annualEquityCapital.length - 6];
        const newBv = last(m.annualReserves) + last(m.annualEquityCapital);
        return cagr(oldBv, newBv, 5);
      })()
    : 0;

  return [
    item("Debt-to-Equity", rubric(-m.debtEquity, [[-0, 5], [-0.3, 4], [-0.7, 3], [-1.0, 1], [-999, 0]]), 5,
      `D/E ${m.debtEquity.toFixed(2)}x`, "Balance Sheet"),
    item("Current Ratio", m.currentRatio > 2 ? 2 : m.currentRatio > 1.5 ? 1 : 0, 2,
      m.currentRatio ? `Current ratio ${m.currentRatio.toFixed(2)}` : "Current ratio not available", "Balance Sheet"),
    item("Reserves CAGR 5yr", rubric(reserves5yCagr, [[12, 3], [7, 2], [3, 1], [0, 0]]), 3,
      `${reserves5yCagr.toFixed(1)}% CAGR`, "Balance Sheet"),
    item("Asset Turnover", rubric(assetTurnover, [[1.5, 2], [1.0, 1], [0, 0]]), 2,
      `${assetTurnover.toFixed(2)}x`, "Balance Sheet"),
    item("Book Value CAGR 5yr", rubric(bvCagr, [[12, 3], [7, 2], [3, 1], [0, 0]]), 3,
      `${bvCagr.toFixed(1)}% CAGR`, "Balance Sheet"),
  ];
}

function scoreCashFlow(m: Metrics): Item[] {
  const fcfPositive = m.annualFcf.slice(-5).filter((v) => v > 0).length;
  const fcfYield = m.marketCap > 0 && last(m.annualFcf)
    ? (last(m.annualFcf) / m.marketCap) * 100
    : 0;

  const cfoGrowth = m.annualCfo.length >= 4
    ? last(m.annualCfo) - avg(m.annualCfo.slice(-4, -1))
    : 0;

  return [
    item("CFO / Operating Profit", rubric(m.cfoToOp, [[90, 3], [75, 2], [60, 1], [0, 0]]), 3,
      m.cfoToOp ? `CFO/OP ${m.cfoToOp.toFixed(1)}%` : "CFO/OP not in ratios table", "Cash Flow"),
    item("FCF Positive Years", rubric(fcfPositive, [[5, 3], [4, 2], [3, 1], [0, 0]]), 3,
      `${fcfPositive}/5 years FCF positive`, "Cash Flow"),
    item("FCF Yield", rubric(fcfYield, [[5, 2], [3, 1], [0, 0]]), 2,
      m.marketCap ? `FCF yield ${fcfYield.toFixed(2)}%` : "Market cap unavailable", "Cash Flow"),
    item("CFO Growth", cfoGrowth > 0 ? 2 : cfoGrowth > -m.marketCap * 0.01 ? 1 : 0, 2,
      `CFO trend ${cfoGrowth >= 0 ? "+" : ""}${cfoGrowth.toFixed(0)} Cr`, "Cash Flow"),
  ];
}

function scoreShareholding(m: Metrics): Item[] {
  return [
    item("Promoter Holding", rubric(m.promoterHolding, [[55, 3], [45, 2], [30, 1], [0, 0]]), 3,
      `${m.promoterHolding.toFixed(1)}%`, "Shareholding"),
    item("Pledged Shares", m.pledgedPct < 2 ? 2 : m.pledgedPct < 10 ? 1 : 0, 2,
      m.pledgedPct ? `${m.pledgedPct.toFixed(1)}% pledged` : "Pledge data unavailable", "Shareholding"),
    item("FII Trend 2yr", m.fiiTrend2y > 1 ? 2 : m.fiiTrend2y > -1 ? 1 : 0, 2,
      m.shareholdingHistory.fii.length >= 8
        ? `FII ${m.fiiTrend2y >= 0 ? "+" : ""}${m.fiiTrend2y.toFixed(1)}pp over 2yr`
        : "Insufficient FII history", "Shareholding"),
    item("DII Trend 2yr", m.diiTrend2y > 0.5 ? 1 : 0, 1,
      m.shareholdingHistory.dii.length >= 8
        ? `DII ${m.diiTrend2y >= 0 ? "+" : ""}${m.diiTrend2y.toFixed(1)}pp over 2yr`
        : "Insufficient DII history", "Shareholding"),
  ];
}

function scoreDividend(m: Metrics): Item[] {
  const payoutOk = m.dividendPayout >= 15 && m.dividendPayout <= 70 ? 2 : m.dividendPayout > 0 ? 1 : 0;
  return [
    item("Dividend Yield", m.dividendYield > 3 ? 2 : m.dividendYield > 1 ? 1 : 0, 2,
      `${m.dividendYield.toFixed(2)}% yield`, "Dividend"),
    item("Payout Ratio", payoutOk, 2,
      m.dividendPayout ? `${m.dividendPayout.toFixed(1)}% payout ratio` : "No dividend", "Dividend"),
  ];
}

function scoreOperationalEfficiency(m: Metrics): Item[] {
  return [
    item("Cash Conversion Cycle", m.cashConversionCycle < 30 ? 2 : m.cashConversionCycle < 60 ? 1 : 0, 2,
      m.cashConversionCycle ? `CCC ${m.cashConversionCycle.toFixed(0)} days` : "CCC not available", "Operational Efficiency"),
    item("Working Capital Days", m.workingCapitalDays < 60 ? 2 : m.workingCapitalDays < 90 ? 1 : 0, 2,
      m.workingCapitalDays ? `WC ${m.workingCapitalDays.toFixed(0)} days` : "WC days not available", "Operational Efficiency"),
    item("Debtor Days", m.debtorDays < 30 ? 1 : 0, 1,
      m.debtorDays ? `${m.debtorDays.toFixed(0)} debtor days` : "Debtor days not available", "Operational Efficiency"),
  ];
}

function scorePriceTechnical(m: Metrics): Item[] {
  const positionInRange = m.high52w > m.low52w
    ? (m.cmp - m.low52w) / (m.high52w - m.low52w)
    : 0;

  return [
    item("52-Week Position", positionInRange > 0.4 ? 1 : 0, 1,
      m.high52w
        ? `At ${(positionInRange * 100).toFixed(0)}% of 52-week range`
        : "Price range not available", "Price & Technical"),
    item("Stock 3yr CAGR", m.stockCagr3y > 12 ? 1 : 0, 1,
      `${m.stockCagr3y.toFixed(1)}% 3yr CAGR`, "Price & Technical"),
    item("Price Momentum 1yr", m.stockCagr1y > 10 ? 1 : 0, 1,
      `${m.stockCagr1y.toFixed(1)}% 1yr return`, "Price & Technical"),
  ];
}

// ---------------------------------------------------------------------------
// Bonuses & penalties
// ---------------------------------------------------------------------------

function calcBonuses(m: Metrics): { label: string; points: number; detail: string }[] {
  const bonuses: { label: string; points: number; detail: string }[] = [];
  if (m.debtEquity < 0.1) bonuses.push({ label: "Net Cash Company", points: 3, detail: "D/E < 0.1 — effectively debt-free" });
  if (m.pros.some((p) => /dividend/i.test(p)))
    bonuses.push({ label: "Dividend Track Record", points: 2, detail: "Consistent dividend payer mentioned in pros" });
  if (m.roce > 30 && m.annualRoce.slice(-5).every((r) => r > 25))
    bonuses.push({ label: "High ROCE Track Record", points: 4, detail: "ROCE > 30% sustained over 5 years" });
  return bonuses;
}

function calcPenalties(m: Metrics): Penalty[] {
  const penalties: Penalty[] = [];
  if (m.industry === "tobacco")
    penalties.push({ label: "Sin Business — Tobacco", points: -6, detail: "Industry ceiling applied; ESG exclusion risk" });
  if (m.annualNetProfit.length && last(m.annualNetProfit) > 0) {
    const oiPct = (m.otherIncomeCr / last(m.annualNetProfit)) * 100;
    if (oiPct > 30)
      penalties.push({ label: "Other Income > 30% of PBT", points: -5, detail: `Other income ${oiPct.toFixed(1)}% of net profit` });
  }
  if (m.fiiTrend2y < -8)
    penalties.push({ label: "FII Steadily Exiting", points: -4, detail: `FII reduced by ${Math.abs(m.fiiTrend2y).toFixed(1)}pp in 2yr` });
  if (m.pledgedPct > 25)
    penalties.push({ label: "High Promoter Pledge", points: -5, detail: `${m.pledgedPct.toFixed(1)}% shares pledged` });
  return penalties;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

export function scoreCompany(raw: RawCompanyData): Omit<Company, "rank"> {
  const m = extractMetrics(raw);

  const CATEGORIES: { name: string; max: number; items: Item[] }[] = [
    { name: "Valuation", max: 10, items: scoreValuation(m) },
    { name: "Profitability", max: 20, items: scoreProfitability(m) },
    { name: "Growth", max: 15, items: scoreGrowth(m) },
    { name: "Quarterly Momentum", max: 10, items: scoreQuarterlyMomentum(m) },
    { name: "Balance Sheet", max: 15, items: scoreBalanceSheet(m) },
    { name: "Cash Flow", max: 10, items: scoreCashFlow(m) },
    { name: "Shareholding", max: 8, items: scoreShareholding(m) },
    { name: "Dividend", max: 4, items: scoreDividend(m) },
    { name: "Operational Efficiency", max: 5, items: scoreOperationalEfficiency(m) },
    { name: "Price & Technical", max: 3, items: scorePriceTechnical(m) },
  ];

  const categories: CategoryScore[] = CATEGORIES.map(({ name, max, items }) => {
    const earned = Math.max(0, Math.min(max, items.reduce((s, i) => s + i.points, 0)));
    return {
      name,
      max,
      earned,
      items: items.map((i) => ({ label: i.label, points: i.points, detail: i.detail })),
    };
  });

  const rawTotal = categories.reduce((s, c) => s + c.earned, 0);

  const bonusItems = calcBonuses(m);
  const bonusPoints = bonusItems.reduce((s, b) => s + b.points, 0);
  const penalties = calcPenalties(m);
  const penaltyPoints = penalties.reduce((s, p) => s + p.points, 0);

  const ceiling = m.industry === "tobacco" ? 75 : m.industry === "financial" ? 80 : 100;
  const finalScore = Math.min(ceiling, Math.max(0, rawTotal + bonusPoints + penaltyPoints));

  const classification =
    finalScore < 40 ? "Avoid"
    : finalScore < 52 ? "Watchlist"
    : finalScore < 65 ? "Accumulate"
    : finalScore < 75 ? "Invest-grade"
    : "Exceptional";

  const allItems: (Item & { category: string })[] = CATEGORIES.flatMap(
    ({ items }) => items.map((i) => ({ ...i }))
  );

  const strengths: TopItem[] = [...allItems]
    .sort((a, b) => b.points - a.points)
    .slice(0, 3)
    .map((i) => ({ label: i.label, category: i.category, points: i.points }));

  const weaknesses: TopItem[] = [...allItems]
    .filter((i) => i.max > 0)
    .sort((a, b) => (b.max - b.points) - (a.max - a.points))
    .slice(0, 3)
    .map((i) => ({ label: i.label, category: i.category, points: -(i.max - i.points) }));

  const slug = raw.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const pbv = m.bookValue > 0 ? m.cmp / m.bookValue : undefined;

  const rawMetrics: CompanyRaw = {
    pe: m.pe || undefined,
    industry_pe: m.peerPeMedian || undefined,
    pbv: pbv,
    roe: m.roe || undefined,
    roce: m.roce || undefined,
    opm: last(m.annualOpm) || undefined,
    debt_to_equity: m.debtEquity || undefined,
    current_ratio: m.currentRatio || undefined,
    dividend_yield: m.dividendYield || undefined,
    pledged_pct: m.pledgedPct || undefined,
    market_cap: m.marketCap || undefined,
    sales_5y_cagr: m.salesCagr5y || undefined,
    profit_5y_cagr: m.profitCagr5y || undefined,
    high52w: m.high52w || undefined,
    low52w: m.low52w || undefined,
    stock_1y_cagr: m.stockCagr1y || undefined,
    stock_3y_cagr: m.stockCagr3y || undefined,
  };

  const assumptions: string[] = [];
  if (!m.currentRatio) assumptions.push("Current ratio unavailable");
  if (!m.cfoToOp) assumptions.push("CFO/OP estimated — not in ratios table");
  if (!m.peerPeMedian) assumptions.push("Peer P/E median not available");
  if (!m.pledgedPct && m.pledgedPct !== 0) assumptions.push("Pledge data unavailable");

  return {
    slug,
    name: raw.name,
    ticker: raw.symbol,
    cmp: m.cmp,
    final_score: Math.round(finalScore * 10) / 10,
    raw_total: rawTotal,
    classification,
    assumptions: assumptions.length ? assumptions : undefined,
    categories,
    penalties,
    strengths,
    weaknesses,
    raw: rawMetrics,
  };
}
