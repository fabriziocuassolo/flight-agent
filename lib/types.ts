export interface SearchParams {
  origin: string;           // IATA code e.g. "COR"
  destination: string;      // IATA code or "ANY_ESP"
  startDate: string;
  endDate: string;
  adults: number;
  children: number;
  infants: number;
  cabinClass: "economy" | "premium" | "business";
  minPrice: number;
  maxPrice: number;
  stops: "any" | "0" | "1" | "2";
  tripLength: "any" | "7" | "10" | "14" | "21" | "30";
  preferredDays: string[];       // ["MAR","MIÉ","JUE"] etc.
  preferredSlots: string[];      // ["madrugada","mañana","noche"]
  timeFrom: string;              // "00:00"
  timeTo: string;                // "23:59"
  platforms: string[];           // ["google","skyscanner","despegar",...]
  findCheapest: boolean;
  priceAlert: boolean;
  checkInterval: number;
  maxResults: number;
  autoSort: boolean;
  countries: string[];
  strategies: string[];
}

export interface FlightResult {
  id: string;
  origin: string;
  destination: string;
  airline: string;
  departureDate: string;
  depTime: string;
  arrTime: string;
  durH: number;
  durMin: number;
  stops: number;
  stopCity?: string;
  dayOfWeek: string;
  pricePerPerson: number;
  totalPrice: number;
  currency: string;
  priceUSD: number;
  source: string;
  bookingUrl: string;
  foundAt: string;
  strategy?: string;
  market?: string;
  isAlert: boolean;
  isNight: boolean;
  isCheapDay: boolean;
}

export type AgentStatus = "idle" | "running" | "done" | "error";

export type LogType = "ok" | "warn" | "err" | "info" | "scan";

export interface LogEntry {
  ts: string;
  msg: string;
  type: LogType;
}
