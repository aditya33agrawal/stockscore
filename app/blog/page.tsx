import Link from "next/link";
import { ArrowRight, ExternalLink, BookOpen } from "lucide-react";
import { promises as fs } from "fs";
import path from "path";

interface Post {
  title: string;
  date: string;
  excerpt: string;
}

interface SubstackData {
  profileUrl: string;
  handle: string;
  posts: Post[];
}

export const metadata = {
  title: "Blog & Writing",
  description: "Essays and short reflections on investing, markets, and life.",
};

async function loadSubstack(): Promise<SubstackData> {
  const raw = await fs.readFile(
    path.join(process.cwd(), "data", "substack-posts.json"),
    "utf8",
  );
  return JSON.parse(raw);
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function BlogIndex() {
  const sub = await loadSubstack();

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 py-10 sm:py-14">
      <header className="mb-10">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">
          Writing
        </p>
        <h1 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-chalk-50">
          Blogs & thinking notes
        </h1>
        <p className="mt-3 text-chalk-300 max-w-2xl">
          Long-form blogs here, plus shorter reflections from my Substack
          journal on investing philosophy & behaviour.
        </p>
      </header>

      {/* FEATURED ESSAY */}
      <section className="mb-12">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-accent mb-3">
          Featured blog
        </h2>
        <Link
          href="/blog/mean-reversion-of-everything"
          className="block rounded-2xl border border-ink-700/60 bg-ink-900/40 hover:border-accent/40 hover:bg-ink-900 transition-colors p-6"
        >
          <div className="flex items-start gap-3">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent ring-1 ring-accent/30 shrink-0">
              <BookOpen className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h3 className="text-xl font-semibold text-chalk-50">
                The Mean Reversion of Everything
              </h3>
              <p className="mt-2 text-sm text-chalk-300 serif leading-relaxed">
                What a stock chart taught me about life, careers, and why
                carpenters will outlast software engineers.
              </p>
              <span className="mt-3 inline-flex items-center text-xs text-accent">
                Read essay <ArrowRight className="h-3 w-3 ml-1" />
              </span>
            </div>
          </div>
        </Link>
      </section>

      {/* SUBSTACK POSTS */}
      <section>
        <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-accent">
            From my Substack
          </h2>
          <a
            href={sub.profileUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 text-xs text-chalk-300 hover:text-accent"
          >
            Follow {sub.handle} <ExternalLink className="h-3 w-3" />
          </a>
        </div>
        <ul className="space-y-3">
          {sub.posts.map((p, i) => (
            <li
              key={i}
              className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5"
            >
              <div className="flex items-baseline justify-between gap-4 flex-wrap">
                <h3 className="text-base font-semibold text-chalk-50">
                  {p.title}
                </h3>
                <span className="text-xs text-chalk-300/60 num shrink-0">
                  {formatDate(p.date)}
                </span>
              </div>
              <p className="mt-2 text-sm text-chalk-300 serif leading-relaxed">
                {p.excerpt}
              </p>
            </li>
          ))}
        </ul>
        <p className="mt-6 text-xs text-chalk-300/60">
          These short notes are a public journal — process over predictions, no
          recommendations.
        </p>
      </section>
    </div>
  );
}
