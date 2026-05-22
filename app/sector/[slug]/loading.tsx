export default function SectorLoading() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Back link */}
      <div className="h-4 w-24 rounded bg-ink-800 animate-pulse mb-6" />

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-6 mb-8">
        <div className="space-y-3">
          <div className="h-10 w-64 rounded-lg bg-ink-800 animate-pulse" />
          <div className="h-4 w-96 rounded bg-ink-800 animate-pulse" />
          <div className="flex gap-4">
            <div className="h-3 w-24 rounded bg-ink-800 animate-pulse" />
            <div className="h-3 w-32 rounded bg-ink-800 animate-pulse" />
          </div>
        </div>
        <div className="h-9 w-28 rounded-lg bg-ink-800 animate-pulse" />
      </div>

      {/* Sector medians box */}
      <div className="mb-8 rounded-xl border border-ink-700/60 bg-ink-900/40 p-5">
        <div className="h-3 w-28 rounded bg-ink-800 animate-pulse mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <div className="h-3 w-20 rounded bg-ink-800 animate-pulse" />
              <div className="h-7 w-16 rounded bg-ink-800 animate-pulse" />
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard */}
      <section className="mb-8">
        <div className="h-3 w-24 rounded bg-ink-800 animate-pulse mb-4" />
        <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 overflow-hidden">
          <div className="h-10 bg-ink-800/50 animate-pulse" />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3.5 border-t border-ink-700/40">
              <div className="h-4 w-6 rounded bg-ink-800 animate-pulse" />
              <div className="h-4 flex-1 rounded bg-ink-800 animate-pulse" />
              <div className="h-4 w-12 rounded bg-ink-800 animate-pulse" />
              <div className="h-4 w-12 rounded bg-ink-800 animate-pulse" />
              <div className="h-4 w-12 rounded bg-ink-800 animate-pulse" />
            </div>
          ))}
        </div>
      </section>

      {/* Charts */}
      <section className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5 h-72 animate-pulse" />
        <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 p-5 h-72 animate-pulse" />
      </section>
    </div>
  );
}
