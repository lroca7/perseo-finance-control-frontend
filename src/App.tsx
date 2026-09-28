import { Outlet, Link } from 'react-router-dom'

export default function App() {
  return (
    <div className="wrap">
      <header style={{ marginBottom: 22 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ fontSize: 24, color: 'var(--text)' }}>Perseo Finance</h1>
        </Link>
        <p className="muted">Control de tarjetas de crédito</p>
      </header>
      <Outlet />
    </div>
  )
}
