import { runPipeline } from "@/lib/pipeline";
import { type NextRequest } from "next/server";

export const dynamic = "force-dynamic";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  "X-Accel-Buffering": "no",
};

function errorStream(msg: string): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(`data: ERROR: ${msg}\n\n`));
      controller.close();
    },
  });
  return new Response(stream, { headers: SSE_HEADERS });
}

export async function POST(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sectorSlug = searchParams.get("sector") ?? undefined;

  const body = await req.json().catch(() => ({}));
  const providedPassword: string = body?.password ?? "";
  const expectedPassword = process.env.REFRESH_PASSWORD;

  if (expectedPassword && providedPassword !== expectedPassword) {
    return errorStream("Incorrect password");
  }

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
}
