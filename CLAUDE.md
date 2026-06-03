# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev                   # start dev server at http://localhost:3000
npm run build                 # production build
npm run lint                  # ESLint via next lint

# Data refresh (run individually or combined)
npm run refresh               # scrape + score all sectors + market overview + charts
npm run refresh:force         # same but bypasses 7-day freshness check for all
npm run refresh:sector        # scrape + score companies only (no market/charts)
npm run refresh:market        # scrape market-overview page → market_sectors table
npm run refresh:market:force  # same but bypass 7-day freshness check
npm run refresh:charts        # fetch OHLCV candles + indicators (Yahoo/NSE) → chart_data table
npm run refresh:charts:force  # same, force re-fetch
npm run refresh:all           # full pipeline: sector + market + charts
npm run refresh:all:force     # full pipeline, force

# Config sync
npm run sync:config           # sync sectors_config.json → sector_config DB table
npm run sync:config:force     # force re-sync
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
| `MAINTENANCE_MODE` | set to `1` to return 503 on all routes |

## Architecture overview

Next.js 14 App Router app backed by a PostgreSQL database. **No static JSON for company data** — all data is live from the DB. The app is deployed on Vercel; site URL is `https://aditya-finance.vercel.app`.

### Data pipelines

**Pipeline 1 — Company scores** (`lib/pipeline.ts`):
```
screener.in HTML
  → lib/scraper/         (auth → search → parser → api.ts)
  → RawCompanyData
  → lib/scorer.ts        scoring engine → Company (scores, breakdowns, bonuses/penalties)
  → DB: companies + sectors tables
```

**Pipeline 2 — Market/sector aggregates** (`lib/market-pipeline.ts` + `lib/sector-scraper/`):
```
screener.in market overview page
  → sector-level aggregate metrics (MCap, P/E, OPM, ROCE, etc.)
  → DB: market_sectors + market_sectors_meta tables
```

**Pipeline 3 — Price charts** (`lib/charts/`):
```
Yahoo Finance / NSE
  → OHLCV candles + SMA-50, SMA-200, RSI-14
  → DB: chart_data table (ChartPayload JSONB)
  → lib/charts/store.ts reads it back for PriceChart component
```

Both company and market pipelines have a **7-day freshness check** — re-running a sector that was scraped < 7 days ago is a no-op unless `--force` is passed.

### Scoring model (`lib/scorer.ts`)

Companies are scored across 10 categories (max 100 points raw) using **continuous logistic/linear primitives** — no step rubrics:

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

Scoring primitives in `lib/scoring/primitives.ts`: `linUp`, `linDown`, `band`, `logistic`, `cv` (coefficient of variation), `olsSlope` (OLS regression for trend), `percentileRank`, `cagr`. The scorer uses logistic curves parameterised as `logistic(x, x0, half_width)` — see scorer.ts header for derivation.

Bonuses (+3 to +4) and penalties (−4 to −6) adjust the raw total. Industry ceilings: tobacco → 75, financials → 80, cyclical sectors → 90, others → 100. The `classification` field maps the final score to: Avoid / Watchlist / Accumulate / Invest-grade / Exceptional.

### DB schema

Tables created/migrated by `lib/db.ts → ensureTables()` (call via `POST /api/migrate`):

| Table | Purpose |
|---|---|
| `companies` | One row per ticker — `data` JSONB holds full `Company` object |
| `sectors` | One row per sector slug — `companies` JSONB array, aggregate stats |
| `market_sectors` | Sector-level aggregate metrics from screener.in market overview |
| `market_sectors_meta` | Last full refresh timestamp |
| `chart_data` | OHLCV candles + indicators per symbol (`ChartPayload` JSONB) |
| `sector_config` | Mirror of `sectors_config.json` (synced via `sync:config`) |
| `users` | Auth — bcrypt-hashed passwords |
| `sessions` | Auth — opaque 32-byte token in httpOnly cookie `ss_session`, 30-day TTL |
| `bookmarks` | Per-user saved companies |
| `feedback` | User feedback submissions |

### Key type boundaries

- `lib/scraper/types.ts` → `RawCompanyData` (raw scraped HTML data)
- `lib/types.ts` → `Company`, `SectorData`, `CompanyRaw`, `ScoreItem`, `CategoryScore`, `FactorRow` (scored/UI types)
- `lib/company-data.ts` → `CompanyDetail` (full DB record), `ChartData` (extracted time-series for charts)
- `lib/charts/types.ts` → `ChartPayload`, `Candle`, `IndicatorPoint` (price chart data)

`lib/evaluators.ts` — standalone functions (`evaluatePE`, `evaluateROE`, `evaluateROCE`, `evaluateOPM`, `evaluateDE`, `evaluateTrend`, etc.) that take `CompanyRaw` and return `{ sentence, tone }` — used on the company detail page for human-readable metric summaries.

### Sector config

`sectors_config.json` at the project root is the **single source of truth** for which sectors and companies exist. The pipeline reads this file; the UI's `loadSectorsConfig()` also reads it directly to show sectors that haven't been scraped yet. To add a sector/company, edit this file and re-run `npm run refresh:sector`.

### Auth system

Cookie-based session auth (`lib/auth.ts`). Cookie name: `ss_session` (httpOnly, secure, sameSite=lax). Routes: `/api/auth/login`, `/api/auth/signup`, `/api/auth/logout`, `/api/auth/me`, `/api/auth/change-password`, `/api/auth/forgot-password`.

