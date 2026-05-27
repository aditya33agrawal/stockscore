import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { ensureTables } from "@/lib/db";
import { hashPassword, createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await ensureTables();
  const body = await req.json().catch(() => null);
  const email = (body?.email ?? "").toString().trim().toLowerCase();
  const newPassword = (body?.newPassword ?? "").toString();

  if (!email || !newPassword) {
    return NextResponse.json({ error: "Email and new password required" }, { status: 400 });
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const rows = await sql<{ id: number }[]>`
    SELECT id FROM users WHERE email = ${email} LIMIT 1
  `;
  if (rows.length === 0) {
    return NextResponse.json({ error: "No account found with that email" }, { status: 404 });
  }

  const hash = await hashPassword(newPassword);
  const userId = rows[0].id;
  await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${userId}`;
  await sql`DELETE FROM sessions WHERE user_id = ${userId}`;
  await createSession(userId);

  return NextResponse.json({ ok: true });
}
