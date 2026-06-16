import type { Session } from "./types";

const BASE_URL = "https://www.screener.in";
const SEARCH_API = `${BASE_URL}/api/company/search/`;
const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36";

function headers(session: Session): HeadersInit {
  return {
    Cookie: session.cookies,
    "User-Agent": UA,
    "X-Requested-With": "XMLHttpRequest",
  };
}

// Extract the screener ticker from a result URL: /company/INFY/ or
// /company/INFY/consolidated/ -> INFY. Numeric (BSE-only) -> null.
function tickerFromUrl(href: string): string | null {
  const parts = href.split("/").filter(Boolean);
  const idx = parts.indexOf("company");
  const seg = idx >= 0 ? parts[idx + 1] : parts[parts.length - 1];
  if (!seg) return null;
  if (/^\d+$/.test(seg)) return null;
  return seg.toUpperCase();
}

function toConsolidated(rawUrl: string): string {
  let raw = rawUrl.replace(/^\//, "").replace(/\/$/, "");
  if (!raw.endsWith("consolidated")) raw = `${raw}/consolidated`;
  return `${BASE_URL}/${raw}/`;
}

async function pageExists(session: Session, ticker: string): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/company/${ticker}/`, {
      headers: headers(session),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Resolve a symbol to its screener company URL.
 *
 * IMPORTANT: never accept a fuzzy non-exact search hit - screener's search is
 * fuzzy (e.g. "IDEA" -> IDEAFORGE, "ABB" -> ABBOTINDIA, "GATI" -> Jain
 * Irrigation), which silently scrapes the WRONG company into a sector. We only
 * accept (1) a result whose ticker exactly matches the query, or (2) the symbol
 * as a direct /company/<sym>/ page (covers hyphenated codes like BAJAJ-AUTO /
 * NAM-INDIA that search can't match). Otherwise return null (caller logs it as
 * a defaulter - better a known gap than a wrong company).
 */
export async function findCompanyUrl(
  session: Session,
  name: string,
): Promise<string | null> {
  const query = name.toUpperCase();

  // 1) Search API - accept only an exact ticker match.
  try {
    const res = await fetch(`${SEARCH_API}?q=${encodeURIComponent(name)}&v=3`, {
      headers: headers(session),
    });
    if (res.ok) {
      const results = await res.json();
      if (Array.isArray(results)) {
        const exact = results.find(
          (r: { url?: string }) => r.url && tickerFromUrl(r.url) === query,
        );
        if (exact?.url) return toConsolidated(exact.url);
      }
    }
  } catch {
    /* fall through to direct-page check */
  }

  // 2) Direct page - the raw symbol may itself be a valid screener code that
  //    search can't match (hyphens/ampersands).
  if (await pageExists(session, name)) {
    return toConsolidated(`/company/${name}`);
  }

  return null;
}
