export async function GET() {
  const encoder = new TextEncoder();
  let interval: NodeJS.Timeout | null = null;
  let closed = false;

  const stream = new ReadableStream({
    start(controller) {
      const send = () => {
        if (closed) return;
        const payload = JSON.stringify({ ts: Date.now(), type: "tick" });
        try {
          controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
        } catch {
          closed = true;
          if (interval) clearInterval(interval);
          try {
            controller.close();
          } catch {
            // ignore
          }
        }
      };

      send();
      interval = setInterval(send, 10000);
    },
    cancel() {
      closed = true;
      if (interval) clearInterval(interval);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
