import { load } from "cheerio/slim";
import type { SectorRow } from "./types";

function parseNum(s: string): number | null {
  if (!s || s === "—" || s === "-") return null;
  const cleaned = s.replace(/[%,₹\s]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function extractSlug(href: string): string {
  // href looks like: https://www.screener.in/market/IN02/IN0201/IN020101/IN020101002/
  // return the full path portion for use as a unique key
  try {
    const u = new URL(href);
    return u.pathname.replace(/^\/|\/$/g, "");
  } catch {
    return href;
  }
}

export function parseMarketPage(html: string): SectorRow[] {
  const $ = load(html);
  const rows: SectorRow[] = [];

  $("table.data-table tbody tr, table.striped.data-table tbody tr").each((_, tr) => {
    const cells = $(tr).find("td");
    if (cells.length < 2) return; // skip header rows rendered as tr

    const snoText = $(cells[0]).text().trim().replace(/\.$/, "");
    const sno = parseInt(snoText, 10);
    if (isNaN(sno)) return;

    const nameCell = $(cells[1]);
    const link = nameCell.find("a[href]").first();
    const name = link.text().replace(/\s+/g, " ").trim();
    const href = link.attr("href") ?? "";
    if (!name) return;

    const raw = {
      totalMarketCap: $(cells[3]).text().replace(/\s+/g, " ").trim(),
      medianMarketCap: $(cells[4]).text().replace(/\s+/g, " ").trim(),
      medianPE: $(cells[5]).text().replace(/\s+/g, " ").trim(),
      wtdAvgSalesGrowth: $(cells[6]).text().replace(/\s+/g, " ").trim(),
      wtdAvgOPM: $(cells[7]).text().replace(/\s+/g, " ").trim(),
      wtdAvgROCE: $(cells[8]).text().replace(/\s+/g, " ").trim(),
      median1YReturn: $(cells[9]).text().replace(/\s+/g, " ").trim(),
    };

    rows.push({
      sno,
      name,
      slug: extractSlug(href),
      url: href,
      companyCount: parseNum($(cells[2]).text()),
      totalMarketCap: parseNum(raw.totalMarketCap),
      medianMarketCap: parseNum(raw.medianMarketCap),
      medianPE: parseNum(raw.medianPE),
      wtdAvgSalesGrowth: parseNum(raw.wtdAvgSalesGrowth),
      wtdAvgOPM: parseNum(raw.wtdAvgOPM),
      wtdAvgROCE: parseNum(raw.wtdAvgROCE),
      median1YReturn: parseNum(raw.median1YReturn),
      raw,
    });
  });

  return rows;
}
