import { load, type CheerioAPI } from "cheerio/slim";
import type { RawCompanyData } from "./types";

// const BASE_URL = "https://www.screener.in"; // used by parseDocuments (commented out)

function tableToRows($: CheerioAPI, tableEl: any): string[][] {
  const rows: string[][] = [];
  $(tableEl)
    .find("tr")
    .each((_, tr) => {
      const cells: string[] = [];
      $(tr)
        .find("th, td")
        .each((_, cell) => {
          cells.push($(cell).text().replace(/\s+/g, " ").trim());
          return;
        });
      if (cells.some((c) => c)) rows.push(cells);
    });
  return rows;
}

function rowsToCsv(rows: string[][]): string {
  return rows
    .map((row) => row.map((cell) => `"${cell.replace(/"/g, '""')}"`).join(","))
    .join("\n");
}

function firstTableInSection($: CheerioAPI, sectionId: string): string | null {
  const section = $(`#${sectionId}`);
  if (!section.length) return null;
  const table = section.find("table").first();
  if (!table.length) return null;
  const rows = tableToRows($, table);
  return rows.length ? rowsToCsv(rows) : null;
}

function lastNumericCell(cells: string[]): string | null {
  for (let i = cells.length - 1; i >= 1; i--) {
    const v = cells[i]?.trim();
    if (!v || v === "-") continue;
    const cleaned = v.replace(/[,%₹\s]/g, "");
    if (Number.isFinite(parseFloat(cleaned))) return v;
  }
  return null;
}

function extractRowLatestValue(
  $: CheerioAPI,
  sectionId: string,
  rowLabel: string,
): string | null {
  const section = $(`#${sectionId}`);
  if (!section.length) return null;
  let found: string | null = null;
  const needle = rowLabel.toLowerCase();
  section.find("table tr").each((_, tr) => {
    if (found) return;
    const cells: string[] = [];
    $(tr)
      .find("th, td")
      .each((_, c) => {
        cells.push($(c).text().replace(/\s+/g, " ").trim());
      });
    if (!cells.length) return;
    const label = cells[0]?.toLowerCase() ?? "";
    if (label.includes(needle)) {
      found = lastNumericCell(cells);
    }
  });
  return found;
}

export function parseCompanyPage(html: string, symbol: string): RawCompanyData {
  const $ = load(html);

  const info = $("#company-info");
  const companyId = info.attr("data-company-id") ?? "";
  const warehouseId = info.attr("data-warehouse-id") ?? "";
  const consolidated =
    (info.attr("data-consolidated") ?? "true").toLowerCase() !== "false";

  const name = $("h1").first().text().trim() || "Unknown";

  const currentPrice =
    $(".font-size-18.strong").first().text().replace(/\s+/g, " ").trim() ||
    "N/A";

  const ratios: Record<string, string> = {};
  $("#top-ratios li").each((_, li) => {
    const k = $(li).find(".name").text().trim();
    const v = $(li).find(".value").text().replace(/\s+/g, " ").trim();
    if (k) ratios[k] = v;
  });

  const about = $(".company-profile .about").text().replace(/\s+/g, " ").trim();
  const keyPoints = $(".company-profile .commentary")
    .text()
    .replace(/\s+/g, " ")
    .trim();

  const pros: string[] = [];
  const cons: string[] = [];
  $("#analysis .pros li").each((_, li) => {
    pros.push($(li).text().trim());
  });
  $("#analysis .cons li").each((_, li) => {
    cons.push($(li).text().trim());
  });

  const KNOWN_GROWTH = new Set([
    "compounded sales growth",
    "compounded profit growth",
    "stock price cagr",
    "return on equity",
  ]);
  const growthTables: Record<string, Record<string, string>> = {};
  $("table.ranges-table").each((_, table) => {
    const title = $(table).find("th").first().text().trim();
    if (!KNOWN_GROWTH.has(title.toLowerCase())) return;
    const rows: Record<string, string> = {};
    $(table)
      .find("tr")
      .slice(1)
      .each((_, tr) => {
        const cells = $(tr).find("td");
        if (cells.length >= 2) {
          rows[$(cells[0]).text().trim().replace(/:$/, "")] = $(cells[1])
            .text()
            .trim();
        }
      });
    if (Object.keys(rows).length) growthTables[title] = rows;
  });

  let peers: string | null = null;
  const peersContainer = $("#peers-table-placeholder");
  if (peersContainer.length) {
    const table = peersContainer.find("table").first();
    if (table.length) {
      const rows = tableToRows($, table);
      if (rows.length) peers = rowsToCsv(rows);
    }
  }

  // Backfill ratios that aren't always in the #top-ratios strip
  if (!ratios["Current Ratio"]) {
    // Screener.in's strip sometimes labels it "Current ratio" (lowercase r) - alias it
    const aliasKey = Object.keys(ratios).find(
      (k) => k.toLowerCase() === "current ratio" && k !== "Current Ratio",
    );
    if (aliasKey) {
      ratios["Current Ratio"] = ratios[aliasKey];
    } else {
      const cr = extractRowLatestValue($, "ratios", "current ratio");
      if (cr) ratios["Current Ratio"] = cr;
    }
  }
  if (!ratios["Promoter holding"]) {
    const ph = extractRowLatestValue($, "shareholding", "promoters");
    if (ph) ratios["Promoter holding"] = ph;
  }

  return {
    name,
    symbol,
    currentPrice,
    companyId,
    warehouseId,
    consolidated,
    ratios,
    about,
    keyPoints,
    prosCons: { pros, cons },
    growthTables,
    peers,
    quarters: firstTableInSection($, "quarters"),
    profitLoss: firstTableInSection($, "profit-loss"),
    balanceSheet: firstTableInSection($, "balance-sheet"),
    cashFlow: firstTableInSection($, "cash-flow"),
    ratiosTable: firstTableInSection($, "ratios"),
    shareholding: firstTableInSection($, "shareholding"),
    announcementsImportant: [],
    announcementsRecent: [],
    chartData: {},
    documents: { annual_reports: [], concall_ai_summaries: [] },
  };
}

// ---------------------------------------------------------------------------
// Documents - commented out; re-enable when annual reports / concalls are needed
// ---------------------------------------------------------------------------

// function parseDocuments($: CheerioAPI): Documents {
//   const section = $("#documents");
//   if (!section.length) return { annual_reports: [], concall_ai_summaries: [] };
//
//   const annual_reports: { label: string; url: string }[] = [];
//   section.find(".annual-reports li").each((_, li) => {
//     const link = $(li).find("a[href]").first();
//     if (!link.length) return;
//     const label = link.text().replace(/\s+/g, "_").trim();
//     const href = link.attr("href") ?? "";
//     annual_reports.push({ label, url: absUrl(href) });
//   });
//
//   const concall_ai_summaries: { label: string; url: string }[] = [];
//   section.find(".concalls li").each((_, li) => {
//     const btn = $(li).find("button").filter((_, b) => /ai summary/i.test($(b).text())).first();
//     if (!btn.length) return;
//     const dataUrl = btn.attr("data-url") ?? "";
//     if (!dataUrl) return;
//     const dateLabel = $(li).find("div").first().text().replace(/\s+/g, "_").trim();
//     const label = dateLabel ? `${dateLabel}_AI_Summary` : "AI_Summary";
//     concall_ai_summaries.push({ label, url: absUrl(dataUrl) });
//   });
//
//   return { annual_reports, concall_ai_summaries };
// }
