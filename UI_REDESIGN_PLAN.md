# Stockscore — UI Redesign Plan
**Theme: Obsidian** · Deep space black · Cyan (`#00D2FF`) + Violet (`#7C3AED`) dual accent  
**Status:** Ready to implement  
**Scope:** All pages, all shared components, global CSS, Tailwind config

---

## 1. Design System Foundation

### 1.1 Color Palette (update `tailwind.config.ts`)

| Token | Old | New | Usage |
|---|---|---|---|
| `ink-950` | `#070B14` | `#03060F` | page background |
| `ink-900` | `#0B1220` | `#070C1A` | card/panel background |
| `ink-800` | `#101828` | `#0C1426` | hover state, nested bg |
| `ink-700` | `#1A2233` | `#132035` | borders, dividers |
| `ink-600` | `#2A3447` | `#1E3050` | subtle borders |
| `ink-500` | `#475569` | `#2E4060` | muted text |
| `chalk-50` | `#F8FAFC` | `#E8F4FF` | primary text |
| `chalk-100` | `#EEF2F7` | `#DAEAF8` | secondary text |
| `chalk-200` | `#D6DEEA` | `#B8D0EC` | muted |
| `chalk-300` | `#9FB0C8` | `#7090B0` | disabled/placeholder |
| `accent` | `#10B981` | `#00D2FF` | primary accent (cyan) |
| `accent-soft` | `#34D399` | `#38E8FF` | hover/glow |
| `accent-deep` | `#059669` | `#0099CC` | pressed |
| `violet` (new) | — | `#7C3AED` | secondary accent |
| `violet-soft` (new) | — | `#9B6BF5` | gradients |
| `warn` | `#F59E0B` | `#F59E0B` | keep |
| `bad` | `#F87171` | `#F87171` | keep |

### 1.2 Typography (update `app/globals.css` + `tailwind.config.ts`)

```
Remove:  Source Serif Pro
Add:     Geist (headings, body) — from vercel/next/font/google
Keep:    JetBrains Mono (numbers, code)
```

Font stack changes:
- **Sans (body):** `Geist, Inter, ui-sans-serif` — sharper, more modern
- **Mono (numbers):** `JetBrains Mono` — keep as is
- **Serif:** remove (not used in Obsidian theme)

### 1.3 Global CSS changes (`app/globals.css`)

- Background: `#03060F`
- Text color: `#E8F4FF`  
- `::selection`: background `#00D2FF`, color `#03060F`
- **New utility classes:**
  - `.glow-cyan` — `text-shadow: 0 0 20px rgba(0,210,255,0.4)`
  - `.glass` — `background: rgba(255,255,255,0.025); backdrop-filter: blur(20px)`
  - `.border-subtle` — `border: 1px solid rgba(255,255,255,0.06)`
  - `.gradient-text` — cyan→violet gradient on text
- **Hero pattern:** replace green grid with cyan version + radial mask
- **Scrollbar:** `#132035` thumb, `#03060F` track

### 1.4 New CSS Variables

```css
:root {
  --accent: #00D2FF;
  --violet: #7C3AED;
  --glow-cyan: 0 0 40px rgba(0,210,255,0.15);
  --glow-violet: 0 0 40px rgba(124,58,237,0.15);
  --panel-bg: rgba(255,255,255,0.025);
  --panel-border: rgba(255,255,255,0.06);
}
```

---

## 2. Component Changes

### 2.1 `components/Navbar.tsx` ⭐ HIGH PRIORITY

**Current:** Simple sticky bar with logo, nav links, hamburger  
**New design:**

