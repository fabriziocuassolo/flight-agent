import type { SearchParams, FlightResult } from "./types";
import { buildBookingUrl, PLATFORM_LABEL } from "./sources";

const STOP_CITIES = ["São Paulo", "Santiago", "Lima", "Bogotá", "Miami", "Lisboa", "Casablanca"];
const WEEK_DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const CHEAP_DAYS = ["Mar", "Mié"];

const AIRLINE_NAMES: Record<string, string> = {
  AR: "Aerolíneas Argentinas",
  IB: "Iberia",
  UX: "Air Europa",
  LA: "LATAM",
  LH: "Lufthansa",
  KL: "KLM",
  AF: "Air France",
  AZ: "ITA Airways",
  BA: "British Airways",
  TP: "TAP Air Portugal",
  AV: "Avianca",
  CM: "Copa Airlines",
};

function rnd(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr || new Date().toISOString().slice(0, 10));
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function dateDiffDays(from: string, to: string) {
  const a = new Date(from).getTime();
  const b = new Date(to || from).getTime();
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 30;
  return Math.max(1, Math.round((b - a) / 86400000));
}

function randomTime(slot: string) {
  const ranges: Record<string, [number, number]> = {
    madrugada: [0, 5],
    mañana: [6, 11],
    mediodia: [12, 16],
    noche: [19, 23],
  };
  const [minH, maxH] = ranges[slot] || [0, 23];
  return `${String(rnd(minH, maxH)).padStart(2, "0")}:${pick(["00", "15", "30", "45"])}`;
}