### API routes

- `POST /api/refresh?sector=<slug>` — triggers `runPipeline` via SSE stream; password-gated
- `GET /api/company/[symbol]` — returns full `CompanyDetail` from DB
- `GET /api/charts/[symbol]` — returns `ChartPayload` from DB
- `GET /api/bookmarks` / `POST /api/bookmarks` — user bookmark CRUD
- `POST /api/migrate` — calls `ensureTables()`
- `POST /api/feedback` — stores feedback submission

## Middleware

### Edge middleware (`middleware.ts`)

Runs on every request before route handlers:
- **Maintenance mode** — `MAINTENANCE_MODE=1` → 503 on all routes
- **Rate limiting** — in-memory IP token bucket: 60 req/min for `/api/*`, 10 req/min for `/api/auth/*` and `/api/refresh`
- **Request ID** — `x-request-id` on every request/response
- **Security headers** — CSP (report-only), HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy
- **CORS** — same-origin only; add origins in `lib/middleware/cors.ts`
- **Access log** — one JSON line per request to stdout

### Per-route wrappers (`lib/api/`)

All new route handlers use `compose(...)` from `lib/api/compose.ts`. Convention — outermost first:

```ts
export const POST = compose(
  withErrorHandler,       // always outermost — catches everything → JSON { error: { code, message } }
  withMethods(["POST"]),  // 405 on wrong method
  withAuth,               // 401 if no session; injects ctx.user: SessionUser
  withSchema(MySchema),   // 400 + details on invalid body; injects ctx.body: T
)(async (req, { user, body }) => { ... });
```

Admin routes (`/api/refresh`, `/api/migrate`) use `withRefreshPassword` — clients send the password in the `x-refresh-password` header. Throw `UnauthorizedError`, `ForbiddenError`, `ValidationError`, `NotFoundError`, `RateLimitError`, or `ApiError(status, msg)` from `lib/api/errors.ts`.

## Design system

**Ink Wash theme** — warm, paper-and-charcoal palette. Light by **default**, with a matched
"Ink Wash Night" dark variant toggled via `ThemeToggle` (`ss_theme` in `localStorage`, `.dark`
class on `<html>`). All colors are CSS variables in `globals.css` (`:root` = light, `.dark` =
dark); Tailwind tokens map to them in `tailwind.config.ts`.

Palette: **Ink** `#4A4A4A` · **Mist** `#CBCBCB` · **Paper** `#FFFFE3` · **Slate** `#6D8196`.

| Token | Usage |
|---|---|
| `ink-950/900/800/700/600` | Surface / border scale. Note: under Ink Wash `ink-950` is **Paper** (page bg), `ink-700` is **Mist** (borders) — the names no longer describe the hue. |
| `chalk-50/100/200/300` | Text scale (`chalk-100` = Ink body text, brightest to muted) |
| `accent` / `accent-soft` / `accent-deep` | **Slate `#6D8196`** — interactive chrome, links, headings, focus, selection. **Not** a verdict color. |
| `good` / `good-deep` | **Green `#3F7A52`** — positive verdicts: gains, strong metrics, high scores, Invest-grade/Exceptional |
| `bad` / `bad-deep` | **Red `#B0524E`** — negative: losses, penalties, downtrend, Avoid |
| `warn` | **Amber `#B8862B`** — caution: Watchlist, mid scores |
| `violet` | Purple `#7C3AED` — secondary accent (charts) |

**Verdict color rule:** green/red/amber (`good`/`bad`/`warn`) express *value sentiment only*.
Slate (`accent`) is for interactive chrome and neutral emphasis, so it never reads as a "good"
verdict. Score→color mapping lives in `lib/format.ts`.

**Charts** (recharts/lightweight-charts): `var()` does **not** resolve inside SVG `fill`/`stroke`
attributes, so chart series use static Ink Wash hex chosen to read on both Paper and Ink-Night
(slate `#6D8196`, violet `#7C3AED`, amber `#B8862B`, taupe `#9A8C7C`; green/red only for up/down
sentiment). Chart grid/axis/crosshair read CSS vars at runtime via `getComputedStyle` (see
`PriceChart.tsx`). Allocation segments use a muted slate/violet/taupe ramp (`lib/allocation.ts`),
never green/red.

Custom CSS utility classes (defined in `globals.css`):
- `.glass` — frosted-glass panel background
- `.border-subtle` — standard subtle border
- `.num` — applies `font-mono` + tabular-nums (use on all financial numbers)

Typography: `font-sans` (Inter), `font-mono` / `.num` (JetBrains Mono for numbers). Layout max-widths: `max-w-5xl` (company page), `max-w-6xl` (sector/home), `max-w-7xl` (compare table).

## Component patterns

- **Server components** fetch directly from DB via `lib/data.ts`. Client islands are "use client" components receiving pre-fetched data as props.
- **`HeaderHelp`** component provides column-header tooltips (used in `SectorsCompareTable`).
- **`MetricCard`** — reusable metric display with headline, badge (tone: good/neutral/warn), sentence, and optional spark chart.
- **`CategoryCard`** — score breakdown card for the 10 scoring categories on the company detail page.
- **`ScoreBadge`** — circular score display with classification label.
- **`PriceChart`** — lightweight-charts wrapper for OHLCV candlestick + SMA overlays.
- Financial numbers must always use the `.num` class (monospace + tabular-nums).
