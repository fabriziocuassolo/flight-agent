"use client";

interface Props {
  status: "idle" | "running" | "done" | "error";
  count: number;
  message: string;
  totalScans: number;
}

export default function AgentStatus({ status, count, message, totalScans }: Props) {
  const statusColors = {
    idle: "text-muted",
    running: "text-pulse",
    done: "text-sky",
    error: "text-alert",
  };

  const statusIcons = {
    idle: "○",
    running: "◉",
    done: "●",
    error: "✕",
  };

  return (
    <div className="border border-dim rounded bg-radar/30 p-3 font-mono text-xs">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`${statusColors[status]} ${status === "running" ? "animate-pulse" : ""}`}>
            {statusIcons[status]}
          </span>
          <span className={statusColors[status]}>
            {status === "idle" && "INACTIVO"}
            {status === "running" && "ESCANEANDO"}
            {status === "done" && "COMPLETADO"}
            {status === "error" && "ERROR"}
          </span>
          <span className="text-muted/50">|</span>
          <span className="text-muted">{message}</span>
        </div>
        <div className="flex items-center gap-4 text-muted">
          <span>
            vuelos: <span className="text-text">{count}</span>
          </span>
          <span>
            escaneos: <span className="text-text">{totalScans}</span>
          </span>
        </div>
      </div>

      {/* Progress bar */}
      {status === "running" && (
        <div className="mt-2 h-0.5 bg-dim rounded overflow-hidden">
          <div
            className="h-full bg-pulse rounded transition-all duration-500"
            style={{
              width: "100%",
              animation: "progressScan 2s ease-in-out infinite",
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes progressScan {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
}
