import { NextResponse } from "next/server";
import { loadSectorIndex, loadCompaniesIndex } from "@/lib/data";

export async function GET() {
  const [sectors, companies] = await Promise.all([
    loadSectorIndex(),
    loadCompaniesIndex(),
  ]);
  return NextResponse.json({ sectors, companies });
}
