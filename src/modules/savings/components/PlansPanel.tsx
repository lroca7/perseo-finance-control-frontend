import { useState } from 'react'
import { Link } from 'react-router-dom'
import { savingsApi } from '../api/endpoints'
import { PRODUCT_LABEL } from '../labels'
import type { PlanResponse } from '../api/types'
import { errorMessage } from '../../../shared/api/errorMessage'
import { money, pct } from '../../../shared/utils/format'

interface Props {
  goalId: string
  plans: PlanResponse[]
  onChanged: () => void
}

/** Planes de una meta: crear, editar, duplicar, eliminar y elegir el de referencia (HU-A.26). */
export default function PlansPanel({ goalId, plans, onChanged }: Props) {
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<PlanResponse | null>(null)
  const [newReference, setNewReference] = useState('')

  const run = async (id: string, action: () => Promise<unknown>) => {
    setBusy(id)
    setError(null)
    try {
      await action()
      setDeleting(null)
      onChanged()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo completar la acción'))
    } finally {
      setBusy(null)
    }
  }

  const pedirEliminar = (plan: PlanResponse) => {
    const otros = plans.filter((p) => p.id !== plan.id)
    if (plan.esReferencia && otros.length > 0) {
      // Hay que elegir quién será el nuevo plan de referencia.
      setDeleting(plan)
      setNewReference(otros[0]?.id ?? '')
      return
    }
    if (window.confirm(`¿Eliminar el plan "${plan.nombre}"?`)) {
      void run(plan.id, () => savingsApi.plans.remove(plan.id))
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <h3 className="sv-subtitle" style={{ margin: 0 }}>
          Planes
        </h3>
        <Link to={`/ahorro/metas/${goalId}/planes/nuevo`}>
          <button className="ghost">+ Nuevo plan</button>
        </Link>
      </div>

      {error && <div className="warning">⚠ {error}</div>}

      {plans.length === 0 ? (
        <p className="muted">
          Esta meta aún no tiene planes. Crea uno para simular el crecimiento y proyectar cuándo llegas.
        </p>
      ) : (
        <div className="overflow">
          <table>
            <thead>
              <tr>
                <th>Plan</th>
                <th>Producto</th>
                <th className="num">Tasa E.A.</th>
                <th className="num">Aporte/mes</th>
                <th className="num">Plazo</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {plans.map((p) => (
                <tr key={p.id}>
                  <td>
                    <Link to={`/ahorro/planes/${p.id}`}>{p.nombre}</Link>
                    {p.esReferencia && <span className="sv-chip sv-chip-ok">referencia</span>}
                  </td>
                  <td>{PRODUCT_LABEL[p.tipoProducto]}</td>
                  <td className="num">{pct(p.tasaEA)}</td>
                  <td className="num">{money(p.aporteMensual)}</td>
                  <td className="num">{p.plazoMeses} meses</td>
                  <td className="sv-actions">
                    {!p.esReferencia && (
                      <button
                        className="ghost"
                        disabled={busy === p.id}
                        onClick={() => run(p.id, () => savingsApi.plans.setReference(p.id))}
                      >
                        Usar de referencia
                      </button>
                    )}
                    <button
                      className="ghost"
                      disabled={busy === p.id}
                      onClick={() => run(p.id, () => savingsApi.plans.duplicate(p.id))}
                    >
                      Duplicar
                    </button>
                    <button className="remove" aria-label="Eliminar plan" onClick={() => pedirEliminar(p)}>
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {deleting && (
        <div className="sv-note" style={{ marginTop: 12 }}>
          <strong>"{deleting.nombre}" es el plan de referencia.</strong> Elige cuál ocupará su lugar antes de
          eliminarlo:
          <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
            <select
              style={{ maxWidth: 260 }}
              value={newReference}
              onChange={(e) => setNewReference(e.target.value)}
            >
              {plans
                .filter((p) => p.id !== deleting.id)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
            </select>
            <button
              className="primary"
              disabled={busy === deleting.id}
              onClick={() => run(deleting.id, () => savingsApi.plans.remove(deleting.id, newReference))}
            >
              Eliminar plan
            </button>
            <button className="ghost" onClick={() => setDeleting(null)}>
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
