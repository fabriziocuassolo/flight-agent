import { NextRequest } from "next/server";
import { runFlightAgent } from "@/lib/agent";
import type { SearchParams, FlightResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const params: SearchParams = await req.json();

  if (!params.origin || !params.destination || !params.startDate) {
    return new Response(JSON.stringify({ error: "Parámetros incompletos" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
      };

      send({ type: "start", message: `Iniciando agente · ${params.origin} → ${params.destination}` });

      try {
        let found = 0;
        await runFlightAgent(
          params,
          (flight: FlightResult) => {
            found++;
            send({ type: "flight", flight, count: found });
          },
          req.signal
        );
        send({ type: "done", total: found });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error desconocido";
        send({ type: "error", message: msg });
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