function addHours(time: string, hours: number, minutes: number) {
  const [h, m] = time.split(":").map(Number);
  const total = (h || 0) * 60 + (m || 0) + hours * 60 + minutes;
  const hh = Math.floor((total % 1440) / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

function durationFromMinutes(totalMinutes: number) {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return { durH: h, durMin: m };
}

function diffMinutes(startISO?: string, endISO?: string) {
  if (!startISO || !endISO) return null;
  const start = new Date(startISO).getTime();
  const end = new Date(endISO).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return Math.round((end - start) / 60000);
}

function getStops(params: SearchParams, index: number) {
  if (params.stops === "0") return 0;
  if (params.stops === "1") return index % 4 === 0 ? 0 : 1;
  if (params.stops === "2") return index % 5 === 0 ? 0 : index % 2 === 0 ? 2 : 1;
  return index % 5 === 0 ? 0 : index % 3 === 0 ? 2 : 1;
}

function getDestination(params: SearchParams, index: number) {
  if (params.destination === "ANY_ESP") return pick(["MAD", "BCN", "SVQ", "VLC"]);
  if (params.strategies.includes("nearby-airports") && index % 7 === 0) {
    if (params.destination === "MAD") return pick(["MAD", "BCN", "LIS"]);
    if (params.destination === "BCN") return pick(["BCN", "MAD", "VLC"]);
  }
  return params.destination;
}

function sourceFromKey(key: string) {
  return PLATFORM_LABEL[key] || key;
}

function makeDemoFlight(params: SearchParams, sourceKey: string, index: number): FlightResult {
  const source = sourceFromKey(sourceKey);
  const destination = getDestination(params, index);
  const stops = getStops(params, index);
  const departureDate = addDays(params.startDate, rnd(0, dateDiffDays(params.startDate, params.endDate)));
  const dayOfWeek = pick(params.preferredDays?.length ? params.preferredDays : WEEK_DAYS);
  const depTime = randomTime(pick(params.preferredSlots?.length ? params.preferredSlots : ["madrugada", "mañana", "noche"]));
  const durH = stops === 0 ? rnd(11, 14) : stops === 1 ? rnd(16, 23) : rnd(22, 32);
  const durMin = pick([0, 15, 25, 35, 45, 55]);
  const arrTime = addHours(depTime, durH, durMin);
  const base = stops === 0 ? rnd(930, 1380) : stops === 1 ? rnd(650, 940) : rnd(480, 720);
  const sourceDelta: Record<string, number> = {
    "Google Flights": 20,
    "Skyscanner": -30,
    "Despegar": 30,
    "Turismocity": -45,
    "Kayak": -10,
    "LATAM directo": 40,
    "Iberia directo": 70,
    "Air Europa": 15,
  };
  const pricePerPerson = Math.max(320, base + (sourceDelta[source] || 0));
  const passengerCount = Math.max(1, params.adults + params.children);
  const market = pick(params.countries?.length ? params.countries : ["AR"]);

  return {
    id: `${sourceKey}-demo-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`,
    origin: params.origin,
    destination,
    airline: sourceKey === "latam" ? "LATAM" : sourceKey === "iberia" ? "Iberia" : sourceKey === "aireuropa" ? "Air Europa" : pick(["Iberia", "Air Europa", "LATAM", "KLM", "Air France", "TAP Air Portugal"]),
    departureDate,
    depTime,
    arrTime,
    durH,
    durMin,
    stops,
    stopCity: stops > 0 ? pick(STOP_CITIES) : undefined,
    dayOfWeek,
    pricePerPerson,
    totalPrice: pricePerPerson * passengerCount,
    currency: "USD",
    priceUSD: pricePerPerson,
    source,
    bookingUrl: buildBookingUrl(source, params.origin, destination),
    foundAt: new Date().toISOString(),
    strategy: market !== "AR" ? "alternative-market" : stops === 0 ? "direct" : "nearby-airport",
    market,
    isAlert: params.priceAlert ? pricePerPerson <= params.maxPrice : false,
    isNight: Number(depTime.slice(0, 2)) >= 21 || Number(depTime.slice(0, 2)) <= 5,
    isCheapDay: CHEAP_DAYS.some((d) => dayOfWeek.toLowerCase().startsWith(d.toLowerCase().slice(0, 3))),
  };
}

async function getAmadeusToken() {
  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) return null;

  const baseUrl = process.env.AMADEUS_BASE_URL || "https://test.api.amadeus.com";
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`${baseUrl}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) throw new Error(`Amadeus auth error: ${res.status}`);

  const data = await res.json();
  return String(data.access_token || "");
}

function parseAmadeusFlight(offer: any, params: SearchParams, index: number): FlightResult | null {
  const itinerary = offer.itineraries?.[0];
  const segments = itinerary?.segments || [];
  const first = segments[0];
  const last = segments[segments.length - 1];
  if (!first || !last) return null;

  const totalMinutes = diffMinutes(first.departure?.at, last.arrival?.at) || 0;
  const { durH, durMin } = totalMinutes ? durationFromMinutes(totalMinutes) : { durH: 13, durMin: 0 };
  const pricePerPerson = Math.round(Number(offer.price?.grandTotal || offer.price?.total || 0));
  if (!pricePerPerson) return null;

  const depDate = String(first.departure?.at || params.startDate).slice(0, 10);
  const depTime = String(first.departure?.at || "10:00").slice(11, 16) || "10:00";
  const arrTime = String(last.arrival?.at || "22:00").slice(11, 16) || "22:00";
  const airlineCode = String(first.carrierCode || offer.validatingAirlineCodes?.[0] || "");
  const airline = AIRLINE_NAMES[airlineCode] || airlineCode || "Aerolínea";
  const stops = Math.max(0, segments.length - 1);
  const passengerCount = Math.max(1, params.adults + params.children);
  const dayOfWeek = new Date(depDate).toLocaleDateString("es-AR", { weekday: "short" });

  return {
    id: `amadeus-${offer.id || index}`,
    origin: first.departure?.iataCode || params.origin,
    destination: last.arrival?.iataCode || params.destination,
    airline,
    departureDate: depDate,
    depTime,
    arrTime,
    durH,
    durMin,
    stops,
    stopCity: stops > 0 ? segments[0]?.arrival?.iataCode : undefined,
    dayOfWeek,
    pricePerPerson,
    totalPrice: pricePerPerson * passengerCount,
    currency: offer.price?.currency || "USD",
    priceUSD: pricePerPerson,
    source: "Amadeus",
    bookingUrl: buildBookingUrl("Google Flights", params.origin, last.arrival?.iataCode || params.destination),
    foundAt: new Date().toISOString(),
    strategy: stops === 0 ? "direct" : "nearby-airport",
    market: "GLOBAL",
    isAlert: params.priceAlert ? pricePerPerson <= params.maxPrice : false,
    isNight: Number(depTime.slice(0, 2)) >= 21 || Number(depTime.slice(0, 2)) <= 5,
    isCheapDay: CHEAP_DAYS.some((d) => dayOfWeek.toLowerCase().startsWith(d.toLowerCase().slice(0, 3))),
  };
}

async function searchAmadeus(params: SearchParams, token: string): Promise<FlightResult[]> {
  const baseUrl = process.env.AMADEUS_BASE_URL || "https://test.api.amadeus.com";
  const destination = params.destination === "ANY_ESP" ? "MAD" : params.destination;
  const query = new URLSearchParams({
    originLocationCode: params.origin,
    destinationLocationCode: destination,
    departureDate: params.startDate,
    adults: String(Math.max(1, params.adults)),
    currencyCode: "USD",
    max: String(Math.min(params.maxResults || 20, 50)),
  });

  if (params.children > 0) query.set("children", String(params.children));
  if (params.infants > 0) query.set("infants", String(params.infants));
  if (params.maxPrice > 0) query.set("maxPrice", String(Math.ceil(params.maxPrice * 1.35)));
  if (params.stops === "0") query.set("nonStop", "true");
  if (params.cabinClass !== "economy") {
    query.set("travelClass", params.cabinClass === "premium" ? "PREMIUM_ECONOMY" : "BUSINESS");
  }

  const res = await fetch(`${baseUrl}/v2/shopping/flight-offers?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error(`Amadeus search error: ${res.status}`);

  const json = await res.json();
  return (json.data || [])
    .map((offer: any, index: number) => parseAmadeusFlight(offer, params, index))
    .filter(Boolean) as FlightResult[];
}

function parseSerpFlight(item: any, params: SearchParams, section: string, index: number): FlightResult | null {
  const flights = item.flights || [];
  const first = flights[0];
  const last = flights[flights.length - 1];
  if (!first && !item.price) return null;

  const pricePerPerson = Math.round(Number(item.price || item.extracted_price || 0));
  if (!pricePerPerson) return null;

  const depTimeRaw = String(first?.departure_airport?.time || item.departure_time || "10:00");
  const arrTimeRaw = String(last?.arrival_airport?.time || item.arrival_time || "22:00");
  const depTime = depTimeRaw.match(/\d{1,2}:\d{2}/)?.[0] || "10:00";
  const arrTime = arrTimeRaw.match(/\d{1,2}:\d{2}/)?.[0] || "22:00";
  const totalDuration = Number(item.total_duration || item.duration || 0);
  const { durH, durMin } = totalDuration ? durationFromMinutes(totalDuration) : { durH: 13, durMin: 0 };
  const stops = Math.max(0, flights.length - 1);
  const passengerCount = Math.max(1, params.adults + params.children);
  const airline = first?.airline || item.airline || "Google Flights";
  const destination = last?.arrival_airport?.id || (params.destination === "ANY_ESP" ? "MAD" : params.destination);

  return {
    id: `serpapi-${section}-${index}-${Math.random().toString(16).slice(2)}`,
    origin: first?.departure_airport?.id || params.origin,
    destination,
    airline,
    departureDate: params.startDate,
    depTime,
    arrTime,
    durH,
    durMin,
    stops,
    stopCity: stops > 0 ? flights[0]?.arrival_airport?.id : undefined,
    dayOfWeek: new Date(params.startDate).toLocaleDateString("es-AR", { weekday: "short" }),
    pricePerPerson,
    totalPrice: pricePerPerson * passengerCount,
    currency: "USD",
    priceUSD: pricePerPerson,
    source: section === "best" ? "Google Flights · SerpApi" : "Google Flights · SerpApi",
    bookingUrl: buildBookingUrl("Google Flights", params.origin, destination),
    foundAt: new Date().toISOString(),
    strategy: stops === 0 ? "direct" : "nearby-airport",
    market: "GOOGLE",
    isAlert: params.priceAlert ? pricePerPerson <= params.maxPrice : false,
    isNight: Number(depTime.slice(0, 2)) >= 21 || Number(depTime.slice(0, 2)) <= 5,
    isCheapDay: CHEAP_DAYS.some((d) => new Date(params.startDate).toLocaleDateString("es-AR", { weekday: "short" }).toLowerCase().startsWith(d.toLowerCase().slice(0, 3))),
  };
}

async function searchSerpApi(params: SearchParams): Promise<FlightResult[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) return [];

  const destination = params.destination === "ANY_ESP" ? "MAD" : params.destination;
  const query = new URLSearchParams({
    engine: "google_flights",
    departure_id: params.origin,
    arrival_id: destination,
    outbound_date: params.startDate,
    type: "2",
    currency: "USD",
    hl: "es",
    gl: "ar",
    adults: String(Math.max(1, params.adults)),
    children: String(Math.max(0, params.children)),
    sort_by: "2",
    api_key: apiKey,
  });

  const res = await fetch(`https://serpapi.com/search.json?${query.toString()}`);
  if (!res.ok) throw new Error(`SerpApi search error: ${res.status}`);

  const json = await res.json();
  const best = (json.best_flights || []).map((item: any, index: number) => parseSerpFlight(item, params, "best", index));
  const other = (json.other_flights || []).map((item: any, index: number) => parseSerpFlight(item, params, "other", index + best.length));
  return [...best, ...other].filter(Boolean) as FlightResult[];
}

