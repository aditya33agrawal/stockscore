/* Company detail page loading skeleton */
export default function CompanyLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 py-10">
      {/* Top progress bar */}
      <div className="page-loader-bar" />

      {/* Back link */}
      <div className="skeleton h-4 w-36 rounded mb-8" />

      {/* Company header card */}
      <div className="border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 sm:p-8 mb-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="space-y-3 flex-1 min-w-0">
            <div className="skeleton h-2.5 w-48 rounded" />
            <div className="skeleton h-10 w-72 rounded-xl" />
            <div className="flex flex-wrap gap-3">
              <div className="skeleton h-4 w-20 rounded" />
              <div className="skeleton h-4 w-28 rounded" />
              <div className="skeleton h-4 w-16 rounded" />
              <div className="skeleton h-6 w-24 rounded-md" />
            </div>
          </div>
          {/* Score */}
          <div className="flex flex-col items-center gap-2">
            <div className="skeleton h-16 w-20 rounded-xl" />
            <div className="skeleton h-2.5 w-16 rounded" />
            <div className="skeleton h-6 w-24 rounded-md" />
          </div>
        </div>
        <div className="mt-5">
          <div className="skeleton h-8 w-36 rounded-xl" />
        </div>
      </div>

      {/* Score breakdown */}
      <section className="mb-10">
        <div className="flex items-baseline justify-between mb-5">
          <div className="space-y-2">
            <div className="skeleton h-2.5 w-32 rounded" />
            <div className="skeleton h-6 w-56 rounded" />
          </div>
          <div className="skeleton h-3 w-24 rounded" />
        </div>
        <div className="grid gap-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="border border-[rgba(255,255,255,0.06)] rounded-2xl px-6 py-4">
              <div className="flex items-baseline justify-between mb-1.5">
                <div className="skeleton h-4 w-36 rounded" />
                <div className="skeleton h-3.5 w-14 rounded" />
              </div>
              <div className="skeleton h-2.5 w-64 rounded mb-3" />
              <div className="skeleton h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </section>

      {/* Strengths / Weaknesses */}
      <section className="mb-10 grid gap-4 md:grid-cols-2">
        {[
          "border-emerald-500/15 bg-emerald-500/[0.03]",
          "border-red-500/15 bg-red-500/[0.03]",
        ].map((cls, i) => (
          <div key={i} className={`border rounded-2xl p-5 space-y-3 ${cls}`}>
            <div className="skeleton h-5 w-32 rounded" />
            {[0, 1, 2, 3].map((j) => (
              <div key={j} className="flex items-center justify-between gap-3">
                <div className="skeleton h-3 flex-1 rounded" />
                <div className="skeleton h-3 w-8 rounded" />
              </div>
            ))}
          </div>
        ))}
      </section>

      {/* Financials at a glance */}
      <section className="mb-10">
        <div className="skeleton h-2.5 w-40 rounded mb-4" />
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-[rgba(255,255,255,0.06)] rounded-2xl p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="skeleton h-2.5 w-28 rounded" />
                  <div className="skeleton h-7 w-20 rounded" />
                </div>
                <div className="skeleton h-6 w-20 rounded-md" />
              </div>
              <div className="skeleton h-3 w-full rounded" />
              <div className="skeleton h-[100px] w-full rounded-xl" />
            </div>
          ))}
        </div>
      </section>

      {/* Peer comparison */}
      <section className="mb-10">
        <div className="skeleton h-2.5 w-36 rounded mb-4" />
        <div className="border border-[rgba(255,255,255,0.06)] rounded-2xl overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-3 border-b border-[rgba(255,255,255,0.05)] bg-[rgba(0,210,255,0.02)]">
            {[160, 60, 60, 70, 50, 60, 60, 55, 50, 55, 50].map((w, i) => (
              <div key={i} className={`skeleton h-2.5 rounded`} style={{ width: `${w}px`, flexShrink: 0 }} />
            ))}
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-4 py-3 border-b border-[rgba(255,255,255,0.03)]">
              <div className="skeleton h-4 w-[160px] rounded" style={{ flexShrink: 0 }} />
              {[60, 60, 70, 50, 60, 60, 55, 50, 55, 50].map((w, j) => (
                <div key={j} className="skeleton h-3 rounded" style={{ width: `${w}px`, flexShrink: 0 }} />
              ))}
            </div>
          ))}
        </div>
      </section>

      {/* Price chart */}
      <section className="mb-10">
        <div className="skeleton h-2.5 w-36 rounded mb-4" />
        <div className="border border-[rgba(255,255,255,0.06)] rounded-2xl h-80 skeleton" />
      </section>

      {/* Financial tables */}
      <section className="mb-10">
        <div className="skeleton h-2.5 w-36 rounded mb-4" />
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="border border-[rgba(255,255,255,0.06)] rounded-2xl flex items-center justify-between px-5 py-4">
              <div className="skeleton h-4 w-36 rounded" />
              <div className="skeleton h-4 w-4 rounded" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
