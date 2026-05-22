export default function CompanyLoading() {
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Back link */}
      <div className="h-4 w-32 rounded bg-ink-800 animate-pulse mb-6" />

      {/* Header card */}
      <div className="rounded-2xl border border-ink-700/60 bg-ink-900/40 p-6 mb-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3 min-w-0">
            <div className="h-3 w-48 rounded bg-ink-800 animate-pulse" />
            <div className="h-10 w-72 rounded-lg bg-ink-800 animate-pulse" />
            <div className="flex gap-4">
              <div className="h-4 w-20 rounded bg-ink-800 animate-pulse" />
              <div className="h-4 w-24 rounded bg-ink-800 animate-pulse" />
              <div className="h-4 w-16 rounded bg-ink-800 animate-pulse" />
            </div>
          </div>
          <div className="h-20 w-20 rounded-full bg-ink-800 animate-pulse" />
        </div>
        <div className="mt-5 h-8 w-36 rounded-lg bg-ink-800 animate-pulse" />
      </div>

      {/* Score breakdown */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-4">
          <div className="h-3 w-32 rounded bg-ink-800 animate-pulse" />
          <div className="h-3 w-40 rounded bg-ink-800 animate-pulse" />
        </div>
        <div className="grid gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-ink-700/60 bg-ink-900/40 px-5 py-4 flex items-center justify-between gap-4">
              <div className="h-4 w-40 rounded bg-ink-800 animate-pulse" />
              <div className="flex-1 mx-4 h-2 rounded-full bg-ink-800 animate-pulse" />
              <div className="h-4 w-12 rounded bg-ink-800 animate-pulse" />
            </div>
          ))}
        </div>
      </section>

      {/* Strengths / Weaknesses */}
      <section className="mb-10 grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-accent/20 bg-accent/5 p-5 space-y-3">
          <div className="h-4 w-28 rounded bg-ink-800 animate-pulse" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="h-3 flex-1 rounded bg-ink-800 animate-pulse" />
              <div className="h-3 w-8 rounded bg-ink-800 animate-pulse" />
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-bad/20 bg-bad/5 p-5 space-y-3">
          <div className="h-4 w-20 rounded bg-ink-800 animate-pulse" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between gap-3">
              <div className="h-3 flex-1 rounded bg-ink-800 animate-pulse" />
              <div className="h-3 w-8 rounded bg-ink-800 animate-pulse" />
            </div>
          ))}
        </div>
      </section>

      {/* Financial charts placeholder */}
      <section className="mb-10">
        <div className="h-3 w-32 rounded bg-ink-800 animate-pulse mb-4" />
        <div className="rounded-xl border border-ink-700/60 bg-ink-900/40 h-80 animate-pulse" />
      </section>

      {/* Financial tables placeholder */}
      <section className="mb-10">
        <div className="h-3 w-32 rounded bg-ink-800 animate-pulse mb-4" />
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border border-ink-700/60 bg-ink-900/40 h-12 animate-pulse" />
          ))}
        </div>
      </section>
    </div>
  );
}