function normalizeWorkerFlight(item: any, params: SearchParams, index: number): FlightResult | null {
  const pricePerPerson = Math.round(Number(item.pricePerPerson ?? item.priceUSD ?? item.price ?? 0));
  if (!pricePerPerson || pricePerPerson <= 0) return null;

  const destination = String(item.destination || item.dest || (params.destination === "ANY_ESP" ? "MAD" : params.destination));
  const source = String(item.source || "Worker externo");
  const depTime = String(item.depTime || item.departureTime || "10:00").slice(0, 5);
  const arrTime = String(item.arrTime || item.arrivalTime || "22:00").slice(0, 5);
  const durH = Number(item.durH || item.durationHours || 13);
  const durMin = Number(item.durMin || item.durationMinutes || 0);
  const stops = Number(item.stops ?? 1);
  const passengerCount = Math.max(1, params.adults + params.children);

  return {
    id: String(item.id || `worker-${Date.now()}-${index}-${Math.random().toString(16).slice(2)}`),
    origin: String(item.origin || params.origin),
    destination,
    airline: String(item.airline || "Aerolínea"),
    departureDate: String(item.departureDate || params.startDate),
    depTime,
    arrTime,
    durH,
    durMin,
    stops,
    stopCity: item.stopCity ? String(item.stopCity) : stops > 0 ? pick(STOP_CITIES) : undefined,
    dayOfWeek: String(item.dayOfWeek || new Date(params.startDate).toLocaleDateString("es-AR", { weekday: "short" })),
    pricePerPerson,
    totalPrice: Number(item.totalPrice || pricePerPerson * passengerCount),
    currency: String(item.currency || "USD"),
    priceUSD: Number(item.priceUSD || pricePerPerson),
    source,
    bookingUrl: String(item.bookingUrl || buildBookingUrl(source, params.origin, destination)),
    foundAt: String(item.foundAt || new Date().toISOString()),
    strategy: item.strategy ? String(item.strategy) : stops === 0 ? "direct" : "nearby-airport",
    market: item.market ? String(item.market) : "WORKER",
    isAlert: params.priceAlert ? pricePerPerson <= params.maxPrice : false,
    isNight: Number(depTime.slice(0, 2)) >= 21 || Number(depTime.slice(0, 2)) <= 5,
    isCheapDay: CHEAP_DAYS.some((d) =>
      String(item.dayOfWeek || "").toLowerCase().startsWith(d.toLowerCase().slice(0, 3))
    ),
  };
}

