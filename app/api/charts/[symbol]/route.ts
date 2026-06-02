import { type NextRequest, NextResponse } from "next/server";
import { getChartRow } from "@/lib/charts/store";
import { compose } from "@/lib/api/compose";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { withMethods } from "@/lib/api/with-methods";
import { NotFoundError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export const GET = compose(
  withErrorHandler,
  withMethods(["GET"]),
)(async (_req: NextRequest, ctx: { params?: { symbol?: string } }) => {
  const symbol = decodeURIComponent(ctx?.params?.symbol ?? "").toUpperCase();
  const row = await getChartRow(symbol);
  if (!row) throw new NotFoundError(`Chart data for '${symbol}' not found`);
  return NextResponse.json(row.payload, {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
  });
});
