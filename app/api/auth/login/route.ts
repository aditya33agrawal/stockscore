import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { ensureTables } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  await ensureTables();
  const body = await req.json().catch(() => null);
  const email = (body?.email ?? "").toString().trim().toLowerCase();
  const password = (body?.password ?? "").toString();

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }

  const rows = await sql<
    { id: number; email: string; name: string | null; password_hash: string }[]
  >`SELECT id, email, name, password_hash FROM users WHERE email = ${email} LIMIT 1`;

  if (rows.length === 0) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  const ok = await verifyPassword(password, rows[0].password_hash);
  if (!ok) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });
  }

  await createSession(rows[0].id);
  return NextResponse.json({
    ok: true,
    user: { id: rows[0].id, email: rows[0].email, name: rows[0].name },
  });
}
