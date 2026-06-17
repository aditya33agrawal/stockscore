import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { AdminTabs } from "@/components/admin/AdminTabs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const result = await requireAdmin();

  if (!result.ok) {
    if (result.reason === "db_error") {
      return (
        <div className="mx-auto max-w-5xl px-6 py-24 text-center">
          <p className="text-chalk-300 text-sm mb-2">Database unavailable</p>
          <p className="text-chalk-300/60 text-xs">{result.message}</p>
          <p className="text-chalk-300/50 text-xs mt-4">Refresh to retry - Supabase may be waking up.</p>
        </div>
      );
    }
    notFound();
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent mb-2">Admin</p>
      <AdminTabs />
      <div className="mt-8">{children}</div>
    </div>
  );
}
