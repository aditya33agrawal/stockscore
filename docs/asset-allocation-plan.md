# Asset Allocation Page — Plan

## Goal
A self-serve tool where a user enters a few facts about themselves and instantly sees a recommended split across asset classes. Should update live as inputs change.

## Inputs
1. **Goal** (dropdown): `retirement`, `wealth_creation`, `house`, `child_education`, `short_term_parking`.
2. **Time horizon** (years, number input): how long until you need the money.
3. **Expected return %** (number input, default 12): user's desired CAGR — used to flag if it's realistic.
4. **Age** (number input).
5. **Risk preference** (dropdown): `conservative`, `balanced`, `aggressive`.
6. **Monthly investable amount** (optional, used only for display).

## Derived metrics
- **Risk score** (0–100): combination of age, horizon, goal, and preference.
  - Base: `100 - age` (classic rule of thumb for equity %).
  - +Horizon multiplier: short (<3y) ×0.5, medium (3–7y) ×0.85, long (>7y) ×1.1, capped 95.
  - Goal modifier: `short_term_parking` −30, `house` (if horizon<5) −20, `retirement` ±0 (depends on horizon), `wealth_creation` +5, `child_education` 0.
  - Preference modifier: conservative −15, balanced 0, aggressive +15.
  - Final clamped to [5, 95].
- **Risk bucket label**: 0–25 Very Low, 26–45 Low, 46–60 Moderate, 61–80 High, 81–100 Very High.
- **Expected return realism**: compare user expected return against a model expected based on equity share. Flag if > equity_share*0.16 + debt_share*0.07 + ~baseline (i.e., unrealistic).

## Allocation logic
Driven by **risk score** (R, 0–100) and **horizon**:

- Equity total (Indian + US equity + equity MFs) = R%.
- Of which:
  - Indian Stocks (direct): `min(R*0.30, 25)` if R≥50 else 0 (direct equity only for ≥moderate).
  - Equity MFs: rest of equity − US share.
  - US Market (ETFs/MFs): `R*0.10` if R≥40 else 0.
- Debt total = `(100 − R) * 0.7`.
  - Debt MFs: 60% of debt.
  - Bonds: 40% of debt.
- Gold/Silver: `min(15, 5 + (100−R)*0.10)` — defensive, increases as risk drops.
- Real Estate: depends on horizon — only if horizon ≥ 7y; `min(15, horizon*1.2)` else 0.
- Normalize all to sum to 100 (subtract from largest non-zero slice).

## Suggested mix table
| Class | Notes |
|---|---|
| Indian Stocks (direct) | Bluechip / multibagger picks via Stockscore |
| Equity MFs | Diversified large/midcap funds |
| US Market | Nasdaq 100 / S&P 500 via international ETFs |
| Debt MFs | Short-duration, corporate bond, banking PSU |
| Bonds | G-sec / AAA corp bonds; ladder over 3–5 yrs |
| Gold/Silver | Sovereign Gold Bonds, Silver ETFs |
| Real Estate | REITs for liquidity, physical for long horizon |

## UX
- Two-column layout: form on left (sticky), live result on right.
- Result section:
  - Risk score gauge (0–100) + label.
  - Donut chart (Recharts `PieChart`) of allocation.
  - Table with %, rationale, suggested instrument per asset.
  - Realism callout if expected returns are unrealistic.
- Every input is `useState`; allocation is `useMemo` over inputs — fully client-side, no API.
- Default starter values (age 28, horizon 10, goal wealth_creation, expected return 12, balanced, ₹25k/m).

## File layout
- `app/asset-allocation/page.tsx` — server shell with metadata.
- `components/AssetAllocator.tsx` — client component with form + logic + chart.
- `lib/allocation.ts` — pure function `recommendAllocation(input) → {risk, label, slices[]}`.

## Out of scope (for v1)
- Saving / sharing scenarios (could add later).
- Backtests or projections.
- Tax optimization (ELSS, LTCG considerations).
