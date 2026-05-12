"use client";

import type { FlightResult } from "@/lib/types";

interface Props {
  flight: FlightResult;
  rank: number;
  maxPrice: number;
}

const STRATEGY_LABELS: Record<string, string> = {
  "hidden-city":        "HIDDEN CITY",
  "openjaw":            "OPEN JAW",
  "nearby-airport":     "AEROP. VECINO",
  "alternative-market": "MERCADO ALT.",
  "direct":             "DIRECTO",
  "error-fares":        "ERROR FARE",
};

export default function FlightCard({ flight, rank, maxPrice }: Props) {
  const cardClass = rank === 0 ? "flight-card best" : flight.pricePerPerson < maxPrice * 0.8 ? "flight-card deal" : "flight-card";
  const durStr = `${flight.durH}h ${String(flight.durMin).padStart(2, "0")}m`;
  const pax = flight.totalPrice !== flight.pricePerPerson ? ` · Total: $${flight.totalPrice.toLocaleString()}` : "";

  return (
    <div className={cardClass} style={{ animationDelay: `${Math.min(rank * 0.06, 0.5)}s` }}>
      {/* Badge */}
      {rank === 0 && <Badge color="var(--green)">★ MEJOR PRECIO</Badge>}
      {rank !== 0 && flight.pricePerPerson < maxPrice * 0.75 && <Badge color="var(--gold)">💰 OFERTA</Badge>}
      {rank > 0 && rank < 3 && flight.pricePerPerson >= maxPrice * 0.75 && <Badge color="var(--accent)">NUEVO</Badge>}

      {/* Card body */}
      <div style={{ padding: rank === 0 || flight.pricePerPerson < maxPrice * 0.75 ? "28px 20px 16px" : "18px 20px 16px" }}>
        {/* Airline row */}
        <div style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--muted2)", marginBottom: 10, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span>{flight.airline}</span>
          <Tag>{flight.origin} → {flight.destination}</Tag>
          <Tag>{flight.dayOfWeek}</Tag>
          {flight.departureDate && <Tag>{flight.departureDate}</Tag>}
        </div>

        {/* Route */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
          <Airport code={flight.origin} time={flight.depTime} />
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            <div style={{ width: "100%", height: 1, background: "linear-gradient(to right, var(--border2), var(--muted), var(--border2))", position: "relative" }}>
              <span style={{ fontSize: "0.75rem", position: "absolute", top: -9, left: "50%", transform: "translateX(-50%)", background: "var(--surface)", padding: "0 4px" }}>✈️</span>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.68rem", color: "var(--muted)", textAlign: "center" }}>{durStr}</div>
          </div>
          <Airport code={flight.destination} time={`${flight.arrTime}${flight.durH > 12 ? "+1" : ""}`} />
        </div>

        {/* Tags */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
          {flight.stops === 0
            ? <span className="ctag ctag-direct">✓ DIRECTO</span>
            : <span className="ctag ctag-stop">{flight.stops} ESCALA{flight.stops > 1 ? "S" : ""}{flight.stopCity ? ` · ${flight.stopCity}` : ""}</span>
          }
          {flight.isNight && <span className="ctag ctag-night">🌙 NOCTURNO</span>}
          {flight.isCheapDay && <span className="ctag ctag-cheap">📅 DÍA ECONÓMICO</span>}
          {flight.strategy && flight.strategy !== "direct" && (
            <span className="ctag ctag-strategy">{STRATEGY_LABELS[flight.strategy] || flight.strategy.toUpperCase()}</span>
          )}
          {flight.market && flight.market !== "AR" && (
            <span className="ctag ctag-market">🌐 MERCADO {flight.market}</span>
          )}
          <span className="ctag ctag-source">vía {flight.source}</span>
        </div>
      </div>

      {/* Price block */}
      <div style={{
        background: "var(--surface2)",
        borderLeft: "1px solid var(--border)",
        padding: "20px 22px",
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 12, minWidth: 170, textAlign: "center",
      }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.62rem", color: "var(--muted)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
          DESDE / PERSONA
        </div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "2.4rem", lineHeight: 1, color: "var(--gold)", letterSpacing: "0.02em" }}>
          ${flight.pricePerPerson.toLocaleString()}
        </div>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.68rem", color: "var(--muted)" }}>
          USD{pax}
        </div>
        <a
          href={flight.bookingUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            width: "100%", background: "var(--accent)", color: "var(--bg)",
            fontFamily: "'DM Mono',monospace", fontSize: "0.72rem", fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
            padding: "10px 14px", border: "none", borderRadius: "var(--radius)",
            cursor: "pointer", textDecoration: "none", transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#00ccee"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--accent)"; }}
        >
          Comprar ↗️
        </a>
      </div>
    </div>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <div style={{
      position: "absolute", top: 0, left: 0,
      fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", fontWeight: 700,
      letterSpacing: "0.1em", padding: "3px 10px",
      borderBottomRightRadius: "var(--radius)",
      background: color, color: color === "var(--accent)" ? "#000" : "#000",
    }}>{children}</div>
  );
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      fontFamily: "'DM Mono',monospace", fontSize: "0.65rem",
      padding: "2px 7px", borderRadius: 3,
      border: "1px solid var(--border2)", color: "var(--muted)",
    }}>{children}</span>
  );
}

function Airport({ code, time }: { code: string; time: string }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.9rem", color: "var(--text)", lineHeight: 1, letterSpacing: "0.05em" }}>
        {code}
      </div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.8rem", color: "var(--muted2)", marginTop: 2 }}>
        {time}
      </div>
    </div>
  );
}
