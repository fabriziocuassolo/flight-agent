"use client";

import { useState, useRef, useCallback } from "react";
import SearchForm from "@/components/SearchForm";
import FlightCard from "@/components/FlightCard";
import AgentStatus from "@/components/AgentStatus";
import type { SearchParams, FlightResult, AgentStatus as TStatus, LogEntry, LogType } from "@/lib/types";
import { PLATFORMS } from "@/lib/sources";

const PLATFORM_LABEL: Record<string, string> = Object.fromEntries(PLATFORMS.map((p) => [p.key, p.label]));

type ScanSource = { name: string; state: "idle" | "scanning" | "done" };

function ts() {
  return new Date().toLocaleTimeString("es-AR");
}

export default function Home() {
  const [results, setResults]         = useState<FlightResult[]>([]);
  const [status, setStatus]           = useState<TStatus>("idle");
  const [logs, setLogs]               = useState<LogEntry[]>([]);
  const [scanSources, setScanSources] = useState<ScanSource[]>([]);
  const [scanProgress, setScanProgress] = useState(0);
  const [lastSearch, setLastSearch]   = useState("");
  const [sortBy, setSortBy]           = useState("price");
  const [maxResults, setMaxResults]   = useState(20);
  const [maxPrice, setMaxPrice]       = useState(1200);

  const abortRef   = useRef<AbortController | null>(null);
  const scanRef    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const addLog = useCallback((msg: string, type: LogType = "info") => {
    setLogs((prev) => [...prev, { ts: ts(), msg, type }]);
  }, []);

  // Animate scan sources
  const animateScan = useCallback(
    (platforms: string[], onDone: () => void) => {
      const sources: ScanSource[] = platforms.map((k) => ({ name: PLATFORM_LABEL[k] || k, state: "idle" }));
      setScanSources(sources);
      setScanProgress(0);

      let i = 0;
      const step = () => {
        setScanSources((prev) => {
          const next = [...prev];
          if (i > 0) next[i - 1] = { ...next[i - 1], state: "done" };
          if (i < next.length) next[i] = { ...next[i], state: "scanning" };
          return next;
        });
        setScanProgress(Math.round((i / platforms.length) * 100));
        if (i < platforms.length) addLog(`Rastreando ${PLATFORM_LABEL[platforms[i]] || platforms[i]}...`, "scan");
        i++;
        if (i <= platforms.length) {
          scanRef.current = setTimeout(step, 400 + Math.random() * 500);
        } else {
          setScanProgress(100);
          setScanSources((prev) => prev.map((s) => ({ ...s, state: "done" })));
          setTimeout(() => { setScanSources([]); setScanProgress(0); onDone(); }, 500);
        }
      };
      step();
    },
    [addLog]
  );

  const handleSearch = useCallback(async (params: SearchParams) => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;

    setResults([]);
    setStatus("running");
    setMaxResults(params.maxResults);
    setMaxPrice(params.maxPrice);
    addLog(`Agente iniciado. Ruta: ${params.origin} → ${params.destination}. Máx: USD ${params.maxPrice}`, "ok");
    addLog(`Plataformas: ${params.platforms.map((k) => PLATFORM_LABEL[k]).filter(Boolean).join(", ")}`, "info");

    animateScan(params.platforms, async () => {
      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(params),
          signal: ctrl.signal,
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
                addLog(evt.message, "info");
              } else if (evt.type === "flight") {
                setResults((prev) => [...prev, evt.flight]);
                addLog(`+1 vuelo encontrado · USD ${evt.flight.pricePerPerson} · ${evt.flight.airline}`, "ok");
                setLastSearch(ts());
              } else if (evt.type === "done") {
                setStatus("done");
                addLog(`Escaneo completado. ${evt.total} vuelos encontrados.`, "ok");
                setLastSearch(ts());
              } else if (evt.type === "error") {
                setStatus("error");
                addLog(`Error: ${evt.message}`, "err");
              }
            } catch { /* skip */ }
          }
        }
      } catch (err: unknown) {
        if (err instanceof Error && err.name === "AbortError") {
          setStatus("idle");
          addLog("Búsqueda detenida por el usuario.", "warn");
        } else {
          setStatus("error");
          addLog(err instanceof Error ? err.message : "Error desconocido", "err");
        }
      }
    });
  }, [addLog, animateScan]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
    if (scanRef.current) clearTimeout(scanRef.current);
    setScanSources([]);
    setScanProgress(0);
    setStatus("idle");
    addLog("Agente detenido por el usuario.", "warn");
  }, [addLog]);

  const handleClear = useCallback(() => {
    setResults([]);
    setLogs([]);
    setScanSources([]);
    setScanProgress(0);
    addLog("Resultados limpiados.", "warn");
  }, [addLog]);

  const handleExport = useCallback(() => {
    if (!results.length) { addLog("No hay resultados para exportar.", "warn"); return; }
    const rows = [["Aerolínea","Origen","Destino","Salida","Llegada","Duración","Escalas","Fecha","Día","Precio USD","Total USD","Plataforma"]];
    getSorted(results, sortBy).forEach((f) => {
      rows.push([f.airline,f.origin,f.destination,f.depTime,f.arrTime,`${f.durH}h${f.durMin}m`,String(f.stops),f.departureDate,f.dayOfWeek,String(f.pricePerPerson),String(f.totalPrice),f.source]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `vuelos_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    addLog(`Exportados ${results.length} vuelos a CSV.`, "ok");
  }, [results, sortBy, addLog]);

  const handleAITip = useCallback(async () => {
    addLog("Consultando análisis IA...", "info");
    try {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 600,
          messages: [{ role: "user", content: "Sos un experto en vuelos desde Argentina. Dame 3 tips ultra-concretos y cortos (max 2 líneas cada uno) para conseguir pasajes baratos a Europa. Formato: 1. tip. 2. tip. 3. tip. Sin preámbulo." }],
        }),
      });
      const data = await resp.json();
      const txt = data.content?.find((b: { type: string; text?: string }) => b.type === "text")?.text || "Sin respuesta";
      txt.split(/\n/).filter((l: string) => l.trim()).forEach((line: string) => addLog("🤖 " + line, "ok"));
    } catch {
      addLog("Error IA. Tip: Buscá mar/mié, franjas 6-10h y 22-24h en mercados CO/BR.", "warn");
    }
  }, [addLog]);

  const sorted = getSorted(results, sortBy).slice(0, maxResults);
  const bestPrice = results.length ? Math.min(...results.map((f) => f.pricePerPerson)) : null;
  const activePlatforms = results.length > 0
    ? Array.from(new Set(results.map((f) => f.source))).length
    : PLATFORMS.filter((p) => p.defaultOn).length;

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      {/* ── HEADER ─────────────────────────── */}
      <header style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "0 28px",
        height: 56,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        position: "sticky",
        top: 0,
        zIndex: 100,
      }}>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.6rem", letterSpacing: "0.08em", color: "var(--accent)", textShadow: "0 0 20px rgba(0,229,255,0.4)" }}>
          Agente<span style={{ color: "var(--text)" }}>Vuelos</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7, fontFamily: "'DM Mono',monospace", fontSize: "0.72rem", letterSpacing: "0.05em", color: "var(--muted2)" }}>
            <div style={{
              width: 7, height: 7, borderRadius: "50%",
              background: status === "running" ? "var(--green)" : "var(--muted)",
              boxShadow: status === "running" ? "0 0 8px var(--green)" : "none",
              animation: status === "running" ? "blink 1s infinite" : "none",
              transition: "background 0.3s",
            }} />
            <span>{status === "running" ? "RASTREANDO" : "INACTIVO"}</span>
          </div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.65rem", color: "var(--muted)", letterSpacing: "0.1em" }}>v2.0 · AGENTE</div>
        </div>
      </header>

      {/* ── BODY ─────────────────────────── */}
      <div style={{ display: "flex", minHeight: "calc(100vh - 56px)" }}>

        {/* LEFT */}
        <SearchForm
          onSearch={handleSearch}
          onStop={handleStop}
          onClear={handleClear}
          onExport={handleExport}
          onAITip={handleAITip}
          isSearching={status === "running"}
        />

        {/* RIGHT */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "var(--bg)", minHeight: "calc(100vh - 56px)", overflow: "hidden" }}>

          <AgentStatus
            status={status}
            logs={logs}
            scanSources={scanSources}
            scanProgress={scanProgress}
            flightCount={sorted.length}
            bestPrice={bestPrice}
            platformCount={activePlatforms}
            lastSearch={lastSearch}
            sortBy={sortBy}
            onSortChange={setSortBy}
          />

          {/* Flight list */}
          <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 10, overflowY: "auto" }}>

            {results.length === 0 && status === "idle" && <IdleState />}
            {results.length === 0 && status === "running" && <SearchingState />}

            {sorted.map((f, i) => (
              <FlightCard key={f.id} flight={f} rank={i} maxPrice={maxPrice} />
            ))}

            {status === "done" && results.length > 0 && (
              <div style={{
                border: "1px solid rgba(0,229,255,0.2)", borderRadius: "var(--radius)",
                background: "rgba(0,229,255,0.04)", padding: 16,
              }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.65rem", color: "var(--accent)", letterSpacing: "0.1em", marginBottom: 12 }}>
                  // RESUMEN
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, textAlign: "center" }}>
                  <SummaryItem value={String(results.length)} label="vuelos encontrados" />
                  <SummaryItem value={String(results.filter((r) => r.isAlert).length)} label="en tu rango" accent="var(--green)" />
                  <SummaryItem value={bestPrice ? `USD ${bestPrice.toLocaleString()}` : "—"} label="precio más bajo" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes blink { 50% { opacity: 0.4; } }
        @keyframes float { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-10px); } }
        @keyframes sdotBlink { 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}

function getSorted(flights: FlightResult[], by: string): FlightResult[] {
  return [...flights].sort((a, b) => {
    if (by === "price")     return a.pricePerPerson - b.pricePerPerson;
    if (by === "duration")  return a.durH * 60 + a.durMin - (b.durH * 60 + b.durMin);
    if (by === "departure") {
      const ta = a.depTime.replace(":", ""); const tb = b.depTime.replace(":", "");
      return parseInt(ta) - parseInt(tb);
    }
    if (by === "stops") return a.stops - b.stops;
    return a.pricePerPerson - b.pricePerPerson;
  });
}

function IdleState() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 40px", textAlign: "center", gap: 16 }}>
      <div style={{ fontSize: "3.5rem", opacity: 0.3, animation: "float 3s ease-in-out infinite" }}>🛫</div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.85rem", color: "var(--muted2)", letterSpacing: "0.08em" }}>AGENTE EN ESPERA</div>
      <div style={{ fontSize: "0.78rem", color: "var(--muted)", maxWidth: 380, lineHeight: 1.7 }}>
        Configurá los parámetros en el panel izquierdo y presioná &quot;Iniciar Agente&quot;. Los vuelos van a aparecer acá a medida que se vayan encontrando.
      </div>
    </div>
  );
}

function SearchingState() {
  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "60px 40px", textAlign: "center", gap: 16 }}>
      <div style={{ fontSize: "3.5rem", animation: "float 1.5s ease-in-out infinite" }}>🔍</div>
      <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.85rem", color: "var(--accent)", letterSpacing: "0.08em" }}>BUSCANDO...</div>
      <div style={{ fontSize: "0.78rem", color: "var(--muted)", maxWidth: 380, lineHeight: 1.7 }}>
        El agente está rastreando las plataformas. Los resultados aparecerán en segundos.
      </div>
    </div>
  );
}

function SummaryItem({ value, label, accent }: { value: string; label: string; accent?: string }) {
  return (
    <div>
      <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: "1.8rem", color: accent || "var(--text)" }}>{value}</div>
      <div style={{ fontSize: "0.72rem", color: "var(--muted)", fontFamily: "'DM Mono',monospace" }}>{label}</div>
    </div>
  );
}
