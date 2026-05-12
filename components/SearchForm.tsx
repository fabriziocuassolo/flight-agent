"use client";

import { useState, useEffect } from "react";
import type { SearchParams } from "@/lib/types";
import { ORIGINS, DESTINATIONS, PLATFORMS } from "@/lib/sources";

const DAY_CHIPS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
const TIME_CHIPS = [
  { val: "madrugada", label: "🌙 Madrugada" },
  { val: "mañana",    label: "🌅 Mañana"    },
  { val: "mediodia",  label: "☀️ Mediodía"  },
  { val: "noche",     label: "🌃 Noche"     },
];
const STRATEGIES = [
  { id: "hidden-city",    label: "Hidden City",        desc: "Bajás antes del destino final del ticket" },
  { id: "openjaw",        label: "Open Jaw",           desc: "Ida a un aeropuerto, vuelta desde otro" },
  { id: "nearby-airports",label: "Aeropuertos Vecinos",desc: "Busca en aeropuertos alternativos cercanos" },
  { id: "error-fares",    label: "Error Fares",        desc: "Monitorea tarifas con errores de precio" },
];
const MARKETS = [
  { code: "AR", label: "🇦🇷 AR" },
  { code: "CO", label: "🇨🇴 CO" },
  { code: "BR", label: "🇧🇷 BR" },
  { code: "CL", label: "🇨🇱 CL" },
  { code: "US", label: "🇺🇸 US" },
  { code: "ES", label: "🇪🇸 ES" },
];

interface Props {
  onSearch: (p: SearchParams) => void;
  onStop: () => void;
  onClear: () => void;
  onExport: () => void;
  onAITip: () => void;
  isSearching: boolean;
}

function defaultDates() {
  const today = new Date();
  const from = new Date(today); from.setDate(from.getDate() + 7);
  const to = new Date(today); to.setMonth(to.getMonth() + 3);
  return {
    startDate: from.toISOString().slice(0, 10),
    endDate: to.toISOString().slice(0, 10),
  };
}

const defaultPlatforms = PLATFORMS.filter((p) => p.defaultOn).map((p) => p.key);

