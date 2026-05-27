import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import sql from "@/lib/db";
import { ensureTables } from "@/lib/db";
import { getCurrentUser, hashPassword, verifyPassword, createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await ensureTables();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const currentPassword = (body?.currentPassword ?? "").toString();
  const newPassword = (body?.newPassword ?? "").toString();

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Current and new password required" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }
  if (currentPassword === newPassword) {
    return NextResponse.json({ error: "New password must be different" }, { status: 400 });
  }

  const rows = await sql<{ password_hash: string }[]>`
    SELECT password_hash FROM users WHERE id = ${user.id} LIMIT 1
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  const ok = await verifyPassword(currentPassword, rows[0].password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 401 });
  }

  const hash = await hashPassword(newPassword);
  // Invalidate all other sessions, then create a fresh one for this browser.
  const currentToken = cookies().get("ss_session")?.value;
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${user.id}`;
  if (currentToken) {
    await sql`DELETE FROM sessions WHERE user_id = ${user.id} AND token <> ${currentToken}`;
  } else {
    await sql`DELETE FROM sessions WHERE user_id = ${user.id}`;
    await createSession(user.id);
  }

  return NextResponse.json({ ok: true });
}
