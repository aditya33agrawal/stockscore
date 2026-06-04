import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { loadSectorsConfig } from "@/lib/data";
import { RefreshConsole } from "@/components/admin/RefreshConsole";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin — Refresh" };

export default async function AdminRefreshPage() {
  const user = await requireAdmin();
  if (!user) notFound();

  const sectors = await loadSectorsConfig();

  return (
    <div>
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-chalk-50">Refresh Console</h1>
        <p className="mt-2 text-sm text-chalk-300/60">
          Trigger data refresh pipelines. Runs are streamed live and errors are persisted for review.
        </p>
      </header>
      <RefreshConsole sectors={sectors} />
    </div>
  );
}
