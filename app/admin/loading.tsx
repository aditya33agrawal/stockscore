export default function AdminOverviewLoading() {
  return (
    <div>
      <div className="skeleton h-8 w-40 rounded mb-2" />
      <div className="skeleton h-4 w-96 rounded mb-8" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-24 rounded-xl" />
        ))}
      </div>
      <div className="skeleton h-64 w-full rounded-xl mt-6" />
    </div>
  );
}
