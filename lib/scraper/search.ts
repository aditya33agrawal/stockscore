import type { Session } from "./types";

const BASE_URL = "https://www.screener.in";
const SEARCH_API = `${BASE_URL}/api/company/search/`;

export async function findCompanyUrl(
  session: Session,
  name: string
): Promise<string | null> {
  const url = `${SEARCH_API}?q=${encodeURIComponent(name)}&v=3`;
  const res = await fetch(url, {
    headers: {
      Cookie: session.cookies,
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      "X-Requested-With": "XMLHttpRequest",
    },
  });
  if (!res.ok) throw new Error(`Search API error: ${res.status}`);

  const results = await res.json();
  if (!Array.isArray(results) || results.length === 0) return null;

  let raw: string = results[0]?.url ?? "";
  raw = raw.replace(/^\//, "").replace(/\/$/, "");

  if (!raw.endsWith("consolidated")) raw = `${raw}/consolidated`;

  return `${BASE_URL}/${raw}/`;
}
