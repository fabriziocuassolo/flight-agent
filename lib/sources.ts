import type { SearchParams } from "./types";

export const IATA_CODES: Record<string, string> = {
  COR: "Córdoba",
  EZE: "Buenos Aires (Ezeiza)",
  AEP: "Buenos Aires (Aeroparque)",
  ROS: "Rosario",
  MDZ: "Mendoza",
  MAD: "Madrid",
  BCN: "Barcelona",
  LHR: "Londres",
  CDG: "París",
  FCO: "Roma",
  AMS: "Ámsterdam",
  LIS: "Lisboa",
  MXP: "Milán",
  ANY_ESP: "España (cualquiera)",
};

export const ORIGINS = [
  { code: "COR", label: "Córdoba (COR)" },
  { code: "EZE", label: "Bs.As. Ezeiza (EZE)" },
  { code: "AEP", label: "Bs.As. Aeroparque (AEP)" },
  { code: "ROS", label: "Rosario (ROS)" },
  { code: "MDZ", label: "Mendoza (MDZ)" },
];

export const DESTINATIONS = [
  { group: "España", options: [
    { code: "MAD", label: "Madrid (MAD)" },
    { code: "BCN", label: "Barcelona (BCN)" },
    { code: "ANY_ESP", label: "Cualquiera en España" },
  ]},
  { group: "Europa", options: [
    { code: "LHR", label: "Londres (LHR)" },
    { code: "CDG", label: "París (CDG)" },
    { code: "FCO", label: "Roma (FCO)" },
    { code: "AMS", label: "Ámsterdam (AMS)" },
    { code: "LIS", label: "Lisboa (LIS)" },
  ]},
];

export const PLATFORMS = [
  { key: "google",      label: "Google Flights", defaultOn: true },
  { key: "skyscanner",  label: "Skyscanner",     defaultOn: true },
  { key: "despegar",    label: "Despegar",        defaultOn: true },
  { key: "turismocity", label: "Turismocity",     defaultOn: true },
  { key: "kayak",       label: "Kayak",           defaultOn: true },
  { key: "latam",       label: "LATAM directo",   defaultOn: true },
  { key: "iberia",      label: "Iberia directo",  defaultOn: true },
  { key: "aireuropa",   label: "Air Europa",      defaultOn: false },
];

export const PLATFORM_LABEL: Record<string, string> = Object.fromEntries(
  PLATFORMS.map((p) => [p.key, p.label])
);

export function buildBookingUrl(source: string, origin: string, destination: string): string {
  const dest = destination === "ANY_ESP" ? "MAD" : destination;
  const o = origin.toLowerCase();
  const d = dest.toLowerCase();
  const map: Record<string, string> = {
    "Google Flights": `https://www.google.com/travel/flights/search?tfs=CBwQAhooagcIARID${origin}cgcIARID${dest}&curr=USD`,
    "Skyscanner":     `https://www.skyscanner.com.ar/vuelos/${o}/${d}/`,
    "Despegar":       `https://www.despegar.com/vuelos/${origin}-${dest}/`,
    "Turismocity":    `https://www.turismocity.com.ar/vuelos/buscar?origin=${origin}&destination=${dest}`,
    "Kayak":          `https://www.kayak.com.ar/flights/${origin}-${dest}/`,
    "LATAM directo":  `https://www.latamairlines.com/ar/es/oferta-vuelos?origin=${origin}&destination=${dest}`,
    "Iberia directo": `https://www.iberia.com/vuelos/${o}-${d}/`,
    "Air Europa":     `https://www.aireuropa.com/es/vuelos`,
  };
  return map[source] || map["Skyscanner"];
}

export function getAllBookingUrls(params: SearchParams): Record<string, string> {
  return Object.fromEntries(
    PLATFORMS.map((p) => [p.key, buildBookingUrl(p.label, params.origin, params.destination)])
  );
}
