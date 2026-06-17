import { getAdminStats } from "@/lib/admin-stats";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin - Overview" };

export default async function AdminOverviewPage() {
  const stats = await getAdminStats();

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-chalk-50">Overview</h1>
        <p className="mt-2 text-sm text-chalk-300/60">
          Data coverage, freshness, and the most recent refresh run at a glance.
        </p>
      </header>
      {stats.error && (
        <div className="mb-6 rounded-xl border border-bad/30 bg-bad/10 px-4 py-3 text-sm text-bad">
          DB unavailable - {stats.error}. Retry in a moment.
        </div>
      )}
      <AdminDashboard stats={stats} />
    </div>
  );
}
