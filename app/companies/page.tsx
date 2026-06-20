import "server-only";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { loadCompaniesIndex, scoreTier } from "@/lib/data";
import { CompaniesExplorer } from "@/components/CompaniesExplorer";

// Data only changes on the weekly refresh pipeline - cache the rendered page
// and revalidate hourly instead of re-querying Postgres on every request.
export const revalidate = 3600;

export const metadata = {
  title: "All Scored Companies",
  description: "Every company we've scored, ranked by final Stockscore, across all sectors.",
};

export default async function CompaniesPage() {
  const companies = await loadCompaniesIndex();
  const rows = companies
    .map((c) => ({ ...c, tier: scoreTier(c.final_score) }))
    .sort((a, b) => b.final_score - a.final_score);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-chalk-300 hover:text-chalk-50 mb-6"
      >
        <ArrowLeft className="h-4 w-4" /> Home
      </Link>

      <header className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">All Companies</p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-chalk-50">
          {rows.length} scored companies
        </h1>
        <p className="mt-3 text-chalk-300 max-w-2xl">
          Every company we've scored, ranked by final score. Search, sort, or filter by tier - click
          any row for the full breakdown.
        </p>
      </header>

      <CompaniesExplorer rows={rows} />
    </div>
  );
}
