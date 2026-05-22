export default function HomeLoading() {
  return (
    <div>
      {/* HERO skeleton */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-grid" />
        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 pt-14 sm:pt-24 pb-12 sm:pb-20 text-center">
          <div className="inline-block h-6 w-40 rounded-full bg-ink-800 animate-pulse mx-auto" />
          <div className="mt-6 mx-auto h-14 w-3/4 rounded-xl bg-ink-800 animate-pulse" />
          <div className="mt-3 mx-auto h-5 w-1/2 rounded-lg bg-ink-800 animate-pulse" />
          <div className="mt-10 mx-auto h-12 max-w-lg rounded-xl bg-ink-800 animate-pulse" />
        </div>
      </section>

      {/* HOW IT WORKS skeleton */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-16">
        <div className="h-4 w-24 rounded bg-ink-800 animate-pulse mb-6" />
        <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-6">
              <div className="h-10 w-10 rounded-lg bg-ink-800 animate-pulse" />
              <div className="mt-4 h-5 w-32 rounded bg-ink-800 animate-pulse" />
              <div className="mt-3 space-y-2">
                <div className="h-3 w-full rounded bg-ink-800 animate-pulse" />
                <div className="h-3 w-4/5 rounded bg-ink-800 animate-pulse" />
                <div className="h-3 w-3/5 rounded bg-ink-800 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTORS GRID skeleton */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 py-10 sm:py-12">
        <div className="mb-6">
          <div className="h-4 w-28 rounded bg-ink-800 animate-pulse" />
          <div className="mt-2 h-8 w-48 rounded-lg bg-ink-800 animate-pulse" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5 flex flex-col gap-4">
              <div className="flex items-baseline justify-between">
                <div className="h-5 w-32 rounded bg-ink-800 animate-pulse" />
                <div className="h-3 w-6 rounded bg-ink-800 animate-pulse" />
              </div>
              <div className="space-y-1.5">
                <div className="h-3 w-full rounded bg-ink-800 animate-pulse" />
                <div className="h-3 w-4/5 rounded bg-ink-800 animate-pulse" />
              </div>
              <div className="mt-auto pt-4 border-t border-ink-700/40 flex items-center justify-between">
                <div className="h-3 w-20 rounded bg-ink-800 animate-pulse" />
                <div className="h-3 w-16 rounded bg-ink-800 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
