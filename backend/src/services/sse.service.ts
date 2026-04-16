import type { Response } from "express";

export interface SSEEmitter {
  emit(event: string, data: Record<string, unknown>): void;
  close(): void;
}

const HEARTBEAT_INTERVAL_MS = 15_000;

/**
 * Initialize an SSE stream on the response.
 * Sets appropriate headers, starts a heartbeat, and returns an emitter.
 */
export function createSSEStream(res: Response): SSEEmitter {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  // Send initial comment to flush headers
  res.write(":ok\n\n");

  const heartbeat = setInterval(() => {
    res.write("event: heartbeat\ndata: {}\n\n");
  }, HEARTBEAT_INTERVAL_MS);

  // Clean up heartbeat interval when client disconnects
  res.on("close", () => clearInterval(heartbeat));

  return {
    emit(event: string, data: Record<string, unknown>) {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    },
    close() {
      clearInterval(heartbeat);
      res.end();
    },
  };
}
