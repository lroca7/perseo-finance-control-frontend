import { Link, Outlet, useLocation } from 'react-router-dom'
import '../shared/styles/nav.css'

/** Cada módulo nuevo se agrega aquí con su prefijo de ruta (los de "/" van por exclusión). */
const MODULES = [
  { label: 'Tarjetas', to: '/', prefix: null },
  { label: 'Ahorro', to: '/ahorro', prefix: '/ahorro' },
  { label: 'Gastos', to: '/gastos', prefix: '/gastos' }
]

export default function App() {
  const { pathname } = useLocation()
  const activo = MODULES.find((m) => m.prefix && pathname.startsWith(m.prefix)) ?? MODULES[0]

  return (
    <div className="wrap">
      <header style={{ marginBottom: 22 }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <h1 style={{ fontSize: 24, color: 'var(--text)' }}>Perseo Finance</h1>
        </Link>
        <nav className="app-nav" aria-label="Módulos">
          {MODULES.map((m) => (
            <Link key={m.label} to={m.to} className={m === activo ? 'active' : undefined}>
              {m.label}
            </Link>
          ))}
        </nav>
      </header>
      <Outlet />
    </div>
  )
}
