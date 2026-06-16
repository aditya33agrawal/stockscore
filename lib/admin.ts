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

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}
