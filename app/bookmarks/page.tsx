import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Bookmark } from "lucide-react";
import sql from "@/lib/db";
import { ensureTables } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "My Bookmarks" };

interface BookmarkRow {
  sector_slug: string;
  company_slug: string;
  company_ticker: string | null;
  company_name: string | null;
  created_at: string;
}

function prettySector(slug: string): string {
  return slug
    .split("-")
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(" ");
}

export default async function BookmarksPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await ensureTables();
  const rows = await sql<BookmarkRow[]>`
    SELECT sector_slug, company_slug, company_ticker, company_name, created_at
    FROM bookmarks
    WHERE user_id = ${user.id}
    ORDER BY sector_slug ASC, company_name ASC, created_at DESC
  `;

  const grouped = new Map<string, BookmarkRow[]>();
  for (const r of rows) {
    const list = grouped.get(r.sector_slug) ?? [];
    list.push(r);
    grouped.set(r.sector_slug, list);
  }
  const sectors = Array.from(grouped.keys()).sort((a, b) => a.localeCompare(b));

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <header className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent mb-2">My Bookmarks</p>
        <h1 className="text-3xl font-bold tracking-tight text-chalk-50">
          Saved companies
        </h1>
        <p className="mt-2 text-sm text-chalk-300/60">
          Signed in as {user.name ?? user.email}.
          {rows.length > 0 && (
            <> · {rows.length} saved across {sectors.length} sector{sectors.length === 1 ? "" : "s"}.</>
          )}
        </p>
      </header>

      {rows.length === 0 ? (
        <div className="glass border-subtle rounded-2xl p-10 text-center">
          <Bookmark className="h-8 w-8 mx-auto text-chalk-300/30 mb-3" />
          <p className="text-chalk-300/70 mb-1">No bookmarks yet</p>
          <p className="text-xs text-chalk-300/40 mb-5">
            Open a company page and hit the bookmark button to save it here.
          </p>
          <Link
            href="/sectors"
            className="inline-flex items-center gap-1.5 rounded-xl border border-accent/25 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent hover:bg-accent/15 transition-all"
          >
            Browse sectors <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="space-y-8">
          {sectors.map((slug) => {
            const items = grouped.get(slug) ?? [];
            return (
              <section key={slug}>
                <div className="flex items-baseline justify-between mb-3">
                  <Link
                    href={`/sector/${slug}`}
                    className="text-xs font-semibold uppercase tracking-[0.12em] text-chalk-300/70 hover:text-accent transition-colors"
                  >
                    {prettySector(slug)}
                  </Link>
                  <span className="text-[11px] text-chalk-300/40 num">
                    {items.length} compan{items.length === 1 ? "y" : "ies"}
                  </span>
                </div>
                <ul className="space-y-2">
                  {items.map((b) => (
                    <li key={`${b.sector_slug}/${b.company_slug}`}>
                      <Link
                        href={`/sector/${b.sector_slug}/${b.company_slug}`}
                        className="glass border-subtle rounded-2xl px-5 py-4 flex items-center justify-between hover:border-[rgba(0,210,255,0.2)] transition-all"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-chalk-50 truncate">
                            {b.company_name ?? b.company_slug}
                          </p>
                          {b.company_ticker && (
                            <p className="text-xs text-chalk-300/50 num mt-0.5">
                              {b.company_ticker}
                            </p>
                          )}
                        </div>
                        <ArrowRight className="h-4 w-4 text-chalk-300/40 shrink-0" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
