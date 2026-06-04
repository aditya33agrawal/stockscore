import Link from "next/link";
import { redirect } from "next/navigation";
import { Bookmark, Mail, User as UserIcon } from "lucide-react";
import sql from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { ChangePasswordForm } from "@/components/ChangePasswordForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const [{ bookmarkCount, sectorCount }] = await sql<
    { bookmarkCount: number; sectorCount: number }[]
  >`
    SELECT
      COUNT(*)::int                          AS "bookmarkCount",
      COUNT(DISTINCT sector_slug)::int       AS "sectorCount"
    FROM bookmarks WHERE user_id = ${user.id}
  `;

  const displayName = user.name?.trim() || user.email.split("@")[0];
  const initial = displayName.charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <header className="mb-8">
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-accent mb-2">Profile</p>
        <h1 className="text-3xl font-bold tracking-tight text-chalk-50">Your account</h1>
      </header>

      <div className="glass border-subtle rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-accent/25 bg-accent/10 text-accent text-xl font-semibold">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="text-lg font-semibold text-chalk-50 truncate">{displayName}</p>
            <p className="text-sm text-chalk-300/60 truncate">{user.email}</p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl border border-ink-700/50 bg-ink-900/40 px-4 py-3">
            <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-chalk-300/60">
              <UserIcon className="h-3.5 w-3.5" /> Name
            </dt>
            <dd className="mt-1 text-chalk-50 truncate">{user.name ?? "—"}</dd>
          </div>
          <div className="rounded-xl border border-ink-700/50 bg-ink-900/40 px-4 py-3">
            <dt className="flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-chalk-300/60">
              <Mail className="h-3.5 w-3.5" /> Email
            </dt>
            <dd className="mt-1 text-chalk-50 truncate">{user.email}</dd>
          </div>
        </dl>
      </div>

      <div className="mb-6">
        <ChangePasswordForm />
      </div>

      <Link
        href="/bookmarks"
        className="glass border-subtle rounded-2xl px-5 py-4 flex items-center justify-between hover:border-[rgb(var(--accent)_/_0.2)] transition-all"
      >
        <div className="flex items-center gap-3">
          <Bookmark className="h-5 w-5 text-accent" />
          <div>
            <p className="font-semibold text-chalk-50">My Bookmarks</p>
            <p className="text-xs text-chalk-300/60 mt-0.5 num">
              {bookmarkCount} saved across {sectorCount} sector{sectorCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
        <span className="text-accent text-sm">View →</span>
      </Link>
    </div>
  );
}
