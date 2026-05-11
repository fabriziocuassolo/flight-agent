"use client";

import { useState } from "react";
import type { SearchParams } from "@/lib/types";
import { IATA_CODES } from "@/lib/sources";

const AIRPORTS = Object.keys(IATA_CODES);

const STRATEGIES = [
  { id: "hidden-city", label: "Hidden City", desc: "Tickets donde bajás antes del destino final" },
  { id: "openjaw", label: "Open Jaw", desc: "Ida a un aeropuerto, vuelta desde otro" },
  { id: "nearby-airports", label: "Aeropuertos Vecinos", desc: "Buscar en aeropuertos alternativos" },
  { id: "error-fares", label: "Error Fares", desc: "Monitorear tarifas con errores de precios" },
];

const MARKETS = [
  { code: "AR", label: "🇦🇷 Argentina" },
  { code: "CO", label: "🇨🇴 Colombia" },
  { code: "BR", label: "🇧🇷 Brasil" },
  { code: "CL", label: "🇨🇱 Chile" },
  { code: "US", label: "🇺🇸 USA" },
  { code: "ES", label: "🇪🇸 España" },
];

const SEARCH_HOURS = ["02:00", "06:00", "10:00", "14:00", "18:00", "22:00"];

interface Props {
  onSearch: (params: SearchParams) => void;
  isSearching: boolean;
  onStop: () => void;
}

