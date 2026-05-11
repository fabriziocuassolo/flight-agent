# ✈ FlightAgent — Rastreador de Vuelos Baratos

Agente IA que escanea múltiples plataformas de vuelos y te muestra las mejores opciones en tiempo real, usando estrategias avanzadas de búsqueda.

## 🚀 Setup rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env.local
```

Editá `.env.local` y agregá tu Anthropic API key:
```
ANTHROPIC_API_KEY=sk-ant-...
```

Conseguís tu API key en: https://console.anthropic.com/

### 3. Correr en desarrollo
```bash
npm run dev
```

Abrí http://localhost:3000

---

## 📦 Deploy en Vercel

### Opción A — Vercel CLI
```bash
npm i -g vercel
vercel
```

### Opción B — GitHub + Vercel (recomendado)
1. Subí este proyecto a un repo de GitHub
2. Entrá a https://vercel.com/new
3. Importá el repo
4. En "Environment Variables" agregá:
   - `ANTHROPIC_API_KEY` = tu key de Anthropic
5. Click "Deploy" ✅

---

## 🧠 Cómo funciona el agente

El agente usa Claude AI (Sonnet 4) para:

1. **Analizar la ruta** y aplicar estrategias de búsqueda avanzadas
2. **Simular múltiples mercados**: Argentina, Colombia, Brasil, Chile, España, USA
3. **Aplicar estrategias**: hidden-city, open-jaw, aeropuertos vecinos
4. **Ordenar por precio** y destacar opciones dentro del rango configurado
5. **Mostrar resultados en streaming** a medida que los encuentra

### Estrategias disponibles
- **Hidden City**: Tickets donde el destino real está antes del destino del ticket
- **Open Jaw**: Volar a un aeropuerto y volver desde otro
- **Aeropuertos vecinos**: Comparar Madrid vs Lisboa vs Roma
- **Error Fares**: Tarifas con errores de precio (aparecen en Fly4free, Secret Flying)

### Plataformas monitoreadas
- Google Flights
- Skyscanner  
- Kayak
- Momondo
- Kiwi
- Turismocity
- Skiplagged (para hidden-city)

---

## 🔮 Roadmap / próximas features

- [ ] Notificaciones por email/WhatsApp cuando aparece una oferta
- [ ] Historial de búsquedas guardado
- [ ] Modo background con cron jobs (Vercel Cron)
- [ ] Integración con APIs reales: Amadeus, Skyscanner API
- [ ] Comparativa de precios históricos
- [ ] Alertas por Telegram

---

## 📁 Estructura del proyecto

```
flight-agent/
├── app/
│   ├── api/
│   │   └── search/
│   │       └── route.ts      # Endpoint SSE para streaming de resultados
│   ├── globals.css           # Design system (radar aesthetic)
│   ├── layout.tsx
│   └── page.tsx              # UI principal
├── components/
│   ├── SearchForm.tsx        # Formulario de búsqueda con todos los parámetros
│   ├── FlightCard.tsx        # Tarjeta de resultado de vuelo
│   └── AgentStatus.tsx       # Barra de estado del agente
├── lib/
│   ├── agent.ts              # Lógica del agente IA
│   ├── sources.ts            # URLs y configuración de fuentes
│   └── types.ts              # TypeScript types
├── .env.example
├── next.config.js
├── tailwind.config.ts
└── package.json
```

---

## 💡 Consejos para conseguir los mejores vuelos

1. **Configurá búsquedas a las 2AM y 6AM** — muchas actualizaciones tarifarias ocurren de madrugada
2. **Habilitá múltiples mercados** — CO y BR suelen tener tarifas 10-20% más baratas
3. **Probá Open Jaw** — ida a Madrid, vuelta desde Lisboa o París puede ser más barato
4. **No esperes "a ver si baja más"** — si el precio es 40% debajo del normal, comprá
5. **Activá Error Fares** — aparecen pocas veces pero son joyas (business class regalada, etc.)
