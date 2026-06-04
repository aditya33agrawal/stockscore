import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { getAdminStats } from "@/lib/admin-stats";
import { AdminDashboard } from "@/components/admin/AdminDashboard";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin — Overview" };

export default async function AdminOverviewPage() {
  const user = await requireAdmin();
  if (!user) notFound();

  const stats = await getAdminStats();

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-chalk-50">Overview</h1>
        <p className="mt-2 text-sm text-chalk-300/60">
          Data coverage, freshness, and the most recent refresh run at a glance.
        </p>
      </header>
      <AdminDashboard stats={stats} />
    </div>
  );
}