export default function SearchForm({ onSearch, isSearching, onStop }: Props) {
  const [params, setParams] = useState<SearchParams>({
    origin: "Córdoba",
    destination: "Madrid",
    startDate: "2025-09-01",
    endDate: "2025-09-30",
    passengers: 1,
    minPrice: 0,
    maxPrice: 900,
    currency: "USD",
    searchCheapest: true,
    checkInterval: 30,
    searchHours: ["02:00", "06:00"],
    countries: ["AR", "CO", "BR", "CL"],
    strategies: ["nearby-airports"],
  });

  const toggle = <K extends keyof SearchParams>(
    key: K,
    value: string,
    currentArr: string[]
  ) => {
    const updated = currentArr.includes(value)
      ? currentArr.filter((v) => v !== value)
      : [...currentArr, value];
    setParams((p) => ({ ...p, [key]: updated }));
  };

  const handleSubmit = () => {
    onSearch(params);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="relative w-3 h-3">
          <div className="w-3 h-3 rounded-full bg-pulse relative z-10" />
          {isSearching && <div className="pulse-dot absolute inset-0 rounded-full" />}
        </div>
        <span className="font-mono text-xs text-muted tracking-widest uppercase">
          {isSearching ? "AGENTE ACTIVO" : "CONFIGURAR BÚSQUEDA"}
        </span>
      </div>

      {/* RUTA */}
      <section>
        <label className="block text-xs font-mono text-muted uppercase tracking-widest mb-3">
          // Ruta
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted mb-1">Origen</label>
            <select
              className="input-field"
              value={params.origin}
              onChange={(e) => setParams((p) => ({ ...p, origin: e.target.value }))}
            >
              {AIRPORTS.map((a) => (
                <option key={a} value={a} style={{ background: "#0a1628" }}>
                  {a} ({IATA_CODES[a]})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Destino</label>
            <select
              className="input-field"
              value={params.destination}
              onChange={(e) => setParams((p) => ({ ...p, destination: e.target.value }))}
            >
              {AIRPORTS.map((a) => (
                <option key={a} value={a} style={{ background: "#0a1628" }}>
                  {a} ({IATA_CODES[a]})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* FECHAS */}
      <section>
        <label className="block text-xs font-mono text-muted uppercase tracking-widest mb-3">
          // Ventana de búsqueda
        </label>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-muted mb-1">Inicio de búsqueda</label>
            <input
              type="date"
              className="input-field"
              value={params.startDate}
              onChange={(e) => setParams((p) => ({ ...p, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Fin de búsqueda</label>
            <input
              type="date"
              className="input-field"
              value={params.endDate}
              onChange={(e) => setParams((p) => ({ ...p, endDate: e.target.value }))}
            />
          </div>
        </div>
      </section>

      {/* PASAJEROS Y PRECIO */}
      <section>
        <label className="block text-xs font-mono text-muted uppercase tracking-widest mb-3">
          // Pasajeros & Presupuesto (USD)
        </label>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs text-muted mb-1">Pasajeros</label>
            <input
              type="number"
              min={1}
              max={9}
              className="input-field"
              value={params.passengers}
              onChange={(e) => setParams((p) => ({ ...p, passengers: +e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Precio mín.</label>
            <input
              type="number"
              min={0}
              className="input-field"
              placeholder="0"
              value={params.minPrice}
              onChange={(e) => setParams((p) => ({ ...p, minPrice: +e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">Precio máx.</label>
            <input
              type="number"
              min={0}
              className="input-field"
              placeholder="1200"
              value={params.maxPrice}
              onChange={(e) => setParams((p) => ({ ...p, maxPrice: +e.target.value }))}
            />
          </div>
        </div>

        {/* Checkbox búsqueda más barata */}
        <label className="flex items-center gap-3 mt-3 cursor-pointer group">
          <div
            onClick={() => setParams((p) => ({ ...p, searchCheapest: !p.searchCheapest }))}
            className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${
              params.searchCheapest
                ? "bg-pulse border-pulse"
                : "border-muted group-hover:border-pulse"
            }`}
          >
            {params.searchCheapest && (
              <svg className="w-3 h-3 text-void" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
          <span className="text-sm text-text">
            Buscar el <span className="text-pulse font-mono">más barato</span> dentro del rango de fechas
          </span>
        </label>
      </section>

      {/* HORARIOS DE CONSULTA */}
      <section>
        <label className="block text-xs font-mono text-muted uppercase tracking-widest mb-3">
          // Horarios de consulta
        </label>
        <div className="flex flex-wrap gap-2">
          {SEARCH_HOURS.map((h) => (
            <button
              key={h}
              type="button"
              onClick={() => toggle("searchHours", h, params.searchHours)}
              className={`px-3 py-1.5 rounded font-mono text-xs border transition-all ${
                params.searchHours.includes(h)
                  ? "bg-pulse/10 border-pulse text-pulse"
                  : "border-dim text-muted hover:border-muted"
              }`}
            >
              {h}
            </button>
          ))}
        </div>
        <div className="mt-3">
          <label className="block text-xs text-muted mb-1">Intervalo entre escaneos</label>
          <select
            className="input-field"
            value={params.checkInterval}
            onChange={(e) => setParams((p) => ({ ...p, checkInterval: +e.target.value }))}
          >
            <option value={15} style={{ background: "#0a1628" }}>Cada 15 minutos</option>
            <option value={30} style={{ background: "#0a1628" }}>Cada 30 minutos</option>
            <option value={60} style={{ background: "#0a1628" }}>Cada hora</option>
            <option value={180} style={{ background: "#0a1628" }}>Cada 3 horas</option>
            <option value={360} style={{ background: "#0a1628" }}>Cada 6 horas</option>
          </select>
        </div>
      </section>

      {/* MERCADOS */}
      <section>
        <label className="block text-xs font-mono text-muted uppercase tracking-widest mb-3">
          // Mercados a consultar
        </label>
        <div className="grid grid-cols-3 gap-2">
          {MARKETS.map((m) => (
            <button
              key={m.code}
              type="button"
              onClick={() => toggle("countries", m.code, params.countries)}
              className={`px-2 py-2 rounded border text-xs transition-all text-left ${
                params.countries.includes(m.code)
                  ? "bg-sky/10 border-sky text-sky"
                  : "border-dim text-muted hover:border-muted"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </section>

      {/* ESTRATEGIAS */}
      <section>
        <label className="block text-xs font-mono text-muted uppercase tracking-widest mb-3">
          // Estrategias de búsqueda
        </label>
        <div className="space-y-2">
          {STRATEGIES.map((s) => (
            <label key={s.id} className="flex items-start gap-3 cursor-pointer group">
              <div
                onClick={() => toggle("strategies", s.id, params.strategies)}
                className={`w-5 h-5 mt-0.5 rounded border flex-shrink-0 flex items-center justify-center transition-all ${
                  params.strategies.includes(s.id)
                    ? "bg-sky/20 border-sky"
                    : "border-muted group-hover:border-sky"
                }`}
              >
                {params.strategies.includes(s.id) && (
                  <div className="w-2.5 h-2.5 rounded-sm bg-sky" />
                )}
              </div>
              <div>
                <div className="text-sm text-text">{s.label}</div>
                <div className="text-xs text-muted">{s.desc}</div>
              </div>
            </label>
          ))}
        </div>
      </section>

      {/* CTA */}
      {isSearching ? (
        <button
          type="button"
          onClick={onStop}
          className="w-full py-3 rounded border border-alert/50 text-alert font-mono text-sm hover:bg-alert/10 transition-all"
        >
          ⬛ DETENER AGENTE
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          className="w-full py-3 rounded bg-pulse text-void font-mono text-sm font-bold hover:bg-pulse/90 transition-all shadow-[0_0_20px_rgba(15,240,179,0.3)] hover:shadow-[0_0_30px_rgba(15,240,179,0.5)]"
        >
          ▶ LANZAR AGENTE
        </button>
      )}
    </div>
  );
}
