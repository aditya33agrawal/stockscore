import { type NextRequest, NextResponse } from "next/server";
import { loadCompanyDetail } from "@/lib/data";
import { compose } from "@/lib/api/compose";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { withMethods } from "@/lib/api/with-methods";
import { NotFoundError } from "@/lib/api/errors";

export const dynamic = "force-dynamic";

export const GET = compose(
  withErrorHandler,
  withMethods(["GET"]),
)(async (_req: NextRequest, ctx: { params?: { symbol?: string } }) => {
  const symbol = (ctx?.params?.symbol ?? "").toUpperCase();
  const detail = await loadCompanyDetail(symbol);
  if (!detail) throw new NotFoundError(`Company '${symbol}' not found`);
  return NextResponse.json(detail);
});
