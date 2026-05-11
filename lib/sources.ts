import type { SearchParams } from "./types";

export const SOURCES = [
  {
    name: "Google Flights",
    key: "google",
    baseUrl: "https://www.google.com/travel/flights",
    markets: ["AR", "US", "CO", "BR", "CL", "ES"],
  },
  {
    name: "Skyscanner",
    key: "skyscanner",
    baseUrl: "https://www.skyscanner.com",
    markets: ["AR", "US", "CO", "BR", "CL", "ES"],
  },
  {
    name: "Momondo",
    key: "momondo",
    baseUrl: "https://www.momondo.com",
    markets: ["US", "CO", "BR", "CL"],
  },
  {
    name: "Kayak",
    key: "kayak",
    baseUrl: "https://www.kayak.com",
    markets: ["US", "CO", "BR"],
  },
  {
    name: "Kiwi",
    key: "kiwi",
    baseUrl: "https://www.kiwi.com",
    markets: ["AR", "US", "CO", "BR", "CL", "ES"],
  },
  {
    name: "Turismocity",
    key: "turismocity",
    baseUrl: "https://www.turismocity.com.ar",
    markets: ["AR"],
  },
];

export const IATA_CODES: Record<string, string> = {
  "Córdoba": "COR",
  "Buenos Aires": "EZE",
  "Madrid": "MAD",
  "Barcelona": "BCN",
  "Roma": "FCO",
  "París": "CDG",
  "Lisboa": "LIS",
  "Milán": "MXP",
  "Amsterdam": "AMS",
  "Londres": "LHR",
  "Santiago": "SCL",
  "Lima": "LIM",
  "Bogotá": "BOG",
  "Miami": "MIA",
  "New York": "JFK",
};

export function buildGoogleFlightsUrl(params: SearchParams): string {
  const orig = IATA_CODES[params.origin] || params.origin;
  const dest = IATA_CODES[params.destination] || params.destination;
  return `https://www.google.com/travel/flights/search?tfs=CBwQAhooagcIARIDQ09SEgoyMDI1LTA5LTAxcg8IARILagcIARIDTUFE&curr=USD&hl=es`;
}

export function buildSkyscannerUrl(params: SearchParams, market = "AR"): string {
  const orig = IATA_CODES[params.origin] || params.origin;
  const dest = IATA_CODES[params.destination] || params.destination;
  const locale = market === "AR" ? "es-AR" : market === "CO" ? "es-CO" : "en-US";
  const currency = market === "AR" ? "USD" : "USD";
  return `https://www.skyscanner.com.ar/transporte/vuelos/${orig}/${dest}/${params.startDate.replace(/-/g, "")}/?adults=${params.passengers}&currency=${currency}`;
}

export function buildKiwiUrl(params: SearchParams): string {
  const orig = IATA_CODES[params.origin] || params.origin;
  const dest = IATA_CODES[params.destination] || params.destination;
  return `https://www.kiwi.com/es/search/results/${encodeURIComponent(params.origin)}/${encodeURIComponent(params.destination)}/${params.startDate}/${params.endDate || params.startDate}?adults=${params.passengers}&currency=USD`;
}

export function buildMomondoUrl(params: SearchParams): string {
  const orig = IATA_CODES[params.origin] || params.origin;
  const dest = IATA_CODES[params.destination] || params.destination;
  return `https://www.momondo.com/flight-search/${orig}-${dest}/${params.startDate}?adults=${params.passengers}&currency=USD`;
}

export function buildKayakUrl(params: SearchParams): string {
  const orig = IATA_CODES[params.origin] || params.origin;
  const dest = IATA_CODES[params.destination] || params.destination;
  return `https://www.kayak.com/flights/${orig}-${dest}/${params.startDate}?adults=${params.passengers}&currency=USD`;
}

export function buildSkippedUrl(params: SearchParams): string {
  const orig = IATA_CODES[params.origin] || params.origin;
  const dest = IATA_CODES[params.destination] || params.destination;
  return `https://skiplagged.com/flights/${orig}/${dest}/${params.startDate}`;
}

export function getAllBookingUrls(params: SearchParams): Record<string, string> {
  return {
    google: buildGoogleFlightsUrl(params),
    skyscanner: buildSkyscannerUrl(params),
    kiwi: buildKiwiUrl(params),
    momondo: buildMomondoUrl(params),
    kayak: buildKayakUrl(params),
    skiplagged: buildSkippedUrl(params),
  };
}
