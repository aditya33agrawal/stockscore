import { load } from "cheerio/slim";
import type { Session } from "./types";

const BASE_URL = "https://www.screener.in";
const LOGIN_URL = `${BASE_URL}/login/`;
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

function parseCookieHeader(res: Response): Record<string, string> {
  const map: Record<string, string> = {};
  const setCookies: string[] =
    typeof (res.headers as any).getSetCookie === "function"
      ? (res.headers as any).getSetCookie()
      : (res.headers.get("set-cookie") ?? "")
          .split(/,(?=\s*[a-zA-Z_][^=,]+=)/)
          .filter(Boolean);

  for (const raw of setCookies) {
    const [nameVal] = raw.split(";");
    const eq = nameVal.indexOf("=");
    if (eq < 0) continue;
    const name = nameVal.slice(0, eq).trim();
    const value = nameVal.slice(eq + 1).trim();
    if (name) map[name] = value;
  }
  return map;
}

function cookiesToString(map: Record<string, string>): string {
  return Object.entries(map)
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

export async function login(email: string, password: string): Promise<Session> {
  const baseHeaders = {
    "User-Agent": UA,
    "Accept-Language": "en-US,en;q=0.9",
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  };

  const getRes = await fetch(LOGIN_URL, {
    headers: baseHeaders,
    redirect: "follow",
  });
  if (!getRes.ok)
    throw new Error(`Login page fetch failed: ${getRes.status}`);

  const html = await getRes.text();
  const initialCookies = parseCookieHeader(getRes);

  const $ = load(html);
  const csrfMiddlewareToken = $(
    'input[name="csrfmiddlewaretoken"]'
  ).val() as string;
  if (!csrfMiddlewareToken)
    throw new Error("CSRF token not found on login page");

  const body = new URLSearchParams({
    csrfmiddlewaretoken: csrfMiddlewareToken,
    username: email,
    password,
    next: "",
  });

  const postRes = await fetch(LOGIN_URL, {
    method: "POST",
    headers: {
      ...baseHeaders,
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: LOGIN_URL,
      Cookie: cookiesToString(initialCookies),
    },
    body: body.toString(),
    redirect: "manual",
  });

  const sessionCookies = parseCookieHeader(postRes);
  const merged = { ...initialCookies, ...sessionCookies };

  if (!merged["sessionid"]) {
    throw new Error(
      "Login failed: no sessionid cookie — check credentials in .env.local"
    );
  }

  const cookies = cookiesToString(merged);
  const csrfToken = merged["csrftoken"] ?? csrfMiddlewareToken;

  return { cookies, csrfToken };
}
