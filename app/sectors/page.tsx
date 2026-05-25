import Link from "next/link";
import { BarChart2 } from "lucide-react";
import { loadSectorIndex, loadSectorsConfig, loadCompaniesIndex } from "@/lib/data";
import { SectorsBrowser } from "@/components/SectorsBrowser";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "All Sectors",
  description: "Browse all sectors and search by stock or sector name.",
};

export default async function SectorsPage() {
  const [sectorsConfig, scrapedIndex, companies] = await Promise.all([
    loadSectorsConfig(),
    loadSectorIndex(),
    loadCompaniesIndex(),
  ]);

  const scrapedMap = new Map(scrapedIndex.map((s) => [s.slug, s]));
  const sectors = sectorsConfig.map((cfg) => ({
    slug: cfg.slug,
    name: cfg.name,
    description: cfg.description,
    companies_count: scrapedMap.get(cfg.slug)?.companies_count ?? cfg.companies.length,
    top_company: scrapedMap.get(cfg.slug)?.top_company,
    top_ticker: scrapedMap.get(cfg.slug)?.top_ticker,
    top_score: scrapedMap.get(cfg.slug)?.top_score,
    has_data: scrapedMap.has(cfg.slug),
  }));

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          All Sectors
        </p>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-chalk-50">
            Browse every sector & stock
          </h1>
          <Link
            href="/sectors/compare"
            className="inline-flex items-center gap-1.5 rounded-md border border-ink-700/60 bg-ink-900 px-3 py-1.5 text-sm text-chalk-100 hover:bg-ink-800 transition-colors shrink-0"
          >
            <BarChart2 className="h-3.5 w-3.5" />
            Compare all sectors
          </Link>
        </div>
        <p className="mt-3 text-chalk-300">
          {sectors.length} sectors · {companies.length} companies scored.
        </p>
      </header>

      <SectorsBrowser sectors={sectors} companies={companies} />
    </div>
  );
}
