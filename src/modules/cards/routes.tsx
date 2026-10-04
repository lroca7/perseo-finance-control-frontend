import type { RouteObject } from 'react-router-dom'
import CardDetailPage from './pages/CardDetailPage'
import CardsPage from './pages/CardsPage'
import LineSimulationPage from './pages/LineSimulationPage'

/** Rutas del módulo de tarjetas (relativas al layout principal). */
export const cardsRoutes: RouteObject[] = [
  { index: true, element: <CardsPage /> },
  { path: 'cards/:cardId', element: <CardDetailPage /> },
  { path: 'lines/:lineId', element: <LineSimulationPage /> }
]
