import type { SearchParams, FlightResult } from "./types";
import { getAllBookingUrls, IATA_CODES } from "./sources";

// This agent uses Claude AI to analyze flight search strategies
// and generates realistic flight options based on the search parameters.
// In production, you'd combine this with actual scraping APIs.

export async function runFlightAgent(
  params: SearchParams,
  onResult: (flight: FlightResult) => void,
  signal?: AbortSignal
): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no configurada");

  const bookingUrls = getAllBookingUrls(params);

  const prompt = `Eres un agente experto en búsqueda de vuelos baratos para viajeros de Argentina.

BÚSQUEDA SOLICITADA:
- Origen: ${params.origin} (${IATA_CODES[params.origin] || params.origin})
- Destino: ${params.destination} (${IATA_CODES[params.destination] || params.destination})
- Fecha inicio búsqueda: ${params.startDate}
- Fecha fin búsqueda: ${params.endDate}
- Pasajeros: ${params.passengers}
- Presupuesto máximo: USD ${params.maxPrice}
- Presupuesto mínimo: USD ${params.minPrice}
- Buscar el más barato del rango: ${params.searchCheapest ? "SÍ" : "NO"}
- Mercados a revisar: ${params.countries.join(", ")}
- Estrategias habilitadas: ${params.strategies.join(", ")}

ESTRATEGIAS A APLICAR:
1. Cambio de mercado/moneda: buscar en mercados de CO, BR, CL que suelen tener tarifas regionales más baratas
2. Aeropuertos vecinos: si va a Europa, comparar Madrid vs Lisboa vs Roma como alternativas
3. ${params.strategies.includes("hidden-city") ? "Hidden city ticketing: vuelos donde el destino real está antes del destino final del ticket" : ""}
4. ${params.strategies.includes("openjaw") ? "Open jaw: ida a un aeropuerto, vuelta desde otro" : ""}
5. Múltiples metabuscadores: Skyscanner, Kayak, Momondo, Kiwi, Turismocity

Genera EXACTAMENTE 8 opciones de vuelos realistas y variadas (distintas aerolíneas, rutas, escalas, precios) en formato JSON.
Asegúrate de que los precios sean realistas para la ruta ${params.origin} → ${params.destination} en el período indicado.
Incluye mezcla de: vuelos directos (más caros), 1 escala (precio medio), 2 escalas (más barato).
Incluye al menos 2 resultados de mercados alternativos (CO, BR, CL) que sean algo más baratos.
${params.strategies.includes("hidden-city") ? 'Incluye 1 opción hidden-city con nota explicativa.' : ''}
${params.strategies.includes("openjaw") ? 'Incluye 1 opción open-jaw con nota explicativa.' : ''}

PRECIOS TÍPICOS REFERENCIALES (vuelos desde Argentina a Europa, ida):
- Directo: USD 900-1400
- 1 escala (LAM, LATAM): USD 650-900  
- 2 escalas: USD 480-700
- Mercados alternativos (CO/BR/CL): hasta 20% más barato

Responde SOLO con un JSON array, sin texto adicional, sin backticks:
[
  {
    "id": "unique-id-1",
    "origin": "${IATA_CODES[params.origin] || params.origin}",
    "destination": "IATA_CODE",
    "departureDate": "YYYY-MM-DD",
    "airline": "Nombre Aerolínea",
    "stops": 0,
    "duration": "12h 30m",
    "price": 850,
    "currency": "USD",
    "priceUSD": 850,
    "source": "Nombre del metabuscador",
    "bookingUrl": "URL real del metabuscador",
    "foundAt": "${new Date().toISOString()}",
    "strategy": "direct|openjaw|hidden-city|nearby-airport|alternative-market",
    "market": "AR|CO|BR|CL|US|ES",
    "isAlert": false
  }
]`;

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    }),
    signal,
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content?.map((b: { type: string; text?: string }) => b.text || "").join("") || "";

  // Parse JSON, stripping any accidental markdown
  const clean = text.replace(/```json|```/g, "").trim();
  let flights: FlightResult[] = JSON.parse(clean);

  // Mark alerts (below max price)
  flights = flights.map((f) => ({
    ...f,
    isAlert: f.priceUSD <= params.maxPrice,
    bookingUrl: f.bookingUrl || bookingUrls[f.source?.toLowerCase().replace(/\s/g, "")] || bookingUrls.skyscanner,
  }));

  // Sort by price
  flights.sort((a, b) => a.priceUSD - b.priceUSD);

  // Emit one by one with a small delay for UX effect
  for (const flight of flights) {
    if (signal?.aborted) break;
    onResult(flight);
    await new Promise((r) => setTimeout(r, 300));
  }
}
