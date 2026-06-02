# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # start dev server at http://localhost:3000
npm run build            # production build
npm run lint             # ESLint via next lint
npm run refresh          # scrape + score all sectors, write to DB
npm run refresh:market   # scrape market-overview page, write sector-level metrics to DB
npm run refresh:market:force  # same but bypass 7-day freshness check
```

Scripts run with `npx tsx` — no separate compile step needed.

## Environment variables

Required in `.env.local`:

| Variable | Purpose |
|---|---|
| `DB_CONNECTION_STRING` | PostgreSQL connection string (SSL required) |
| `SCREENER_EMAIL` | screener.in login for the scraper |
| `SCREENER_PASSWORD` | screener.in login for the scraper |
| `REFRESH_PASSWORD` | optional — gates the `/api/refresh` endpoint |
| `NEXT_PUBLIC_ENABLE_REFRESH` | if set, shows refresh buttons in the UI |

## Architecture overview

This is a Next.js 14 App Router app backed by a PostgreSQL database. There is no static JSON — all data is live from the DB.

### Data flow

```
screener.in
    │
    ├── lib/scraper/          HTML scraper (auth, search, parser, api)
    │       └── parses company pages into RawCompanyData
    │
    ├── lib/scorer.ts         scoring engine
    │       └── turns RawCompanyData → Company (10 categories, 100-point rubric)
    │
    ├── lib/pipeline.ts       orchestration
    │       └── scrapes + scores each company, upserts to DB
    │
    └── lib/db.ts             postgres client + schema (ensureTables)
            └── tables: companies, sectors, market_sectors, market_sectors_meta
```

A second pipeline (`lib/market-pipeline.ts` + `lib/sector-scraper/`) scrapes the screener.in market overview page for sector-level aggregate metrics and writes to `market_sectors`.

### Scoring model (`lib/scorer.ts`)

Companies are scored across 10 categories (max 100 points raw):

| Category | Max |
|---|---|
| Valuation | 10 |
| Profitability | 20 |
| Growth | 15 |
| Quarterly Momentum | 10 |
| Balance Sheet | 15 |
| Cash Flow | 10 |
| Shareholding | 8 |
| Dividend | 4 |
| Operational Efficiency | 5 |
| Price & Technical | 3 |

Bonuses (+3 to +4) and penalties (−4 to −6) adjust the raw total. Industry ceilings apply: tobacco → 75, financials → 80, others → 100. The `classification` field maps the final score to: Avoid / Watchlist / Accumulate / Invest-grade / Exceptional.

### DB caching

`lib/pipeline.ts` checks if a company's DB row is < 7 days old before scraping — it reuses the cached score if fresh. This means re-running `refresh` for an already-scraped sector is fast.

### Sector config

`sectors_config.json` at the project root is the single source of truth for which sectors and companies exist. The pipeline reads this file; the UI's `loadSectorsConfig()` also reads it directly to show sectors that haven't been scraped yet (shown as "no data yet").

### API routes

- `POST /api/refresh?sector=<slug>` — triggers `runPipeline` via SSE stream; password-gated via `REFRESH_PASSWORD`
- `GET /api/company/[symbol]` — returns full `CompanyDetail` from DB
- `POST /api/migrate` — calls `ensureTables()`

### Key type boundaries

- `lib/scraper/types.ts` → `RawCompanyData` (raw scraped HTML data)
- `lib/types.ts` → `Company`, `SectorData`, `SectorIndexEntry` (scored/UI types)
- `lib/company-data.ts` → `CompanyDetail` (full DB record including raw financials and score)

`lib/evaluators.ts` contains standalone functions that turn `CompanyRaw` metrics into human-readable sentences with tone (good/neutral/warn) — used on the company detail page.

## Middleware

### Edge middleware (`middleware.ts`)

Runs on every request before route handlers. Handles:
- **Maintenance mode** — set `MAINTENANCE_MODE=1` to return 503 on all routes
- **Rate limiting** — in-memory IP token bucket: 60 req/min for `/api/*`, 10 req/min for `/api/auth/*` and `/api/refresh`
- **Request ID** — attaches `x-request-id` to every request/response
- **Security headers** — CSP (report-only), HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy
- **CORS** — same-origin only by default; add origins in `lib/middleware/cors.ts`
- **Access log** — one JSON line per request to stdout

### Per-route wrappers (`lib/api/`)

All new route handlers use `compose(...)` from `lib/api/compose.ts`. Convention — outermost first:

```ts
export const POST = compose(
  withErrorHandler,      // always outermost — catches everything → JSON { error: { code, message } }
  withMethods(["POST"]), // 405 on wrong method
  withAuth,              // 401 if no session; injects ctx.user: SessionUser
  withSchema(MySchema),  // 400 + details on invalid body; injects ctx.body: T
)(async (req, { user, body }) => { ... });
```

| Wrapper | File | Purpose |
|---|---|---|
| `withErrorHandler` | `lib/api/with-error-handler.ts` | Catches `ApiError` → JSON; unknown → 500 |
| `withMethods` | `lib/api/with-methods.ts` | 405 + `Allow` header |
| `withAuth` | `lib/api/with-auth.ts` | Session check; injects `user` |
| `withRefreshPassword` | `lib/api/with-refresh-password.ts` | `x-refresh-password` header check |
| `withSchema` | `lib/api/with-schema.ts` | Body validation; injects `body` |
| `compose` | `lib/api/compose.ts` | Right-to-left wrapper composition |

Errors: throw `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `NotFoundError`, `RateLimitError`, or `ApiError(status, msg)` from `lib/api/errors.ts`.

Admin routes (`/api/refresh`, `/api/migrate`) are gated with `withRefreshPassword`. Clients must send the password in the `x-refresh-password` request header (not the body).
