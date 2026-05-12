"use client";

import { useEffect, useRef } from "react";
import type { LogEntry, AgentStatus } from "@/lib/types";

interface Props {
  status: AgentStatus;
  logs: LogEntry[];
  scanSources: { name: string; state: "idle" | "scanning" | "done" }[];
  scanProgress: number;  // 0-100
  flightCount: number;
  bestPrice: number | null;
  platformCount: number;
  lastSearch: string;
  sortBy: string;
  onSortChange: (v: string) => void;
}

export default function AgentStatus({
  status, logs, scanSources, scanProgress,
  flightCount, bestPrice, platformCount, lastSearch,
  sortBy, onSortChange,
}: Props) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const statusLabel = status === "running" ? "RASTREANDO" : status === "done" ? "COMPLETADO" : status === "error" ? "ERROR" : "INACTIVO";
  const dotRunning = status === "running";

  return (
    <>
      {/* ── AGENT LOG ─────────────────────── */}
      <div ref={logRef} style={{
        background: "var(--surface)",
        borderBottom: "1px solid var(--border)",
        padding: "14px 24px",
        fontFamily: "'DM Mono',monospace",
        fontSize: "0.72rem",
        lineHeight: 1.6,
        color: "var(--muted2)",
        minHeight: 80,
        maxHeight: 140,
        overflowY: "auto",
      }}>
        {logs.length === 0 && (
          <div style={{ display: "flex", gap: 10 }}>
            <span style={{ color: "var(--muted)" }}>--:--:--</span>
            <span className="log-info">Sistema listo. Configurá los parámetros y presioná INICIAR AGENTE.</span>
          </div>
        )}
        {logs.map((l, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 2 }}>
            <span style={{ color: "var(--muted)", flexShrink: 0 }}>{l.ts}</span>
            <span className={`log-${l.type}`}>{l.msg}</span>
          </div>
        ))}
      </div>

      {/* ── STATS BAR ─────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid var(--border)" }}>
        {[
          ["Vuelos encontrados", flightCount, false],
          ["Mejor precio", bestPrice ? `USD ${bestPrice.toLocaleString()}` : "—", true],
          ["Plataformas", platformCount, false],
          ["Última búsqueda", lastSearch || "—", false],
          ["Estado", statusLabel, false],
        ].map(([label, value, highlight], i, arr) => (
          <div key={label as string} style={{
            flex: 1, padding: "12px 20px",
            borderRight: i < arr.length - 1 ? "1px solid var(--border)" : "none",
            display: "flex", flexDirection: "column", gap: 2,
          }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.62rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--muted)" }}>
              {label as string}
            </div>
            <div style={{
              fontFamily: "'DM Mono',monospace", fontSize: "1.1rem", fontWeight: 500,
              color: highlight ? "var(--green)" : "var(--text)", transition: "color 0.3s",
            }}>
              {String(value)}
            </div>
          </div>
        ))}
      </div>

      {/* ── SCAN PROGRESS ─────────────────── */}
      {scanSources.length > 0 && (
        <div style={{ padding: "12px 24px 14px" }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
            {scanSources.map((s) => (
              <div key={s.name} className={`scan-source ${s.state === "idle" ? "" : s.state}`}>
                <div style={{
                  width: 5, height: 5, borderRadius: "50%", background: "currentColor",
                  animation: s.state === "scanning" ? "sdotBlink 0.8s infinite" : "none",
                }} />
                {s.name}
              </div>
            ))}
          </div>
          <div style={{ height: 2, background: "var(--border)", borderRadius: 1, overflow: "hidden" }}>
            <div style={{
              height: "100%",
              background: "linear-gradient(to right, var(--accent), var(--green))",
              transition: "width 0.4s ease",
              width: `${scanProgress}%`,
            }} />
          </div>
        </div>
      )}

      {/* ── RESULTS TOOLBAR ───────────────── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 24px", borderBottom: "1px solid var(--border)",
        gap: 12, flexWrap: "wrap",
      }}>
        <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.78rem", color: "var(--muted2)", letterSpacing: "0.06em" }}>
          Resultados: <strong style={{ color: "var(--text)" }}>{flightCount} vuelos</strong>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <label style={{ fontSize: "0.72rem", color: "var(--muted2)", whiteSpace: "nowrap" }}>Ordenar por</label>
          <select className="field-input" value={sortBy} onChange={(e) => onSortChange(e.target.value)}
            style={{ width: "auto", padding: "6px 10px", fontSize: "0.75rem" }}>
            <option value="price">Precio (menor primero)</option>
            <option value="duration">Duración</option>
            <option value="departure">Hora de salida</option>
            <option value="stops">Escalas</option>
          </select>
        </div>
      </div>
    </>
  );
}
