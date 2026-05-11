import { NextRequest } from "next/server";
import { runFlightAgent } from "@/lib/agent";
import type { SearchParams, FlightResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const params: SearchParams = await req.json();

  // Validate
  if (!params.origin || !params.destination || !params.startDate) {
    return new Response(JSON.stringify({ error: "Parámetros incompletos" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  // Streaming response using Server-Sent Events
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (data: object) => {
        const chunk = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(chunk));
      };

      sendEvent({ type: "start", message: "Iniciando agente de búsqueda..." });

      try {
        let found = 0;

        await runFlightAgent(
          params,
          (flight: FlightResult) => {
            found++;
            sendEvent({ type: "flight", flight, count: found });
          },
          req.signal
        );

        sendEvent({ type: "done", total: found });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        sendEvent({ type: "error", message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
