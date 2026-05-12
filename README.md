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


## APIs reales configuradas

Esta versión soporta dos fuentes reales:

### Amadeus
Variables necesarias en Vercel:

```txt
AMADEUS_CLIENT_ID
AMADEUS_CLIENT_SECRET
AMADEUS_BASE_URL=https://test.api.amadeus.com
```

### SerpApi Google Flights
Variable necesaria en Vercel:

```txt
SERPAPI_KEY
```

Si no configurás keys, la app cae a modo demo para que la UI siga funcionando.


## Worker externo opcional

Para fuentes que no tengan API directa, configurá:

```txt
SCRAPER_WORKER_URL
SCRAPER_WORKER_TOKEN
```

Contrato esperado:

```json
{
  "flights": [
    {
      "origin": "COR",
      "destination": "MAD",
      "airline": "Iberia",
      "departureDate": "2026-09-10",
      "depTime": "10:30",
      "arrTime": "05:20",
      "durH": 13,
      "durMin": 50,
      "stops": 1,
      "pricePerPerson": 820,
      "currency": "USD",
      "source": "Worker externo",
      "bookingUrl": "https://..."
    }
  ]
}
```

No se incluye código de evasión anti-bot ni resolución de captchas dentro de Vercel. La app queda preparada para consumir un worker externo que devuelva datos normalizados.
