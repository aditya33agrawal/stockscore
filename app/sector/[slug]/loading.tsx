/* Sector page loading skeleton */
export default function SectorLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      {/* Top progress bar */}
      <div className="page-loader-bar" />

      {/* Back link */}
      <div className="skeleton h-4 w-28 rounded mb-8" />

      {/* Header */}
      <header className="flex flex-wrap items-start justify-between gap-6 mb-10">
        <div className="space-y-3">
          <div className="skeleton h-2.5 w-28 rounded" />
          <div className="skeleton h-10 w-72 rounded-xl" />
          <div className="skeleton h-4 w-[420px] max-w-full rounded" />
          <div className="flex gap-5">
            <div className="skeleton h-3 w-28 rounded" />
            <div className="skeleton h-3 w-36 rounded" />
          </div>
        </div>
        <div className="skeleton h-9 w-32 rounded-xl" />
      </header>

      {/* Sector medians */}
      <section className="mb-8">
        <div className="skeleton h-2.5 w-32 rounded mb-4" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="border border-[rgba(255,255,255,0.06)] rounded-2xl p-4 space-y-2">
              <div className="skeleton h-2.5 w-20 rounded" />
              <div className="skeleton h-7 w-16 rounded" />
            </div>
          ))}
        </div>
      </section>

      {/* Leaderboard */}
      <section className="mb-8">
        <div className="skeleton h-2.5 w-24 rounded mb-4" />
        <div className="border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          {/* Header row */}
          <div className="flex items-center gap-4 px-4 py-3 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(0,210,255,0.02)]">
            <div className="skeleton h-2.5 w-4 rounded" />
            <div className="skeleton h-2.5 flex-1 rounded" />
            <div className="skeleton h-2.5 w-14 rounded" />
            {[0, 1, 2, 3, 4].map(i => <div key={i} className="skeleton h-2.5 w-10 rounded" />)}
          </div>
          {/* Data rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-[rgba(255,255,255,0.03)]">
              <div className="skeleton h-3.5 w-4 rounded" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3.5 w-36 rounded" />
                <div className="skeleton h-2.5 w-24 rounded" />
              </div>
              <div className="flex items-center gap-2">
                <div className="skeleton h-1 w-14 rounded-full" />
                <div className="skeleton h-3.5 w-10 rounded" />
              </div>
              {[0, 1, 2, 3, 4].map(j => <div key={j} className="skeleton h-3 w-8 rounded" />)}
            </div>
          ))}
        </div>
      </section>

      {/* Charts */}
      <section className="mb-8 grid gap-5 lg:grid-cols-2">
        <div className="border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 h-[460px] flex flex-col gap-4">
          <div className="skeleton h-4 w-48 rounded" />
          <div className="flex gap-2">
            {[0, 1, 2].map(i => <div key={i} className="skeleton h-7 w-20 rounded-lg" />)}
          </div>
          <div className="skeleton flex-1 rounded-xl" />
        </div>
        <div className="border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 h-[460px] flex flex-col gap-4">
          <div className="skeleton h-4 w-36 rounded" />
          <div className="skeleton flex-1 rounded-xl" />
        </div>
      </section>
    </div>
  );
}
