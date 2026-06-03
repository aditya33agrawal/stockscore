export default function ProfileLoading() {
  return (
    <div className="mx-auto max-w-2xl px-4 sm:px-6 py-10 sm:py-14 space-y-6">
      <div>
        <div className="skeleton h-3 w-20 rounded mb-3" />
        <div className="skeleton h-10 w-48 rounded-xl mb-2" />
        <div className="skeleton h-4 w-72 rounded" />
      </div>

      <div className="border border-[rgb(var(--chalk-100)_/_0.06)] rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="skeleton h-14 w-14 rounded-full" />
          <div className="space-y-2 flex-1">
            <div className="skeleton h-4 w-40 rounded" />
            <div className="skeleton h-3 w-56 rounded" />
          </div>
        </div>
      </div>

      <div className="border border-[rgb(var(--chalk-100)_/_0.06)] rounded-2xl p-6 space-y-4">
        <div className="skeleton h-5 w-44 rounded" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="skeleton h-3 w-32 rounded" />
            <div className="skeleton h-10 w-full rounded-xl" />
          </div>
        ))}
        <div className="skeleton h-10 w-full rounded-xl" />
      </div>
    </div>
  );
}
