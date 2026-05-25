import type { Session } from "../scraper/types";

const BASE_URL = "https://www.screener.in";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

export async function fetchMarketPage(session: Session): Promise<string> {
  const url = `${BASE_URL}/market/`;
  const res = await fetch(url, {
    headers: {
      Cookie: session.cookies,
      "User-Agent": UA,
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${res.status}`);
  }
  return res.text();
}
