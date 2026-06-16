import { RunHistory } from "@/components/admin/RunHistory";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin - Run History" };

export default async function AdminRunsPage() {

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-chalk-50">Run History</h1>
        <p className="mt-2 text-sm text-chalk-300/60">
          Every refresh run, its per-phase durations, and any persisted errors.
        </p>
      </header>
      <RunHistory />
    </div>
  );
}