- Background: `rgba(3,6,15,0.8)` + `backdrop-filter: blur(20px) saturate(200%)`
- Border: `rgba(0,210,255,0.07)` (very subtle cyan tint)
- **Logo:** Replace `LineChart` icon with custom SVG polyline (like the preview's waveform icon), housed in a `rounded-xl` with `rgba(0,210,255,0.1)` bg and `rgba(0,210,255,0.2)` border
- **Nav links:** Hover → `color: #E8F4FF; bg: rgba(255,255,255,0.05)` · Active → `color: #00D2FF; bg: rgba(0,210,255,0.08)`
- **Right side:** Add a subtle "Sign in" ghost button (or remove if auth not needed) — replace with a CTA pill: `"Explore →"` in cyan
- Height: `64px` (up from 60px, more breathing room)
- Mobile: slide-down panel with same cyan-tinted border-bottom

### 2.2 `components/Footer.tsx`

**Current:** Two-line simple footer  
**New design:**

- **Upper row:** Logo + tagline left · Nav links right (Sectors, Methodology, Blog, About, Terms)
- **Lower row:** Copyright left · Data attribution + disclaimer right
- Background: `#03060F` (same as page), no visible panel
- Top border: `rgba(255,255,255,0.05)`
- Link hover: `#00D2FF`
- Padding: `py-12` top section, `py-4` bottom bar
- Add: small text `"Not investment advice"` next to disclaimer

### 2.3 `components/ScoreBadge.tsx` ⭐ HIGH PRIORITY

**Current:** Rectangular box with score and `/100` label  
**New design:**

- Remove rectangular badge entirely
- Replace with **large monospace number** + classification text below
- Size variants:
  - `sm`: `text-2xl` mono score + `text-[10px]` classification
  - `md`: `text-4xl` mono score + `text-xs` classification pill badge
  - `lg`: `text-6xl` mono score + `text-sm` classification pill badge
- Score color logic stays the same but maps to new palette:
  - ≥70 → `#00D2FF` (cyan)
  - ≥50 → `#F59E0B` (amber warn)
  - <50 → `#F87171` (red bad)
- Classification pill: `rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider`
  - Invest-grade → `bg: rgba(16,185,129,0.15); color: #10b981`
  - Accumulate → `bg: rgba(0,210,255,0.1); color: #00D2FF`
  - Watchlist → `bg: rgba(245,158,11,0.1); color: #F59E0B`
  - Avoid → `bg: rgba(248,113,113,0.1); color: #F87171`

### 2.4 `components/ScoreBar.tsx` (the `ScoreBar` export)

- Bar height: `h-1` (slimmer, more refined)
- Track: `rgba(255,255,255,0.05)`
- Fill gradient:
  - ≥70: `linear-gradient(90deg, #00D2FF, #7C3AED)` (cyan→violet)
  - ≥50: `linear-gradient(90deg, #F59E0B, #FBBF24)` (amber)
  - <50: `#F87171` (red, no gradient)
- Add `transition-all duration-500` for animated fills on mount

### 2.5 `components/CategoryCard.tsx` ⭐ HIGH PRIORITY

**Current:** Expandable card with border, score bar, and item list  
**New design:**

- Container: `glass` class (translucent bg + blur) · `border-subtle` · `rounded-2xl`
- **Collapsed state:**
  - Category name: `font-semibold text-chalk-50` (keep)
  - Score: large mono number in cyan/amber/red · `/ {max}` in muted
  - Progress bar: new slim gradient bar (from ScoreBar changes)
  - Rationale text: `text-xs text-chalk-300/60` (slightly more muted)
  - Chevron: replaces with a `+` / `−` symbol in `text-chalk-300/40`
- **Expanded state:**
  - Background: `rgba(0,210,255,0.02)` (very faint cyan wash)
  - Each item row: no divider lines — use `py-2.5 gap-4`
  - Points: `+X.X` in green · `-X.X` in red · monospace
  - Detail text: `text-xs font-mono text-chalk-300/50`
- Hover on collapsed: `border-color: rgba(0,210,255,0.15)` transition

### 2.6 `components/Leaderboard.tsx` ⭐ HIGH PRIORITY

**Current:** Dense sortable table  
**New design:**

- Table wrapper: `glass` + `rounded-2xl` + `border-subtle` + `overflow-hidden`
- **Header row:**
  - `bg: rgba(0,210,255,0.03)`
  - Border-bottom: `rgba(255,255,255,0.05)`
  - `th` text: `mono text-[10px] font-medium tracking-[0.12em] uppercase text-chalk-300/40`
  - Sort button: arrow icon → active column shows cyan arrow
- **Data rows:**
  - Rank: `mono text-chalk-300/25 text-sm`
  - Company name: `font-semibold text-chalk-50 text-sm` · hover → underline in cyan
  - Ticker: `mono text-[10px] text-chalk-300/30`
  - Score column: inline mini score bar + mono score number right-aligned in cyan
  - Classification: right-aligned colored pill (same spec as ScoreBadge pills)
  - Row hover: `bg: rgba(0,210,255,0.03)` subtle wash
- Sticky header on scroll when table is tall

### 2.7 `components/MetricCard.tsx`

- Container: `glass` + `border-subtle` + `rounded-xl` + `p-5`
- Label: `text-[10px] uppercase tracking-widest text-chalk-300/40`
- Value: `text-2xl font-bold mono text-chalk-50`
- Trend arrow: cyan for positive, red for negative
- Remove hard `border-ink-700/60` — use CSS variable `--panel-border`

### 2.8 `components/SectorSearch.tsx`

**Current:** Basic search with combobox  
**New design:**

- Wrapper: `max-w-xl mx-auto`
- Input container: `glass border border-[rgba(255,255,255,0.1)] rounded-2xl px-5 py-1`
- Focus ring: `border-[rgba(0,210,255,0.3)] shadow-[0_0_40px_rgba(0,210,255,0.1)]`
- Input text: `text-chalk-50 placeholder:text-chalk-300/30 text-base`
- Search icon: `text-[#00D2FF]/50` left
- `⌘K` kbd hint: `mono text-chalk-300/30` right
- Dropdown: `glass border-subtle rounded-xl mt-2 shadow-2xl`
- Result items: company name bold + sector tag pill on right
- Hover: `bg: rgba(0,210,255,0.06)` wash

### 2.9 `components/RadarCompare.tsx`

- Chart color: update green radar lines/fills to cyan (`#00D2FF`) and violet (`#7C3AED`)
- Grid lines: `rgba(255,255,255,0.05)`
- Axis labels: `text-[10px] text-chalk-300/50`
- Legend: pill badges matching ScoreBadge style

### 2.10 `components/PriceRuler.tsx`

- Track: `rgba(255,255,255,0.05)`
- Active range: `linear-gradient(90deg, #00D2FF, #7C3AED)`
- Handle: white circle with cyan glow `box-shadow: 0 0 10px rgba(0,210,255,0.5)`

### 2.11 `components/FinancialCharts.tsx`

- Chart lines: cyan primary, violet secondary
- Grid: `rgba(255,255,255,0.04)`
- Tooltip: `glass border-subtle rounded-xl px-4 py-3`
- Axis ticks: `mono text-[10px] text-chalk-300/40`

### 2.12 `components/PeerComparisonTable.tsx`

- Same style as Leaderboard — `glass` container, mono rank, slim score bars

---

## 3. Page Changes

### 3.1 `app/page.tsx` (Home) ⭐ HIGH PRIORITY

**Hero section:**
- Background: `#03060F` + hero pattern (cyan grid instead of green)
- **Layout:** Center-aligned (keep current), not split (split is for company detail)
- Badge: `"🟢 Live · 32 sectors covered"` with cyan dot pulse animation
- H1: `font-bold text-[clamp(40px,5vw,72px)] leading-[1.05] tracking-tight text-chalk-50`
  - Highlighted phrase: `<span>` with `background: linear-gradient(90deg, #00D2FF, #7C3AED); -webkit-background-clip: text; color: transparent`
- Subtext: `text-chalk-300/50`
- Search bar: new SectorSearch design (see 2.8)
- **Stats strip** (NEW — add below search):
  ```
  [ 32 Sectors ]  [ 480+ Companies ]  [ 10 Categories ]
  ```
  Glass pill row: `glass border-subtle rounded-2xl flex gap-12 px-10 py-6 max-w-xl mx-auto mt-10`

**How It Works section:**
- Section label: `mono text-[11px] tracking-[0.1em] uppercase text-[#00D2FF]`
- 3 cards: `glass border-subtle rounded-2xl p-6` — replace icon component with emoji or SVG in a `rounded-xl bg-[rgba(0,210,255,0.08)]` box
- Card hover: lift `translateY(-2px)` + `border-color: rgba(0,210,255,0.2)` transition

**Sector grid:**
- Change from 3-col to 3-col (keep) but redesign each card → see `SectorCard` spec below
- Section title typography update

**New: `SectorCard` sub-component** (inline in `app/page.tsx` or extracted):

```
┌─────────────────────────────────────────┐
│ [Sector tag - muted mono uppercase]     │
│ [Sector Name - bold 17px]              │
│                                         │
│  [SCORE - large cyan mono]  [Badge pill]│
│  [Progress bar - slim gradient]         │
│                                         │
│  [N companies · Best: Company]          │
└─────────────────────────────────────────┘
```
- Container: `glass border-subtle rounded-2xl p-6 hover:border-[rgba(0,210,255,0.2)] transition-all hover:-translate-y-0.5`
- Score color: cyan ≥70, amber 50-70, red <50
- Progress bar: new gradient bar spec

### 3.2 `app/sector/[slug]/page.tsx`

**Header:**
- Back link: `"← All sectors"` in `text-chalk-300/50 hover:text-[#00D2FF]` — add left-arrow → cyan on hover
- Sector name: `text-4xl font-bold tracking-tight text-chalk-50`
- Description: `text-chalk-300/60 mt-2`
- Stats row (companies count, refresh date, methodology link): `mono text-[11px] text-chalk-300/35 flex gap-6 mt-3`

**Stats cards row (top of sector page):**
- Currently 3-4 stat boxes
- New: `glass border-subtle rounded-2xl` containers, same pattern as home stats strip
- Add subtle cyan tint to top-scoring company's card

**Leaderboard:** apply 2.6 changes  
**Radar:** apply 2.9 changes

### 3.3 `app/sector/[slug]/[company]/page.tsx` ⭐ HIGH PRIORITY

**Company header (hero area):**

Implement the **split layout** from Theme C:
```
Left:                              Right:
[Sector breadcrumb]               [Large score ring or number]
[Company Name - H1]               [Classification badge]
[Ticker · Market cap · Sector]    [Rank in sector]
[Key ratios: ROE, ROCE, OPM]
```

- Left: flex-col, occupies ~60%
- Right: `glass border-subtle rounded-2xl p-6 text-center` occupying ~40%
  - Score: `text-6xl font-bold mono text-[#00D2FF]`
  - `/100` in muted
  - Classification pill
  - Rank: `#1 in sector` in `mono text-xs text-chalk-300/40`
- Container: `glass border-subtle rounded-2xl p-8 mb-8`

**Category Cards section:**
- Section label: `"Score Breakdown"` with mono tag above
- Apply all CategoryCard changes from 2.5

**Financial tables/charts:**
- Apply chart color changes from 2.11

### 3.4 `app/sectors/page.tsx` (All Sectors browser)

- Page header: same typography pattern as sector page
- `SectorsBrowser` component: apply card redesign
- Filter/sort controls: `glass rounded-xl border-subtle p-1` pill group

### 3.5 `app/methodology/page.tsx`

- Section headings: cyan label → bold title pattern
- Table: `glass border-subtle rounded-2xl overflow-hidden` with same Leaderboard header style
- Code blocks (if any): dark glass bg, mono, cyan syntax

### 3.6 `app/about/page.tsx`, `app/contact/page.tsx`, `app/blog/page.tsx`

- All prose pages: max-w-2xl centered
- H1: gradient text (cyan → violet)
- Body text: `text-chalk-300/80 leading-[1.8]`
- Links: `text-[#00D2FF] hover:text-[#38E8FF]`

---

## 4. Implementation Order

Execute in this exact sequence to avoid broken intermediate states:

```
Phase 1 — Foundation (no visible change risk)
  1. tailwind.config.ts    — add new color tokens + violet
  2. app/globals.css       — update bg, selection, utility classes, hero grid
  3. lib/format.ts         — update scoreColor/scoreBg helpers to new palette

Phase 2 — Shell (layout always visible)
  4. components/Navbar.tsx
  5. components/Footer.tsx

Phase 3 — Atoms (small, used everywhere)
  6. components/ScoreBadge.tsx
  7. components/ScoreBar.tsx (the ScoreBar export)
  8. components/MetricCard.tsx

Phase 4 — Molecules (composed from atoms)
  9. components/CategoryCard.tsx
  10. components/SectorSearch.tsx
  11. components/Leaderboard.tsx
  12. components/PeerComparisonTable.tsx

Phase 5 — Data viz
  13. components/RadarCompare.tsx
  14. components/FinancialCharts.tsx
  15. components/PriceRuler.tsx
  16. components/PriceChart.tsx

Phase 6 — Pages
  17. app/page.tsx               (home hero + sector grid)
  18. app/sector/[slug]/page.tsx (sector page)
  19. app/sector/[slug]/[company]/page.tsx  (company detail)
  20. app/sectors/page.tsx
  21. app/methodology/page.tsx
  22. app/about/page.tsx + app/blog/page.tsx + app/contact/page.tsx
```

---

## 5. Key Design Rules to Follow

1. **No hard `bg-ink-*` colors in components** — use CSS variables or the new tokens only
2. **All cards use `glass` + `border-subtle`** — never opaque solid backgrounds
3. **Cyan (#00D2FF) is the primary accent** — used for: active nav, links, primary scores, progress fills (high), CTAs
4. **Violet (#7C3AED) is secondary** — used for: gradient tails, radar second dataset, decorative elements only
5. **Mono font for ALL numbers** — scores, points, percentages, dates use `font-mono`
6. **Score color mapping** (update `lib/format.ts`):
   - ≥70 → `text-[#00D2FF]` (cyan)  
   - ≥50 → `text-[#F59E0B]` (amber)
   - <50 → `text-[#F87171]` (red)
7. **Progress bar gradients:**
   - High (≥70%): `from-[#00D2FF] to-[#7C3AED]`
   - Mid (≥50%): `from-[#F59E0B] to-[#FBBF24]`
   - Low (<50%): `bg-[#F87171]`
8. **Hover states always transition** — use `transition-all duration-200` on interactive elements
9. **No box shadows except for glow effects** — use `shadow-[0_0_40px_rgba(0,210,255,0.15)]` for cyan glow
10. **Spacing is generous** — section padding `py-16 sm:py-24`, card padding `p-6 sm:p-8`

---

## 6. Files NOT Changing

- `lib/scorer.ts` — scoring logic untouched
- `lib/pipeline.ts` — data pipeline untouched
- `lib/db.ts` — database untouched
- `lib/types.ts` — types untouched
- `lib/evaluators.ts` — evaluator logic untouched
- `lib/scraper/` — all scraper files untouched
- `app/api/` — all API routes untouched
- `sectors_config.json` — untouched
- `app/resume/page.tsx` — personal resume page, skip
- `app/asset-allocation/page.tsx` — complex component, tackle separately after core is done

---

## 7. Fonts to Add

In `app/globals.css`, update the Google Fonts import:

```css
@import url("https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,300;0,14..32,400;0,14..32,500;0,14..32,600;0,14..32,700;0,14..32,800&family=JetBrains+Mono:wght@400;500;600&display=swap");
```

(Remove Source Serif Pro · Keep Inter as fallback · Geist can be loaded via `next/font/google` in `layout.tsx`)

In `app/layout.tsx`, add:
```tsx
import { Geist, Geist_Mono } from "next/font/google";
// Use Geist for body, keep JetBrains Mono for numbers via .mono class
```

---

## 8. Acceptance Criteria

- [ ] App loads with `#03060F` background — no flicker to old green-tinted dark
- [ ] Navbar shows cyan-accent active link, waveform logo icon
- [ ] Home hero has gradient text headline + animated live badge + stats strip
- [ ] Sector cards use glass + slim gradient score bars
- [ ] Leaderboard table has glass wrapper + mono rank + cyan score numbers
- [ ] CategoryCard expands smoothly with cyan-tinted bg wash
- [ ] Company detail page shows large `text-6xl mono` score in cyan
- [ ] All scores ≥70 render in `#00D2FF`, 50-70 in amber, <50 in red
- [ ] No leftover `text-accent` / `bg-accent` using old green (#10B981) except warn states
- [ ] Mobile nav works with new styling
- [ ] `npm run build` passes with no TypeScript errors
