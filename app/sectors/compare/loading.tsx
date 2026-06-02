export default function CompareLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 py-10">
      <div className="skeleton h-3 w-20 rounded mb-3" />
      <div className="skeleton h-10 w-64 rounded-xl mb-3" />
      <div className="skeleton h-4 w-80 rounded mb-8" />
      <div className="skeleton h-[480px] w-full rounded-2xl" />
    </div>
  );
}
