import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AgenteVuelos · Panel de Control",
  description: "Rastreador inteligente de vuelos baratos desde Argentina",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
