import { NextRequest, NextResponse } from "next/server";
import sql from "@/lib/db";
import { ensureTables } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  await ensureTables();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const rows = await sql`
    SELECT sector_slug, company_slug, company_ticker, company_name, created_at
    FROM bookmarks
    WHERE user_id = ${user.id}
    ORDER BY created_at DESC
  `;
  return NextResponse.json({ bookmarks: rows });
}

export async function POST(req: NextRequest) {
  await ensureTables();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const sectorSlug = body?.sector_slug?.toString();
  const companySlug = body?.company_slug?.toString();
  const ticker = body?.company_ticker?.toString() ?? null;
  const name = body?.company_name?.toString() ?? null;

  if (!sectorSlug || !companySlug) {
    return NextResponse.json({ error: "sector_slug and company_slug required" }, { status: 400 });
  }

  await sql`
    INSERT INTO bookmarks (user_id, sector_slug, company_slug, company_ticker, company_name)
    VALUES (${user.id}, ${sectorSlug}, ${companySlug}, ${ticker}, ${name})
    ON CONFLICT (user_id, sector_slug, company_slug) DO NOTHING
  `;
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest) {
  await ensureTables();
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const sectorSlug = url.searchParams.get("sector_slug");
  const companySlug = url.searchParams.get("company_slug");
  if (!sectorSlug || !companySlug) {
    return NextResponse.json({ error: "sector_slug and company_slug required" }, { status: 400 });
  }

  await sql`
    DELETE FROM bookmarks
    WHERE user_id = ${user.id}
      AND sector_slug = ${sectorSlug}
      AND company_slug = ${companySlug}
  `;
  return NextResponse.json({ ok: true });
}
