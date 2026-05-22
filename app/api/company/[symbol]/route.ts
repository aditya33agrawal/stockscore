import { type NextRequest, NextResponse } from "next/server";
import { loadCompanyDetail } from "@/lib/data";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { symbol: string } }
) {
  const detail = await loadCompanyDetail(params.symbol.toUpperCase());
  if (!detail) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
