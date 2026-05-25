export interface Announcement {
  title: string;
  date: string;
  summary: string;
  url: string;
}

export interface FinancialTables {
  quarters: string | null;
  profit_loss: string | null;
  balance_sheet: string | null;
  cash_flow: string | null;
  ratios: string | null;
  shareholding: string | null;
  peers: string | null;
}

export interface CompanyDetail {
  name: string;
  symbol: string;
  current_price: string;
  refreshed_at: string;
  ratios: Record<string, string>;
  about: string;
  key_points: string;
  pros_cons: {
    pros: string[];
    cons: string[];
  };
  growth_tables: Record<string, Record<string, string>>;
  financial_tables: FinancialTables;
  announcements: {
    important: Announcement[];
    recent: Announcement[];
  };
  score?: unknown;
}

export interface ChartData {
  company: string;
  annualLabels: string[];
  annualSales: (number | null)[];
  annualNetProfit: (number | null)[];
  annualOpm: (number | null)[];
  annualRoce: (number | null)[];
  quarterlyLabels: string[];
  quarterlySales: (number | null)[];
  quarterlyNetProfit: (number | null)[];
  quarterlyOpm: (number | null)[];
  bsLabels: string[];
  bsEquity: (number | null)[];
  bsBorrowings: (number | null)[];
  cfLabels: string[];
  cfCfo: (number | null)[];
  cfFcf: (number | null)[];
  shLabels: string[];
  shPromoter: (number | null)[];
  shFii: (number | null)[];
  shDii: (number | null)[];
  shGovt: (number | null)[];
  shPublic: (number | null)[];
  annualRoe: (number | null)[];
  annualDe: (number | null)[];
}

export function parseFinancialCSV(
  csv: string | null
): { headers: string[]; rowMap: Record<string, string[]> } {
  if (!csv) return { headers: [], rowMap: {} };

  const lines = csv.trim().split("\n");
  if (lines.length === 0) return { headers: [], rowMap: {} };

  function parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  const headerLine = parseCsvLine(lines[0]);
  const headers = headerLine.slice(1);

  const rowMap: Record<string, string[]> = {};
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length === 0) continue;
    const rawLabel = cols[0];
    const label = rawLabel.replace(/ \+$/, "").trim();
    if (!label) continue;
    rowMap[label] = cols.slice(1);
  }

  return { headers, rowMap };
}

