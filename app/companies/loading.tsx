export default function CompaniesLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 py-10 sm:py-14">
      <div className="skeleton h-3 w-20 rounded mb-6" />
      <div className="skeleton h-3 w-24 rounded mb-3" />
      <div className="skeleton h-10 w-72 rounded-xl mb-3" />
      <div className="skeleton h-4 w-96 rounded mb-8" />
      <div className="skeleton h-10 w-64 rounded-lg mb-5" />
      <div className="skeleton h-[520px] w-full rounded-xl" />
    </div>
  );
}
