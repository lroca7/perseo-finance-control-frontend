import { createBrowserRouter } from 'react-router-dom'
import App from './App'
import { cardsRoutes } from '../modules/cards/routes'
import { expensesRoutes } from '../modules/expenses/routes'
import { savingsRoutes } from '../modules/savings/routes'

/** Cada módulo exporta sus rutas; para agregar uno nuevo basta sumar su `xxxRoutes` aquí. */
export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [...cardsRoutes, ...savingsRoutes, ...expensesRoutes]
  }
])
