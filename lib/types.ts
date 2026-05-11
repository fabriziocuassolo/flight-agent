export interface SearchParams {
  origin: string;
  destination: string;
  startDate: string;
  endDate: string;
  passengers: number;
  minPrice: number;
  maxPrice: number;
  currency: string;
  searchCheapest: boolean;
  checkInterval: number; // minutes
  searchHours: string[]; // e.g. ["02:00", "06:00", "14:00"]
  countries: string[]; // markets to search (AR, US, CO, BR, CL, ES)
  strategies: string[]; // hidden-city, openjaw, nearby-airports, error-fares
}

export interface FlightResult {
  id: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  airline: string;
  stops: number;
  duration: string;
  price: number;
  currency: string;
  priceUSD: number;
  source: string; // "Google Flights", "Skyscanner", etc.
  bookingUrl: string;
  foundAt: string; // ISO timestamp
  strategy?: string; // "hidden-city", "openjaw", etc.
  isAlert?: boolean; // price below target
  market?: string; // country code of the market it was found in
}

export interface SearchSession {
  id: string;
  params: SearchParams;
  status: "idle" | "running" | "paused" | "stopped";
  results: FlightResult[];
  lastChecked?: string;
  nextCheck?: string;
  totalScans: number;
  startedAt?: string;
}

export type Source = {
  name: string;
  url: string;
  countries: string[];
  strategies: string[];
};
