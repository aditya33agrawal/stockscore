export default function WatchlistLoading() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <div className="skeleton h-3 w-24 rounded mb-3" />
      <div className="skeleton h-10 w-64 rounded-xl mb-3" />
      <div className="skeleton h-4 w-80 rounded mb-8" />

      <div className="skeleton h-12 w-full rounded-2xl mb-8" />

      {Array.from({ length: 2 }).map((_, g) => (
        <div key={g} className="mb-8">
          <div className="skeleton h-5 w-40 rounded mb-4" />
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="border border-[rgb(var(--chalk-100)_/_0.06)] rounded-2xl p-4 flex items-center justify-between">
                <div className="space-y-2 flex-1">
                  <div className="skeleton h-4 w-36 rounded" />
                  <div className="skeleton h-3 w-24 rounded" />
                </div>
                <div className="skeleton h-8 w-16 rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
