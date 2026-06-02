import { type NextRequest } from "next/server";
import { runPipeline } from "@/lib/pipeline";
import { compose } from "@/lib/api/compose";
import { withErrorHandler } from "@/lib/api/with-error-handler";
import { withMethods } from "@/lib/api/with-methods";
import { withRefreshPassword } from "@/lib/api/with-refresh-password";

export const dynamic = "force-dynamic";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

/**
 * POST /api/refresh?sector=<slug>
 *
 * Protected by withRefreshPassword (x-refresh-password header).
 * Streams pipeline progress as Server-Sent Events.
 * withErrorHandler is applied so unexpected pre-stream errors return JSON,
 * while in-stream pipeline errors are sent as SSE `ERROR:` messages.
 */
export const POST = compose(
  withErrorHandler,
  withMethods(["POST"]),
  withRefreshPassword,
)(async (req: NextRequest) => {
  const { searchParams } = new URL(req.url);
  const sectorSlug = searchParams.get("sector") ?? undefined;

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (msg: string) => {
        try {
          controller.enqueue(encoder.encode(`data: ${msg}\n\n`));
        } catch {
          // controller already closed
        }
      };

      try {
        await runPipeline(send, sectorSlug);
        send("DONE");
      } catch (err) {
        send(`ERROR: ${String(err)}`);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
});
