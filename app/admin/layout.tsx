import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin";
import { AdminTabs } from "@/components/admin/AdminTabs";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Defence in depth — every /admin route also re-checks in its own page.
  const user = await requireAdmin();
  if (!user) notFound();

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent mb-2">Admin</p>
      <AdminTabs />
      <div className="mt-8">{children}</div>
    </div>
  );
}
