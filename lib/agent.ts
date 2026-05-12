import type { SearchParams, FlightResult } from "./types";
import { buildBookingUrl, PLATFORM_LABEL } from "./sources";

const AIRLINES_BY_DEST: Record<string, string[]> = {
  MAD: ["Iberia", "Air Europa", "LATAM", "Aerolíneas Arg.", "Iberia Express"],
  BCN: ["Vueling", "Iberia", "LATAM", "Level", "Norwegian"],
  ANY_ESP: ["Iberia", "Air Europa", "Vueling", "LATAM", "Norwegian"],
  LHR: ["British Airways", "LATAM", "Aerolíneas Arg.", "Iberia + BA"],
  CDG: ["Air France", "LATAM", "Iberia + AF", "Norwegian"],
  FCO: ["ITA Airways", "LATAM", "Iberia + ITA"],
  AMS: ["KLM", "LATAM", "Iberia + KLM"],
  LIS: ["TAP Air Portugal", "LATAM", "Iberia + TAP"],
};

const STOP_CITIES = ["São Paulo", "Santiago", "Lima", "Bogotá", "Miami", "Lisboa", "Casablanca"];
const CHEAP_DAYS = ["Mar", "Mié"];
const WEEK_DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MARKETS = ["AR", "CO", "BR", "CL"];

const STRATEGY_LABELS: Record<string, string> = {
  "hidden-city": "hidden-city",
  "openjaw": "open-jaw",
  "nearby-airports": "aerop. vecino",
  "error-fares": "error fare",
  "alternative-market": "mercado alt.",
};

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export async function runFlightAgent(
  params: SearchParams,
  onResult: (flight: FlightResult) => void,
  signal?: AbortSignal
): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY no configurada");

  const activePlatformLabels = params.platforms.map((k) => PLATFORM_LABEL[k]).filter(Boolean);
  const destLabel = params.destination === "ANY_ESP" ? "cualquier aeropuerto de España (MAD/BCN/SVQ/VLC)" : params.destination;
  const stopsLabel = params.stops === "any" ? "cualquier número de escalas" : params.stops === "0" ? "solo vuelos directos" : `máximo ${params.stops} escala(s)`;
  const cabinLabel = { economy: "Económica", premium: "Premium Económica", business: "Business" }[params.cabinClass];
  const paxLabel = `${params.adults} adulto${params.adults > 1 ? "s" : ""}${params.children ? `, ${params.children} niño${params.children > 1 ? "s" : ""}` : ""}${params.infants ? `, ${params.infants} bebé${params.infants > 1 ? "s" : ""}` : ""}`;

  const prompt = `Sos un agente experto en búsqueda de vuelos baratos para viajeros de Argentina.

BÚSQUEDA SOLICITADA:
- Origen: ${params.origin}
- Destino: ${destLabel}
- Fecha inicio: ${params.startDate}
- Fecha fin: ${params.endDate}
- Pasajeros: ${paxLabel}
- Clase: ${cabinLabel}
- Escalas: ${stopsLabel}
- Presupuesto: USD ${params.minPrice} – ${params.maxPrice} por persona
- Plataformas: ${activePlatformLabels.join(", ")}
- Estrategias: ${params.strategies.join(", ") || "estándar"}
- Mercados: ${params.countries.join(", ")}
- Días preferidos: ${params.preferredDays.join(", ")}
- Franjas: ${params.preferredSlots.join(", ")}
- Buscar más barato: ${params.findCheapest ? "SÍ" : "NO"}

INSTRUCCIONES:
- Generá EXACTAMENTE 10 opciones de vuelos realistas y variadas
- Mezcla de aerolíneas, escalas, precios y fuentes diferentes
- Al menos 2 resultados de mercados alternativos (CO/BR/CL) más baratos
- Si hay estrategias activas (hidden-city, openjaw) incluí 1-2 opciones con esa estrategia
- Los precios deben ser realistas: directo USD 900-1400, 1 escala USD 600-900, 2 escalas USD 480-700
- Fechas de salida dentro del rango ${params.startDate} a ${params.endDate}
- Priorizá días ${params.preferredDays.join("/")} si están disponibles

Respondé SOLO con JSON array sin texto adicional ni backticks:
[
  {
    "id": "f1",
    "origin": "${params.origin}",
    "destination": "IATA_DEST",
    "airline": "Nombre aerolínea",
    "departureDate": "YYYY-MM-DD",
    "depTime": "HH:MM",
    "arrTime": "HH:MM",
    "durH": 13,
    "durMin": 25,
    "stops": 1,
    "stopCity": "São Paulo",
    "dayOfWeek": "Mar",
    "pricePerPerson": 720,
    "currency": "USD",
    "source": "nombre plataforma exacto de la lista",
    "strategy": "direct|openjaw|hidden-city|nearby-airport|alternative-market",
    "market": "AR",
    "isNight": false,
    "isCheapDay": true
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

  if (!response.ok) throw new Error(`API error: ${response.status}`);

  const data = await response.json();
  const text = data.content?.map((b: { type: string; text?: string }) => b.text || "").join("") || "";
  const clean = text.replace(/```json|```/g, "").trim();

  let rawFlights: Record<string, unknown>[] = [];
  try {
    rawFlights = JSON.parse(clean);
  } catch {
    throw new Error("No se pudo parsear la respuesta de la IA");
  }

  const totalPassengers = params.adults + params.children;

  const flights: FlightResult[] = rawFlights.map((f) => {
    const pricePerPerson = Number(f.pricePerPerson) || rnd(600, 1000);
    const totalPrice = pricePerPerson * totalPassengers;
    const dest = String(f.destination || params.destination);
    const src = String(f.source || "Skyscanner");
    return {
      id: String(f.id || Math.random()),
      origin: String(f.origin || params.origin),
      destination: dest === "ANY_ESP" ? pick(["MAD", "BCN", "SVQ", "VLC"]) : dest,
      airline: String(f.airline || "LATAM"),
      departureDate: String(f.departureDate || params.startDate),
      depTime: String(f.depTime || "10:00"),
      arrTime: String(f.arrTime || "22:00"),
      durH: Number(f.durH || 13),
      durMin: Number(f.durMin || rnd(0, 59)),
      stops: Number(f.stops ?? 1),
      stopCity: f.stops ? String(f.stopCity || pick(STOP_CITIES)) : undefined,
      dayOfWeek: String(f.dayOfWeek || pick(WEEK_DAYS)),
      pricePerPerson,
      totalPrice,
      currency: "USD",
      priceUSD: pricePerPerson,
      source: src,
      bookingUrl: buildBookingUrl(src, params.origin, dest),
      foundAt: new Date().toISOString(),
      strategy: f.strategy ? String(f.strategy) : undefined,
      market: String(f.market || "AR"),
      isAlert: pricePerPerson <= params.maxPrice,
      isNight: Boolean(f.isNight),
      isCheapDay: Boolean(f.isCheapDay),
    };
  });

  flights.sort((a, b) => a.pricePerPerson - b.pricePerPerson);

  for (const flight of flights) {
    if (signal?.aborted) break;
    onResult(flight);
    await new Promise((r) => setTimeout(r, 250));
  }
}
