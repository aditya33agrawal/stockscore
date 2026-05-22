import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-6 py-24 text-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-accent">
        404
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-chalk-50">
        Page not found
      </h1>
      <p className="mt-3 text-chalk-300">
        That sector or company isn't in the dataset yet.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex rounded-lg bg-accent text-ink-950 px-4 py-2 text-sm font-semibold hover:bg-accent/90"
      >
        Back to all sectors
      </Link>
    </div>
  );
}
