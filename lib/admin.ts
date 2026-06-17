import "server-only";
import { getCurrentUser } from "@/lib/auth";

export function isAdminEmail(email: string | undefined | null): boolean {
  const allow = (process.env.ADMIN_EMAIL ?? "")
    .split(",")
    // strip accidental surrounding quotes (a common Vercel env var paste error)
    // and whitespace before lower-casing for comparison
    .map((s) => s.trim().replace(/^["']|["']$/g, "").trim().toLowerCase())
    .filter(Boolean);
  return !!email && allow.includes(email.toLowerCase());
}

export type RequireAdminResult =
  | { ok: true; user: Awaited<ReturnType<typeof getCurrentUser>> & object }
  | { ok: false; reason: "unauthorized" | "db_error"; message: string };

export async function requireAdmin(): Promise<RequireAdminResult> {
  try {
    const user = await getCurrentUser();
    if (!user || !isAdminEmail(user.email)) {
      return { ok: false, reason: "unauthorized", message: "Not authorized" };
    }
    return { ok: true, user };
  } catch (err) {
    return {
      ok: false,
      reason: "db_error",
      message: err instanceof Error ? err.message : "Database unavailable",
    };
  }
}
