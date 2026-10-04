import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { savingsApi } from '../api/endpoints'
import type { GoalResponse } from '../api/types'
import GoalCard from '../components/GoalCard'
import GoalForm from '../components/GoalForm'
import type { GoalFormValues } from '../components/GoalForm'
import { DEV_USER_ID } from '../../../shared/config/devUser'
import { errorMessage } from '../../../shared/api/errorMessage'
import { money } from '../../../shared/utils/format'

/** Listado de metas con su avance y estado (HU-A.1, A.17, A.18). */
export default function SavingsPage() {
  const navigate = useNavigate()
  const [goals, setGoals] = useState<GoalResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showArchived, setShowArchived] = useState(false)

  const cargar = useCallback(() => {
    setLoading(true)
    savingsApi.goals
      .list(DEV_USER_ID, showArchived)
      .then((lista) => {
        setGoals(lista)
        setError(null)
      })
      .catch((e) => setError(errorMessage(e, 'No se pudieron cargar las metas')))
      .finally(() => setLoading(false))
  }, [showArchived])

  useEffect(() => {
    cargar()
  }, [cargar])

  const crear = async (values: GoalFormValues) => {
    const meta = await savingsApi.goals.create(DEV_USER_ID, values)
    navigate(`/ahorro/metas/${meta.id}`)
  }

  const activas = goals.filter((g) => g.estado !== 'ARCHIVADA')
  const totalAhorrado = activas.reduce((suma, g) => suma + g.saldoRealEstimado, 0)

  return (
    <div>
      <div className="panel">
        <div className="sv-head">
          <div>
            <h2 style={{ fontSize: 17 }}>Tus metas de ahorro</h2>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              {activas.length} {activas.length === 1 ? 'meta activa' : 'metas activas'} · {money(totalAhorrado)} ahorrados
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <label className="muted" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="checkbox"
                style={{ width: 'auto' }}
                checked={showArchived}
                onChange={(e) => setShowArchived(e.target.checked)}
              />
              Ver archivadas
            </label>
            {!showForm && (
              <button className="primary" onClick={() => setShowForm(true)}>
                + Nueva meta
              </button>
            )}
          </div>
        </div>

        {showForm && (
          <div style={{ marginTop: 16 }}>
            <GoalForm submitLabel="Crear meta" onSubmit={crear} onCancel={() => setShowForm(false)} />
          </div>
        )}
      </div>

      {loading && <p className="muted">Cargando…</p>}
      {error && <div className="warning">⚠ {error}</div>}

      {!loading && !error && goals.length === 0 && (
        <div className="panel">
          <p className="muted" style={{ margin: 0 }}>
            Todavía no tienes metas. Crea la primera (un viaje, un fondo de emergencia, tu pensión…) y simula cuánto
            crece tu ahorro.
          </p>
        </div>
      )}

      <div className="sv-grid">
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} onChanged={cargar} />
        ))}
      </div>
    </div>
  )
}
