import { load } from "cheerio/slim";
import type { Announcement, Session } from "./types";

const BASE_URL = "https://www.screener.in";

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function headers(session: Session, referer?: string): HeadersInit {
  return {
    "User-Agent": UA,
    Cookie: session.cookies,
    "X-Requested-With": "XMLHttpRequest",
    ...(referer ? { Referer: referer } : {}),
  };
}

function inferYear(dateStr: string): string {
  const text = dateStr.trim();
  if (!text) return text;
  const m = text.match(/^(\d{1,2})\s+([A-Za-z]{3})$/);
  if (!m) return text;
  const monthMap: Record<string, number> = {
    Jan: 1,
    Feb: 2,
    Mar: 3,
    Apr: 4,
    May: 5,
    Jun: 6,
    Jul: 7,
    Aug: 8,
    Sep: 9,
    Oct: 10,
    Nov: 11,
    Dec: 12,
  };
  const month = monthMap[m[2]] ?? 1;
  const now = new Date();
  const year =
    month <= now.getMonth() + 1 ? now.getFullYear() : now.getFullYear() - 1;
  return `${m[1]} ${m[2]} ${year}`;
}

export async function fetchAnnouncements(
  session: Session,
  companyId: string,
  tab: "important" | "recent",
): Promise<Announcement[]> {
  try {
    const url = `${BASE_URL}/announcements/${tab}/${companyId}/`;
    const res = await fetch(url, { headers: headers(session) });
    if (!res.ok) return [];
    const html = await res.text();
    const $ = load(html);
    const items: Announcement[] = [];
    $("li").each((_, li) => {
      const link = $(li).find("a[href]").first();
      if (!link.length) return;
      const title = link.text().replace(/\s+/g, " ").trim();
      const desc = $(li).find(".ink-600.smaller").text().trim();
      const [datePart, ...rest] = desc.split(" - ");
      items.push({
        title,
        date: inferYear(datePart.trim()),
        summary: rest.join(" - ").trim() || desc,
        url: link.attr("href") ?? "",
      });
    });
    return items;
  } catch {
    return [];
  }
}

export async function fetchQuickRatios(
  session: Session,
  warehouseId: string,
  companyUrl: string,
  consolidated: boolean,
): Promise<Record<string, string>> {
  try {
    const url = `${BASE_URL}/api/company/${warehouseId}/quick_ratios/?consolidated=${consolidated}`;
    const res = await fetch(url, { headers: headers(session, companyUrl) });
    if (!res.ok) return {};
    const html = await res.text();
    const $ = load(html);
    const result: Record<string, string> = {};
    $("li").each((_, li) => {
      const k = $(li).find(".name").text().trim();
      const v = $(li).find(".value").text().replace(/\s+/g, " ").trim();
      if (k) result[k] = v;
    });
    return result;
  } catch {
    return {};
  }
}

export async function fetchPeersCsv(
  session: Session,
  warehouseId: string,
  companyUrl: string,
  consolidated: boolean,
): Promise<string | null> {
  try {
    const url = `${BASE_URL}/api/company/${warehouseId}/peers/?consolidated=${consolidated}`;
    const res = await fetch(url, { headers: headers(session, companyUrl) });
    if (!res.ok) return null;
    const html = await res.text();
    const $ = load(html);
    const table = $("table").first();
    if (!table.length) return null;
    const rows: string[][] = [];
    table.find("tr").each((_, tr) => {
      const cells: string[] = [];
      $(tr)
        .find("th, td")
        .each((_, td) => {
          cells.push($(td).text().replace(/\s+/g, " ").trim());
        });
      if (cells.some((c) => c)) rows.push(cells);
    });
    return rows
      .map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(","))
      .join("\n");
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Chart data - commented out; re-enable when chart visualisations are needed
// ---------------------------------------------------------------------------

// const CHART_METRICS: Record<string, string> = {
//   "Price":          "Price-DMA50-DMA200-Volume",
//   "PE Ratio":       "Price to Earning-Median PE-EPS",
//   "Sales & Margin": "GPM-OPM-NPM-Quarter Sales",
//   "EV/EBITDA":      "EV Multiple-Median EV Multiple-EBITDA",
//   "Price to Book":  "Price to book value-Median PBV-Book value",
//   "MCap/Sales":     "Market Cap to Sales-Median Market Cap to Sales-Sales",
// };

// async function fetchChartSeries(
//   session: Session,
//   companyId: string,
//   companyUrl: string,
//   metricQuery: string,
//   days: number,
//   consolidated: boolean
// ): Promise<ChartSeries | null> {
//   try {
//     const url = `${BASE_URL}/api/company/${companyId}/chart/?q=${encodeURIComponent(metricQuery)}&days=${days}&consolidated=${consolidated}`;
//     const res = await fetch(url, { headers: headers(session, companyUrl) });
//     if (!res.ok) return null;
//     const json = await res.json();
//     return {
//       labels: json.labels ?? [],
//       datasets: (json.datasets ?? []).map((d: any) => ({
//         label: d.label ?? "",
//         data: d.data ?? [],
//       })),
//       metric_query: metricQuery,
//     };
//   } catch {
//     return null;
//   }
// }

// function sleep(ms: number): Promise<void> {
//   return new Promise((r) => setTimeout(r, ms));
// }

// export async function fetchAllChartData(
//   session: Session,
//   companyId: string,
//   companyUrl: string,
//   consolidated: boolean,
//   days = 365
// ): Promise<Record<string, ChartSeries | null>> {
//   const result: Record<string, ChartSeries | null> = {};
//   for (const [label, query] of Object.entries(CHART_METRICS)) {
//     result[label] = await fetchChartSeries(session, companyId, companyUrl, query, days, consolidated);
//     await sleep(1000);
//   }
//   return result;
// }