export default function SearchForm({ onSearch, onStop, onClear, onExport, onAITip, isSearching }: Props) {
  const { startDate, endDate } = defaultDates();

  const [params, setParams] = useState<SearchParams>({
    origin: "COR",
    destination: "MAD",
    startDate,
    endDate,
    adults: 1,
    children: 0,
    infants: 0,
    cabinClass: "economy",
    minPrice: 0,
    maxPrice: 1200,
    stops: "any",
    tripLength: "any",
    preferredDays: ["MAR", "MIÉ"],
    preferredSlots: ["madrugada", "mañana", "noche"],
    timeFrom: "00:00",
    timeTo: "23:59",
    platforms: defaultPlatforms,
    findCheapest: true,
    priceAlert: true,
    checkInterval: 15,
    maxResults: 20,
    autoSort: true,
    countries: ["AR", "CO", "BR", "CL"],
    strategies: ["nearby-airports"],
  });

  const set = <K extends keyof SearchParams>(key: K, val: SearchParams[K]) =>
    setParams((p) => ({ ...p, [key]: val }));

  const toggleArr = (key: "preferredDays" | "preferredSlots" | "strategies" | "countries" | "platforms", val: string) => {
    const arr = params[key] as string[];
    set(key, arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]);
  };

  const togglePlatform = (key: string) => toggleArr("platforms", key);
  const activePlatformCount = params.platforms.length;

  return (
    <aside
      className="config-panel"
      style={{
        background: "var(--surface)",
        borderRight: "1px solid var(--border)",
        height: "calc(100vh - 56px)",
        overflowY: "auto",
        position: "sticky",
        top: 56,
        width: 420,
        flexShrink: 0,
        zIndex: 10,
      }}
    >
      {/* ── RUTA ─────────────────────────── */}
      <div style={sectionStyle}>
        <div className="section-label">✈️ Ruta</div>
        <div style={rowStyle}>
          <div style={{ flex: 1 }}>
            <FieldLabel>Origen</FieldLabel>
            <select className="field-input" value={params.origin} onChange={(e) => set("origin", e.target.value)}>
              {ORIGINS.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
          </div>
          <div style={{ flex: 1 }}>
            <FieldLabel>Destino</FieldLabel>
            <select className="field-input" value={params.destination} onChange={(e) => set("destination", e.target.value)}>
              {DESTINATIONS.map((g) => (
                <optgroup key={g.group} label={g.group}>
                  {g.options.map((o) => <option key={o.code} value={o.code}>{o.label}</option>)}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <FieldLabel>Escalas permitidas</FieldLabel>
          <select className="field-input" value={params.stops} onChange={(e) => set("stops", e.target.value as SearchParams["stops"])}>
            <option value="any">Cualquiera (más barato)</option>
            <option value="0">Solo directo</option>
            <option value="1">Máximo 1 escala</option>
            <option value="2">Máximo 2 escalas</option>
          </select>
        </div>
      </div>

      {/* ── FECHAS ─────────────────────────── */}
      <div style={sectionStyle}>
        <div className="section-label">📅 Fechas de viaje</div>
        <div style={rowStyle}>
          <div style={{ flex: 1 }}>
            <FieldLabel>Inicio búsqueda</FieldLabel>
            <input type="date" className="field-input" value={params.startDate} onChange={(e) => set("startDate", e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <FieldLabel>Fin búsqueda</FieldLabel>
            <input type="date" className="field-input" value={params.endDate} onChange={(e) => set("endDate", e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <FieldLabel>Duración del viaje</FieldLabel>
          <select className="field-input" value={params.tripLength} onChange={(e) => set("tripLength", e.target.value as SearchParams["tripLength"])}>
            <option value="any">Flexible (cualquiera)</option>
            <option value="7">~7 noches</option>
            <option value="10">~10 noches</option>
            <option value="14">~14 noches</option>
            <option value="21">~21 noches</option>
            <option value="30">~30 noches</option>
          </select>
        </div>
        <div style={{ marginTop: 10 }}>
          <FieldLabel style={{ marginBottom: 8 }}>Días de salida preferidos</FieldLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {DAY_CHIPS.map((d) => (
              <button key={d} type="button"
                className={`chip ${params.preferredDays.includes(d) ? "selected" : ""}`}
                onClick={() => toggleArr("preferredDays", d)}>{d}</button>
            ))}
            <button type="button"
              className={`chip ${params.preferredDays.length === DAY_CHIPS.length ? "selected" : ""}`}
              onClick={() => set("preferredDays", params.preferredDays.length === DAY_CHIPS.length ? [] : [...DAY_CHIPS])}>
              TODOS
            </button>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <ToggleField
            checked={params.findCheapest}
            onChange={() => set("findCheapest", !params.findCheapest)}
          >
            <strong style={toggleTitleStyle}>🔍 Buscar el más barato en el rango</strong>
            <span style={toggleDescStyle}>El agente revisará TODOS los días del rango</span>
          </ToggleField>
        </div>
      </div>

      {/* ── HORARIOS ─────────────────────────── */}
      <div style={sectionStyle}>
        <div className="section-label">🕐 Horarios a consultar</div>
        <div style={rowStyle}>
          <div style={{ flex: 1 }}>
            <FieldLabel>Salida desde</FieldLabel>
            <input type="time" className="field-input" value={params.timeFrom} onChange={(e) => set("timeFrom", e.target.value)} />
          </div>
          <div style={{ flex: 1 }}>
            <FieldLabel>Salida hasta</FieldLabel>
            <input type="time" className="field-input" value={params.timeTo} onChange={(e) => set("timeTo", e.target.value)} />
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <FieldLabel style={{ marginBottom: 8 }}>Franjas horarias preferidas</FieldLabel>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {TIME_CHIPS.map((t) => (
              <button key={t.val} type="button"
                className={`chip ${params.preferredSlots.includes(t.val) ? "selected" : ""}`}
                onClick={() => toggleArr("preferredSlots", t.val)}>{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── PASAJEROS & PRECIO ─────────────────── */}
      <div style={sectionStyle}>
        <div className="section-label">👥 Pasajeros & Precio</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {([["adults","Adultos",1,9],["children","Niños",0,8],["infants","Bebés",0,4]] as const).map(([k,label,min,max]) => (
            <div key={k}>
              <FieldLabel>{label}</FieldLabel>
              <input type="number" className="field-input" value={params[k] as number}
                min={min} max={max}
                onChange={(e) => set(k, Math.max(min, Math.min(max, +e.target.value)) as never)} />
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10 }}>
          <FieldLabel>Clase</FieldLabel>
          <select className="field-input" value={params.cabinClass} onChange={(e) => set("cabinClass", e.target.value as SearchParams["cabinClass"])}>
            <option value="economy">Económica</option>
            <option value="premium">Premium Económica</option>
            <option value="business">Business</option>
          </select>
        </div>
        <div style={{ marginTop: 10 }}>
          <FieldLabel>Rango de precio por persona (USD)</FieldLabel>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input type="number" className="field-input" placeholder="Min" value={params.minPrice} min={0}
              onChange={(e) => set("minPrice", +e.target.value)} style={{ flex: 1 }} />
            <span style={{ color: "var(--muted)", fontSize: "0.8rem", flexShrink: 0 }}>—</span>
            <input type="number" className="field-input" placeholder="Máx" value={params.maxPrice} min={0}
              onChange={(e) => set("maxPrice", +e.target.value)} style={{ flex: 1 }} />
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <ToggleField checked={params.priceAlert} onChange={() => set("priceAlert", !params.priceAlert)}>
            <strong style={toggleTitleStyle}>🔔 Alertar cuando baje del mínimo</strong>
            <span style={toggleDescStyle}>Resalta los vuelos que entran en tu rango</span>
          </ToggleField>
        </div>
      </div>

      {/* ── PLATAFORMAS ─────────────────────────── */}
      <div style={sectionStyle}>
        <div className="section-label">🌐 Plataformas a rastrear</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {PLATFORMS.map((p) => {
            const on = params.platforms.includes(p.key);
            return (
              <button key={p.key} type="button"
                className={`platform-toggle ${on ? "on" : ""}`}
                onClick={() => togglePlatform(p.key)}>
                <div className="plat-dot" />
                <span style={{ fontSize: "0.78rem", fontWeight: 500, color: on ? "var(--text)" : "var(--muted2)", transition: "color 0.15s" }}>
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── MERCADOS & ESTRATEGIAS ───────────────── */}
      <div style={sectionStyle}>
        <div className="section-label">🗺️ Mercados a consultar</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {MARKETS.map((m) => (
            <button key={m.code} type="button"
              className={`chip ${params.countries.includes(m.code) ? "selected" : ""}`}
              onClick={() => toggleArr("countries", m.code)}>{m.label}</button>
          ))}
        </div>
        <div style={{ marginTop: 14 }}>
          <div className="section-label" style={{ marginBottom: 10 }}>🧠 Estrategias</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {STRATEGIES.map((s) => {
              const on = params.strategies.includes(s.id);
              return (
                <button key={s.id} type="button"
                  className={`toggle-field ${on ? "active" : ""}`}
                  style={{ textAlign: "left" }}
                  onClick={() => toggleArr("strategies", s.id)}>
                  <div style={{ width: 16, height: 16, borderRadius: 3, border: `1px solid ${on ? "var(--accent)" : "var(--border2)"}`, background: on ? "var(--accent-dim)" : "transparent", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                    {on && <div style={{ width: 8, height: 8, borderRadius: 1, background: "var(--accent)" }} />}
                  </div>
                  <div>
                    <div style={{ fontSize: "0.82rem", color: "var(--text)", fontWeight: 600, marginBottom: 2 }}>{s.label}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--muted2)", fontFamily: "var(--font-mono, 'DM Mono', monospace)" }}>{s.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── CONFIG DEL AGENTE ───────────────────── */}
      <div style={sectionStyle}>
        <div className="section-label">⚙️ Configuración del agente</div>
        <div>
          <FieldLabel>Frecuencia de rastreo</FieldLabel>
          <select className="field-input" value={params.checkInterval} onChange={(e) => set("checkInterval", +e.target.value)}>
            <option value={5}>Cada 5 minutos</option>
            <option value={15}>Cada 15 minutos</option>
            <option value={30}>Cada 30 minutos</option>
            <option value={60}>Cada hora</option>
            <option value={360}>Cada 6 horas</option>
          </select>
        </div>
        <div style={{ marginTop: 10 }}>
          <FieldLabel>Máximo resultados</FieldLabel>
          <select className="field-input" value={params.maxResults} onChange={(e) => set("maxResults", +e.target.value)}>
            <option value={10}>10 vuelos</option>
            <option value={20}>20 vuelos</option>
            <option value={50}>50 vuelos</option>
            <option value={100}>100 vuelos</option>
          </select>
        </div>
        <div style={{ marginTop: 10 }}>
          <ToggleField checked={params.autoSort} onChange={() => set("autoSort", !params.autoSort)}>
            <strong style={toggleTitleStyle}>↕️ Ordenar automáticamente por precio</strong>
            <span style={toggleDescStyle}>El más barato siempre al tope</span>
          </ToggleField>
        </div>
      </div>

      {/* ── BOTONES ─────────────────────────────── */}
      <div style={{ padding: "20px 24px" }}>
        {isSearching ? (
          <button type="button" onClick={onStop}
            style={{ ...btnBase, background: "var(--red)", boxShadow: "0 0 16px rgba(255,59,92,0.3)" }}>
            <span>■</span>
            <span>DETENER AGENTE</span>
          </button>
        ) : (
          <button type="button" onClick={() => onSearch(params)}
            style={{ ...btnBase, background: "var(--accent)", color: "var(--bg)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#00ccee"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 24px rgba(0,229,255,0.3)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "var(--accent)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "none"; }}>
            <span>▶️</span>
            <span>INICIAR AGENTE</span>
          </button>
        )}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          {[["⌫ Limpiar", onClear], ["↓ Exportar CSV", onExport], ["🤖 Consejo IA", onAITip]].map(([label, handler]) => (
            <button key={label as string} type="button" onClick={handler as () => void}
              style={btnSmBase}
              onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--muted2)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--text)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border2)"; (e.currentTarget as HTMLButtonElement).style.color = "var(--muted2)"; }}>
              {label as string}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}

// ── SUB-COMPONENTS ─────────────────────────────────────────────────────────

function FieldLabel({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <label style={{ display: "block", fontSize: "0.72rem", color: "var(--muted2)", marginBottom: 5, fontWeight: 500, letterSpacing: "0.02em", ...style }}>
      {children}
    </label>
  );
}

function ToggleField({ checked, onChange, children }: { checked: boolean; onChange: () => void; children: React.ReactNode }) {
  return (
    <div className={`toggle-field ${checked ? "active" : ""}`} onClick={onChange}>
      <input type="checkbox" checked={checked} onChange={() => {}} onClick={(e) => e.stopPropagation()}
        style={{ width: 16, height: 16, accentColor: "var(--accent)", cursor: "pointer", flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>{children}</div>
    </div>
  );
}

// ── STYLES ─────────────────────────────────────────────────────────────────

const sectionStyle: React.CSSProperties = {
  borderBottom: "1px solid var(--border)",
  padding: "20px 24px",
};

const rowStyle: React.CSSProperties = {
  display: "flex",
  gap: 10,
};

const toggleTitleStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.82rem",
  color: "var(--text)",
  fontWeight: 600,
  marginBottom: 2,
};

const toggleDescStyle: React.CSSProperties = {
  fontSize: "0.72rem",
  color: "var(--muted2)",
  lineHeight: 1.5,
  fontFamily: "'DM Mono', monospace",
};

const btnBase: React.CSSProperties = {
  width: "100%",
  fontFamily: "'DM Mono', monospace",
  fontSize: "0.85rem",
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  padding: "14px",
  border: "none",
  borderRadius: "var(--radius)",
  cursor: "pointer",
  transition: "all 0.2s",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 10,
  color: "#000",
};

const btnSmBase: React.CSSProperties = {
  flex: 1,
  background: "var(--surface2)",
  color: "var(--muted2)",
  border: "1px solid var(--border2)",
  fontFamily: "'DM Mono', monospace",
  fontSize: "0.72rem",
  fontWeight: 500,
  letterSpacing: "0.06em",
  padding: "9px",
  borderRadius: "var(--radius)",
  cursor: "pointer",
  transition: "all 0.15s",
  textTransform: "uppercase" as const,
};
