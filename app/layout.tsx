import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FlightAgent — Rastreador de Vuelos Baratos",
  description: "Agente automático que monitorea vuelos baratos en múltiples plataformas y te alerta cuando encuentra el precio ideal.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
