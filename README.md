# Aditya Agrawal — Sector-Relative Equity Scoring (Website)

A fully static Next.js portfolio site that surfaces the sector-scoring engine
from `../scoring-system/`. Live data is committed as JSON under
`public/data/`; the UI reads it at build time and renders sector dashboards
plus per-company score breakdowns.

## Local development

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # static export of all sector + company pages
```

## Adding or refreshing a sector

1. Run the Python pipeline:
   ```bash
   cd ..
   python data-scraping/main.py
   python scoring-system/sector_score.py --sector "Cement" --companies ULTRACEMCO SHREECEM ...
   ```
2. In your scoring script, call:
   ```python
   from scoring_system.sector.web_export import export_sector, refresh_index
   export_sector(
       slug="cement",
       name="Cement",
       description="...",
       analyst_note="...",
       company_scores=scored,
       sector_stats=stats,
       out_dir="website/public/data/sectors",
   )
   refresh_index(
       "website/public/data/sectors",
       "website/public/data/sectors.json",
   )
   ```
3. Commit the regenerated JSON and push — Vercel redeploys automatically.

## Project structure

```
app/                  Next.js App Router pages
components/           Shared client + server components
lib/
  types.ts            Shared TypeScript shape for sector / company JSON
  data.ts             Server-only filesystem loaders
  format.ts           Pure helpers (safe in client components)
public/
  data/sectors.json   Sector index
  data/sectors/*.json One JSON per sector — the source of truth for the UI
  Aditya_Agrawal_Resume.pdf
```

## Notes on the sample data

`oil-refining.json` is built from a real scored report. The other four
sectors (`it-services`, `private-banks`, `fmcg`, `cement`) ship with
realistic placeholder numbers so the UI can be reviewed end-to-end. Replace
them with output from `web_export.py` once the live pipeline runs.
