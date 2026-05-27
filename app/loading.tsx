/* Home page loading skeleton */
export default function HomeLoading() {
  return (
    <div>
      {/* Top progress bar */}
      <div className="page-loader-bar" />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 hero-grid" />
        <div className="relative mx-auto max-w-4xl px-4 sm:px-6 pt-20 sm:pt-32 pb-16 sm:pb-24 text-center">
          <div className="skeleton h-7 w-44 rounded-full mx-auto mb-8" />
          <div className="skeleton h-14 w-3/4 rounded-2xl mx-auto mb-4" />
          <div className="skeleton h-10 w-1/2 rounded-xl mx-auto mb-10" />
          <div className="skeleton h-14 max-w-xl rounded-2xl mx-auto" />
          {/* Stats strip */}
          <div className="mt-10 inline-flex items-center gap-12 border border-[rgba(255,255,255,0.06)] rounded-2xl px-12 py-5">
            {[80, 80, 100].map((w, i) => (
              <div key={i} className="text-center">
                <div className={`skeleton h-8 w-${w === 80 ? '10' : '14'} rounded-lg mx-auto mb-2`} />
                <div className="skeleton h-3 w-16 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="skeleton h-3 w-28 rounded mb-3" />
        <div className="skeleton h-8 w-64 rounded-lg mb-10" />
        <div className="grid gap-5 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border border-[rgba(255,255,255,0.06)] rounded-2xl p-6">
              <div className="skeleton h-10 w-10 rounded-xl mb-4" />
              <div className="skeleton h-5 w-28 rounded mb-3" />
              <div className="space-y-2">
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-4/5 rounded" />
                <div className="skeleton h-3 w-3/5 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Sectors grid */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 pb-20">
        <div className="mb-8">
          <div className="skeleton h-3 w-24 rounded mb-2" />
          <div className="skeleton h-8 w-56 rounded-lg" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="border border-[rgba(255,255,255,0.06)] rounded-2xl p-6 space-y-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="skeleton h-2.5 w-20 rounded" />
                  <div className="skeleton h-5 w-36 rounded" />
                </div>
                <div className="skeleton h-8 w-12 rounded-lg" />
              </div>
              <div className="skeleton h-0.5 w-full rounded-full" />
              <div className="space-y-1.5">
                <div className="skeleton h-3 w-full rounded" />
                <div className="skeleton h-3 w-4/5 rounded" />
              </div>
              <div className="pt-2 border-t border-[rgba(255,255,255,0.04)] flex justify-between">
                <div className="skeleton h-3 w-14 rounded" />
                <div className="skeleton h-3 w-20 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
