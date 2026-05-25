import { NextResponse } from "next/server";
import { getChartRow } from "@/lib/charts/store";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: { symbol: string } }
) {
  const symbol = decodeURIComponent(params.symbol).toUpperCase();
  try {
    const row = await getChartRow(symbol);
    if (!row) {
      return NextResponse.json({ error: "not_found", symbol }, { status: 404 });
    }
    return NextResponse.json(row.payload, {
      headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
    });
  } catch (err) {
    return NextResponse.json(
      { error: "internal_error", detail: String(err) },
      { status: 500 }
    );
  }
}