export function toNum(s: string | undefined | null): number | null {
  if (s == null || s === "" || s === "-") return null;
  const cleaned = s
    .replace(/₹/g, "")
    .replace(/Cr\./g, "")
    .replace(/%/g, "")
    .replace(/,/g, "")
    .replace(/\s/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

/**
 * Shorten financial table column headers: "Mar 2025" → "M'25", "Jun 23" → "J'23", "TTM" → "TTM"
 */
export function shortLabel(l: string): string {
  if (!l || l === "TTM") return l;
  const monthMap: Record<string, string> = { Mar: "M", Jun: "J", Sep: "S", Dec: "D" };
  for (const [month, abbr] of Object.entries(monthMap)) {
    if (l.startsWith(month)) {
      const yrMatch = l.match(/(\d{2,4})\s*$/);
      if (yrMatch) return `${abbr}'${yrMatch[1].slice(-2)}`;
    }
  }
  const m = l.match(/\d{4}/);
  return m ? `'${m[0].slice(2)}` : l;
}

/**
 * Average CFO / Net Profit ratio over the last 3 available annual periods.
 * A ratio >= 1 means earnings are fully backed by operating cash.
 */
export function computeCashConversionRatio(
  cfoCrArr: (number | null)[],
  profitArr: (number | null)[]
): number | null {
  const pairs = cfoCrArr
    .map((cfo, i) => ({ cfo, profit: profitArr[i] }))
    .filter(({ cfo, profit }) => cfo !== null && profit !== null && profit! > 0);
  if (pairs.length === 0) return null;
  const recent = pairs.slice(-3);
  const avg = recent.reduce((sum, { cfo, profit }) => sum + cfo! / profit!, 0) / recent.length;
  return parseFloat(avg.toFixed(2));
}

export function extractChartData(detail: CompanyDetail, symbol: string): ChartData {
  const pl = parseFinancialCSV(detail.financial_tables.profit_loss);
  const qt = parseFinancialCSV(detail.financial_tables.quarters);
  const bs = parseFinancialCSV(detail.financial_tables.balance_sheet);
  const cf = parseFinancialCSV(detail.financial_tables.cash_flow);
  const ratTable = parseFinancialCSV(detail.financial_tables.ratios);
  const sh = parseFinancialCSV(detail.financial_tables.shareholding);

  const annualLabels = pl.headers.filter((h) => h !== "TTM");
  const ttmIdx = pl.headers.indexOf("TTM");

  function getRow(
    table: { headers: string[]; rowMap: Record<string, string[]> },
    key: string,
    labels: string[]
  ): (number | null)[] {
    const vals = table.rowMap[key] ?? [];
    return labels.map((lbl) => {
      const i = table.headers.indexOf(lbl);
      if (i < 0) return null;
      const rawIdx = ttmIdx >= 0 && i >= ttmIdx ? i : i;
      void rawIdx;
      return toNum(vals[i] ?? null);
    });
  }

  function getRowByIndex(
    rowVals: string[],
    headers: string[],
    labels: string[]
  ): (number | null)[] {
    return labels.map((lbl) => {
      const i = headers.indexOf(lbl);
      if (i < 0) return null;
      return toNum(rowVals[i] ?? null);
    });
  }

  const annualSales = getRow(pl, "Sales", annualLabels);
  const annualNetProfit = getRow(pl, "Net Profit", annualLabels);
  const annualOpm = getRow(pl, "OPM %", annualLabels).map((v) =>
    v !== null ? v : null
  );

  const roceVals = ratTable.rowMap["ROCE %"] ?? [];
  const annualRoce = annualLabels.map((lbl) => {
    const i = ratTable.headers.indexOf(lbl);
    if (i < 0) return null;
    const raw = roceVals[i] ?? null;
    if (raw === null) return null;
    return toNum(raw.replace(/%/g, ""));
  });

  const allQtHeaders = qt.headers;
  const qtHeaders = allQtHeaders.slice(-12);
  const quarterlySales = qtHeaders.map((lbl) => {
    const i = qt.headers.indexOf(lbl);
    return toNum(qt.rowMap["Sales"]?.[i] ?? null);
  });
  const quarterlyNetProfit = qtHeaders.map((lbl) => {
    const i = qt.headers.indexOf(lbl);
    return toNum(qt.rowMap["Net Profit"]?.[i] ?? null);
  });
  const quarterlyOpm = qtHeaders.map((lbl) => {
    const i = qt.headers.indexOf(lbl);
    const raw = qt.rowMap["OPM %"]?.[i] ?? null;
    if (raw === null) return null;
    return toNum(raw.replace(/%/g, ""));
  });

  const bsLabels = bs.headers.filter((h) => h !== "TTM");
  const equityVals = bs.rowMap["Equity Capital"] ?? [];
  const reserveVals = bs.rowMap["Reserves"] ?? [];
  const borrowVals = bs.rowMap["Borrowings"] ?? [];

  const bsEquity = bsLabels.map((lbl) => {
    const i = bs.headers.indexOf(lbl);
    if (i < 0) return null;
    const eq = toNum(equityVals[i] ?? null) ?? 0;
    const res = toNum(reserveVals[i] ?? null) ?? 0;
    return eq + res || null;
  });
  const bsBorrowings = getRowByIndex(borrowVals, bs.headers, bsLabels);

  const cfLabels = cf.headers.filter((h) => h !== "TTM");
  const cfoVals = cf.rowMap["Cash from Operating Activity"] ?? [];
  const fcfVals = cf.rowMap["Free Cash Flow"] ?? [];
  const cfCfo = getRowByIndex(cfoVals, cf.headers, cfLabels);
  const cfFcf = getRowByIndex(fcfVals, cf.headers, cfLabels);

  const shLabels = sh.headers;
  const promoterVals = sh.rowMap["Promoters"] ?? [];
  const fiiVals = sh.rowMap["FIIs"] ?? [];
  const diiVals = sh.rowMap["DIIs"] ?? [];
  const govtVals = sh.rowMap["Government"] ?? [];
  const publicVals = sh.rowMap["Public"] ?? [];

  const shPromoter = shLabels.map((_, i) =>
    toNum((promoterVals[i] ?? "").replace(/%/g, ""))
  );
  const shFii = shLabels.map((_, i) =>
    toNum((fiiVals[i] ?? "").replace(/%/g, ""))
  );
  const shDii = shLabels.map((_, i) =>
    toNum((diiVals[i] ?? "").replace(/%/g, ""))
  );
  const shGovt = shLabels.map((_, i) =>
    toNum((govtVals[i] ?? "").replace(/%/g, ""))
  );
  const shPublic = shLabels.map((_, i) =>
    toNum((publicVals[i] ?? "").replace(/%/g, ""))
  );

  const roeVals = ratTable.rowMap["Return on equity %"] ?? [];
  const annualRoe = annualLabels.map((lbl) => {
    const i = ratTable.headers.indexOf(lbl);
    if (i < 0) return null;
    const raw = roeVals[i] ?? null;
    if (raw === null) return null;
    return toNum(raw.replace(/%/g, ""));
  });

  const annualDe = annualLabels.map((lbl) => {
    const bsi = bsLabels.indexOf(lbl);
    if (bsi < 0) return null;
    const eq = bsEquity[bsi];
    const borr = bsBorrowings[bsi];
    if (!eq || eq === 0) return null;
    return borr !== null ? parseFloat((borr / eq).toFixed(2)) : null;
  });

  return {
    company: symbol,
    annualLabels,
    annualSales,
    annualNetProfit,
    annualOpm,
    annualRoce,
    quarterlyLabels: qtHeaders,
    quarterlySales,
    quarterlyNetProfit,
    quarterlyOpm,
    bsLabels,
    bsEquity,
    bsBorrowings,
    cfLabels,
    cfCfo,
    cfFcf,
    shLabels,
    shPromoter,
    shFii,
    shDii,
    shGovt,
    shPublic,
    annualRoe,
    annualDe,
  };
}
