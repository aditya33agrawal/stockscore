export default function SectorsLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="skeleton h-3 w-20 rounded mb-3" />
      <div className="skeleton h-10 w-72 rounded-xl mb-3" />
      <div className="skeleton h-4 w-96 rounded mb-8" />

      <div className="flex flex-wrap gap-2 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-8 w-24 rounded-full" />
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
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
    </div>
  );
}
