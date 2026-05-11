"use client";

import type { FlightResult } from "@/lib/types";

const STRATEGY_LABELS: Record<string, { label: string; color: string }> = {
  "hidden-city": { label: "HIDDEN CITY", color: "tag-red" },
  openjaw: { label: "OPEN JAW", color: "tag-blue" },
  "nearby-airport": { label: "AEROP. VECINO", color: "tag" },
  "alternative-market": { label: "MERCADO ALT.", color: "tag" },
  direct: { label: "DIRECTO", color: "tag-blue" },
};

interface Props {
  flight: FlightResult;
  index: number;
}

export default function FlightCard({ flight, index }: Props) {
  const strategy = flight.strategy ? STRATEGY_LABELS[flight.strategy] : null;
  const time = new Date(flight.foundAt).toLocaleTimeString("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const stopsLabel =
    flight.stops === 0 ? "Directo" : flight.stops === 1 ? "1 escala" : `${flight.stops} escalas`;

  return (
    <div
      className="flight-card-enter border border-dim border-l-2 border-l-pulse bg-radar/50 rounded-r p-4 hover:bg-radar transition-colors"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="flex items-start justify-between gap-4">
        {/* Left: route info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="font-display text-base font-bold text-text">
              {flight.origin}
            </span>
            <span className="text-muted font-mono text-xs">──→</span>
            <span className="font-display text-base font-bold text-text">
              {flight.destination}
            </span>
            {flight.isAlert && (
              <span className="tag">✓ EN RANGO</span>
            )}
            {strategy && (
              <span className={`tag ${strategy.color}`}>{strategy.label}</span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
            <span className="font-mono">{flight.departureDate}</span>
            <span>•</span>
            <span>{flight.airline}</span>
            <span>•</span>
            <span>{stopsLabel}</span>
            <span>•</span>
            <span>{flight.duration}</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted">
            <span className="font-mono">
              via <span className="text-sky">{flight.source}</span>
            </span>
            {flight.market && (
              <span className="font-mono">
                mercado <span className="text-sky">{flight.market}</span>
              </span>
            )}
            <span className="font-mono text-void/50 text-[10px]">
              encontrado {time}
            </span>
          </div>
        </div>

        {/* Right: price + CTA */}
        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          <div className="text-right">
            <div className={`font-display font-bold text-xl ${flight.isAlert ? "text-pulse glow-text" : "text-text"}`}>
              USD {flight.priceUSD.toLocaleString()}
            </div>
            {flight.price !== flight.priceUSD && (
              <div className="text-xs text-muted font-mono">
                {flight.currency} {flight.price.toLocaleString()}
              </div>
            )}
          </div>
          <a
            href={flight.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`px-4 py-2 rounded text-xs font-mono font-bold transition-all ${
              flight.isAlert
                ? "bg-pulse text-void hover:bg-pulse/90 shadow-[0_0_12px_rgba(15,240,179,0.3)]"
                : "border border-dim text-muted hover:border-pulse hover:text-pulse"
            }`}
          >
            VER VUELO →
          </a>
        </div>
      </div>
    </div>
  );
}
