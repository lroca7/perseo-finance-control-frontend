# Perseo Finance — Frontend

React + TypeScript + Vite, configurado como PWA. Consume la API del backend Kotlin.

## Requisitos
- Node 18+
- El backend corriendo en `http://localhost:8080` (ver `../backend/README.md`)

## Cómo correrlo

```bash
npm install
npm run dev
```

Abre `http://localhost:5173`. En desarrollo, Vite reenvía todo lo que empiece
en `/api` hacia `http://localhost:8080` (ver `vite.config.ts`), así que no hay
que configurar CORS ni URLs distintas entre entornos todavía.

## Estructura

```
src/
  api/        -> cliente HTTP tipado + funciones por recurso (cards, líneas, simulación)
  pages/      -> CardsPage, CardDetailPage, LineSimulationPage
  router/     -> rutas (react-router-dom)
  styles/     -> tokens de diseño globales (misma identidad visual del prototipo validado)
  utils/      -> formateo de moneda, etc.
```

## Flujo de pantallas

1. **`/`** — lista de tarjetas, formulario para crear una nueva.
2. **`/cards/:cardId`** — líneas de crédito de esa tarjeta (ej. REDIFE), formulario para crear una nueva línea.
3. **`/lines/:lineId`** — la pantalla principal: comparativo sin/con abonos, editor de abonos extraordinarios, y el cronograma completo. Todo el cálculo lo hace el backend (`AmortizationEngine`), el frontend solo pinta el resultado.

## Pendiente (no bloqueante para el MVP)
- Login (HU-T.8 pendiente): hoy se usa un `DEV_USER_ID` fijo en `api/endpoints.ts`.
- Estado global (HU-T.12): cada página hace su propio fetch; si la app crece, considerar Zustand o Context para no repetir llamadas.
- Iconos reales de PWA (`public/icon-192.png`, `public/icon-512.png`) — el manifest ya los referencia pero hay que generarlos.
