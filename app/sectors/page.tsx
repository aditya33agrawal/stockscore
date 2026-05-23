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
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-chalk-50">
          Browse every sector & stock
        </h1>
        <p className="mt-3 text-chalk-300">
          {sectors.length} sectors · {companies.length} companies scored.
        </p>
      </header>

      <SectorsBrowser sectors={sectors} companies={companies} />
    </div>
  );
}
