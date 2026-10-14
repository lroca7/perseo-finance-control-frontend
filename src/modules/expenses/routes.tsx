import type { RouteObject } from 'react-router-dom'
import './expenses.css'
import ExpensesPage from './pages/ExpensesPage'

/**
 * Rutas del módulo de gastos (relativas al layout principal). Se agregan al router con
 * `...expensesRoutes` dentro de los `children` de la ruta que renderiza <App />.
 * Prototipo HU-1: solo `/gastos` (el reporte anual será la HU-2).
 */
export const expensesRoutes: RouteObject[] = [{ path: 'gastos', element: <ExpensesPage /> }]
