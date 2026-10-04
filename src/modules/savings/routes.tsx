import type { RouteObject } from 'react-router-dom'
import './savings.css'
import GoalDetailPage from './pages/GoalDetailPage'
import PlanEditorPage from './pages/PlanEditorPage'
import SavingsPage from './pages/SavingsPage'

/**
 * Rutas del módulo de ahorro (relativas al layout principal). Se agregan al router con
 * `...savingsRoutes` dentro de los `children` de la ruta que renderiza <App />.
 */
export const savingsRoutes: RouteObject[] = [
  { path: 'ahorro', element: <SavingsPage /> },
  { path: 'ahorro/metas/:goalId', element: <GoalDetailPage /> },
  { path: 'ahorro/metas/:goalId/planes/nuevo', element: <PlanEditorPage /> },
  { path: 'ahorro/planes/:planId', element: <PlanEditorPage /> }
]