async function searchExternalWorker(params: SearchParams): Promise<FlightResult[]> {
  const workerUrl = process.env.SCRAPER_WORKER_URL;
  if (!workerUrl) return [];

  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (process.env.SCRAPER_WORKER_TOKEN) {
    headers.Authorization = `Bearer ${process.env.SCRAPER_WORKER_TOKEN}`;
  }

  const res = await fetch(workerUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(params),
  });

  if (!res.ok) throw new Error(`Worker externo error: ${res.status}`);

  const json = await res.json();
  const rows = Array.isArray(json) ? json : Array.isArray(json.flights) ? json.flights : [];
  return rows
    .map((item: any, index: number) => normalizeWorkerFlight(item, params, index))
    .filter(Boolean) as FlightResult[];
}


async function runDemoFallback(
  params: SearchParams,
  onResult: (flight: FlightResult) => void,
  signal?: AbortSignal
) {
  const activePlatforms = params.platforms?.length
    ? params.platforms
    : ["google", "skyscanner", "despegar", "turismocity", "kayak", "latam", "iberia"];

  const flights: FlightResult[] = [];

  for (const platform of activePlatforms) {
    if (signal?.aborted) return;
    await new Promise((r) => setTimeout(r, 160));
    const perPlatform = platform === "turismocity" || platform === "skyscanner" ? 3 : 2;

    for (let i = 0; i < perPlatform; i++) {
      const flight = makeDemoFlight(params, platform, flights.length + i);
      if (flight.pricePerPerson >= params.minPrice && flight.pricePerPerson <= Math.max(params.maxPrice * 1.35, params.maxPrice + 250)) {
        flights.push(flight);
      }
    }
  }

  flights.sort((a, b) => a.pricePerPerson - b.pricePerPerson);

  for (const flight of flights.slice(0, params.maxResults || 20)) {
    if (signal?.aborted) return;
    onResult(flight);
    await new Promise((r) => setTimeout(r, 150));
  }
}

