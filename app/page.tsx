"use client";

import { useState, useRef, useCallback } from "react";
import SearchForm from "@/components/SearchForm";
import FlightCard from "@/components/FlightCard";
import AgentStatus from "@/components/AgentStatus";
import type { SearchParams, FlightResult } from "@/lib/types";

export default function Home() {
  const [results, setResults] = useState<FlightResult[]>([]);
  const [status, setStatus] = useState<"idle" | "running" | "done" | "error">("idle");
  const [statusMsg, setStatusMsg] = useState("Configurá tu búsqueda y lanzá el agente");
  const [totalScans, setTotalScans] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const handleSearch = useCallback(async (params: SearchParams) => {
    // Abort any existing search
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setResults([]);
    setStatus("running");
    setStatusMsg("Conectando con fuentes de vuelos...");
    setTotalScans((n) => n + 1);

    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) throw new Error("Error en la respuesta del servidor");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;

          try {
            const evt = JSON.parse(raw);
            if (evt.type === "start") {
              setStatusMsg(evt.message);
            } else if (evt.type === "flight") {
              setResults((prev) => [...prev, evt.flight]);
              setStatusMsg(`Procesando resultados... ${evt.count} vuelos encontrados`);
            } else if (evt.type === "done") {
              setStatus("done");
              setStatusMsg(`Escaneo completado. ${evt.total} opciones encontradas.`);
            } else if (evt.type === "error") {
              setStatus("error");
              setStatusMsg(`Error: ${evt.message}`);
            }
          } catch {
            // skip malformed events
          }
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        setStatus("idle");
        setStatusMsg("Búsqueda detenida");
      } else {
        setStatus("error");
        setStatusMsg(err instanceof Error ? err.message : "Error desconocido");
      }
    }
  }, []);

  const handleStop = () => {
    abortRef.current?.abort();
    setStatus("idle");
    setStatusMsg("Agente detenido");
  };

  const sortedResults = [...results].sort((a, b) => a.priceUSD - b.priceUSD);
  const alertCount = sortedResults.filter((f) => f.isAlert).length;

  return (
    <main className="min-h-screen radar-grid">
      {/* Top bar */}
      <header className="border-b border-dim bg-void/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-pulse font-bold tracking-widest text-sm">
              FLIGHT<span className="text-sky">AGENT</span>
            </span>
            <span className="tag">v1.0</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono text-muted">
            <span>
              resultados:{" "}
              <span className="text-text">{results.length}</span>
            </span>
            {alertCount > 0 && (
              <span className="text-pulse glow-text">
                {alertCount} en rango ✓
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* LEFT: form panel */}
        <aside className="space-y-4">
          {/* Panel title */}
          <div>
            <h1 className="font-display text-2xl font-bold text-text leading-tight">
              Agente de<br />
              <span className="text-pulse">Vuelos Baratos</span>
            </h1>
            <p className="text-xs text-muted mt-1 font-body">
              Escaneo automático · Múltiples mercados · Estrategias pro
            </p>
          </div>

          <div className="border border-dim rounded-lg bg-radar/30 p-5 backdrop-blur-sm">
            <SearchForm
              onSearch={handleSearch}
              isSearching={status === "running"}
              onStop={handleStop}
            />
          </div>

          {/* Tips box */}
          <div className="border border-dim/50 rounded bg-void/50 p-4 text-xs text-muted space-y-1.5 font-body">
            <div className="text-pulse font-mono text-[10px] uppercase tracking-wider mb-2">// Consejos del agente</div>
            <p>🌍 Mercados CO/BR/CL suelen tener 10–20% de descuento en tarifas regionales.</p>
            <p>🕒 Las mejores ofertas duran pocas horas. Configurá alertas a las 2AM y 6AM.</p>
            <p>🔁 Open Jaw puede salir más barato que ida/vuelta al mismo aeropuerto.</p>
            <p>✈️ Si el precio normal es USD 1400 y aparece a USD 780, no esperés más.</p>
          </div>
        </aside>

        {/* RIGHT: results panel */}
        <section className="space-y-4">
          <AgentStatus
            status={status}
            count={results.length}
            message={statusMsg}
            totalScans={totalScans}
          />

          {/* Results */}
          {results.length === 0 && status === "idle" && (
            <div className="border border-dim/40 rounded-lg bg-radar/10 flex flex-col items-center justify-center py-24 text-center">
              <div className="text-4xl mb-4 opacity-20">✈</div>
              <p className="font-mono text-muted text-sm">
                Sin resultados todavía
              </p>
              <p className="text-xs text-muted/60 mt-1">
                Configurá los parámetros y lanzá el agente
              </p>
            </div>
          )}

          {results.length === 0 && status === "running" && (
            <div className="border border-pulse/20 rounded-lg bg-radar/10 flex flex-col items-center justify-center py-24 text-center">
              <div className="text-4xl mb-4 animate-bounce opacity-60">🔍</div>
              <p className="font-mono text-pulse text-sm animate-pulse">
                Escaneando fuentes...
              </p>
              <p className="text-xs text-muted mt-1">
                Google Flights · Skyscanner · Kiwi · Kayak · Momondo
              </p>
            </div>
          )}

          {/* Flight cards */}
          <div className="space-y-3">
            {sortedResults.map((flight, i) => (
              <FlightCard key={flight.id} flight={flight} index={i} />
            ))}
          </div>

          {/* Summary when done */}
          {status === "done" && results.length > 0 && (
            <div className="border border-sky/20 rounded bg-sky/5 p-4 text-sm text-muted font-body">
              <span className="text-sky font-mono text-xs">// RESUMEN</span>
              <div className="mt-2 grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-display font-bold text-text">
                    {results.length}
                  </div>
                  <div className="text-xs text-muted">vuelos encontrados</div>
                </div>
                <div>
                  <div className="text-xl font-display font-bold text-pulse">
                    {alertCount}
                  </div>
                  <div className="text-xs text-muted">en tu rango</div>
                </div>
                <div>
                  <div className="text-xl font-display font-bold text-text">
                    USD {Math.min(...results.map((r) => r.priceUSD)).toLocaleString()}
                  </div>
                  <div className="text-xs text-muted">precio más bajo</div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
