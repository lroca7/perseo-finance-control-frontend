import { createBrowserRouter } from 'react-router-dom'
import App from '../App'
import CardsPage from '../pages/CardsPage'
import CardDetailPage from '../pages/CardDetailPage'
import LineSimulationPage from '../pages/LineSimulationPage'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <CardsPage /> },
      { path: 'cards/:cardId', element: <CardDetailPage /> },
      { path: 'lines/:lineId', element: <LineSimulationPage /> }
    ]
  }
])