function dedupeFlights(flights: FlightResult[]) {
  const seen = new Set<string>();
  return flights.filter((flight) => {
    const key = `${flight.source}-${flight.airline}-${flight.origin}-${flight.destination}-${flight.departureDate}-${flight.depTime}-${flight.pricePerPerson}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function runFlightAgent(
  params: SearchParams,
  onResult: (flight: FlightResult) => void,
  signal?: AbortSignal
): Promise<void> {
  const realFlights: FlightResult[] = [];

  // 1) Worker externo opcional.
  // Importante: el scraping con navegador no corre bien en Vercel.
  // Por eso esta app puede llamar a un worker externo propio que devuelva JSON normalizado.
  if (process.env.SCRAPER_WORKER_URL) {
    try {
      const workerFlights = await searchExternalWorker(params);
      realFlights.push(...workerFlights);
    } catch (err) {
      console.warn("Worker externo falló:", err);
    }
  }

  // 2) SerpApi Google Flights opcional.
  if (params.platforms.includes("google")) {
    try {
      const serpFlights = await searchSerpApi(params);
      realFlights.push(...serpFlights);
    } catch (err) {
      console.warn("SerpApi falló:", err);
    }
  }

  // 3) Amadeus opcional.
  const canUseAmadeus = Boolean(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);
  if (canUseAmadeus) {
    try {
      const token = await getAmadeusToken();
      if (token) {
        const amadeusFlights = await searchAmadeus(params, token);
        realFlights.push(...amadeusFlights);
      }
    } catch (err) {
      console.warn("Amadeus falló:", err);
    }
  }

  const clean = dedupeFlights(realFlights)
    .filter((flight) => flight.pricePerPerson >= params.minPrice)
    .filter((flight) => flight.pricePerPerson <= Math.max(params.maxPrice * 1.35, params.maxPrice + 250))
    .sort((a, b) => a.pricePerPerson - b.pricePerPerson)
    .slice(0, params.maxResults || 20);

  if (clean.length > 0) {
    for (const flight of clean) {
      if (signal?.aborted) break;
      onResult(flight);
      await new Promise((r) => setTimeout(r, 180));
    }
    return;
  }

  // Fallback para que la UI nunca muera si todavía no cargaste fuentes reales.
  await runDemoFallback(params, onResult, signal);
}
