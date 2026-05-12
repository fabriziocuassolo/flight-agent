# AgenteVuelos v2.0 · Next.js

Rastreador inteligente de vuelos baratos desde Argentina a Europa, potenciado por Claude AI.

## Setup

```bash
npm install
```

Crear `.env.local`:
```
ANTHROPIC_API_KEY=tu_api_key_aqui
```

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## Stack

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS**
- **Claude Sonnet** (AI agent)
- **Server-Sent Events** (streaming de resultados)

## Features v2.0

- 🎨 Nuevo diseño oscuro con tema cyan/gold
- ✈️ Selección de origen/destino por código IATA
- 📅 Chips de días de salida preferidos
- 🕐 Franjas horarias configurables
- 👥 Adultos + niños + bebés + clase de cabina
- 🌐 Toggle de plataformas individuales (8 fuentes)
- 🗺️ Mercados alternativos (AR/CO/BR/CL/US/ES)
- 🧠 Estrategias: Hidden City, Open Jaw, Error Fares
- 📊 Barra de estadísticas en tiempo real
- 🔴 Log del agente con timestamps
- 🔄 Animación de escaneo por fuente
- 📥 Exportar resultados a CSV
- 🤖 Consejo IA on-demand
- 🏷️ Cards con badges (Mejor precio / Oferta / Nuevo)
- 🔃 Ordenar por precio / duración / salida / escalas
