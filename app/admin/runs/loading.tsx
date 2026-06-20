export default function AdminRunsLoading() {
  return (
    <div>
      <div className="skeleton h-8 w-48 rounded mb-2" />
      <div className="skeleton h-4 w-96 rounded mb-8" />
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="skeleton h-16 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
