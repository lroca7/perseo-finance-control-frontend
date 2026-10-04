import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { savingsApi } from '../api/endpoints'
import { errorMessage } from '../../../shared/api/errorMessage'
import { iconEmoji } from '../labels'
import { dateLabel, money, pct, todayISO } from '../../../shared/utils/format'
import type { GoalResponse } from '../api/types'
import ProgressBar from './ProgressBar'
import StatusBadge from './StatusBadge'

interface Props {
  goal: GoalResponse
  onChanged: () => void
}

/** Texto de estado de la tarjeta (HU-A.17). */
function statusMessage(g: GoalResponse): string {
  switch (g.estadoSeguimiento) {
    case 'ALCANZADA':
      return '¡Meta alcanzada!'
    case 'SIN_PLAN':
      return 'Crea un plan para proyectar cuándo llegas'
    case 'ATRASADA':
      return g.aporteNecesario != null
        ? `Atrasada · necesitas ${money(g.aporteNecesario)}/mes para llegar a tiempo`
        : 'Atrasada respecto al plan'
    default:
      if (g.mesesParaMeta != null) return `Se alcanza en ${g.mesesParaMeta} meses`
      return g.ritmoActual != null ? `En camino · ${money(g.ritmoActual)}/mes` : 'En camino'
  }
}

export default function GoalCard({ goal, onChanged }: Props) {
  const [open, setOpen] = useState(false)
  const [monto, setMonto] = useState('')
  const [fecha, setFecha] = useState(todayISO())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const registrar = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await savingsApi.movements.create(goal.id, { fecha, monto: Number(monto), tipo: 'APORTE' })
      setMonto('')
      setOpen(false)
      onChanged()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo registrar el aporte'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="sv-card">
      <div className="sv-card-head">
        <span className="sv-card-icon" aria-hidden="true">
          {iconEmoji(goal.icono)}
        </span>
        <StatusBadge status={goal.estadoSeguimiento} />
      </div>

      <Link to={`/ahorro/metas/${goal.id}`} className="sv-card-title">
        {goal.nombre}
      </Link>
      <div className="muted">
        {goal.fechaObjetivo ? `Meta: ${dateLabel(goal.fechaObjetivo)}` : 'Sin fecha límite'}
        {goal.estado === 'ARCHIVADA' && ' · archivada'}
      </div>

      <ProgressBar value={goal.avanceMeta} status={goal.estadoSeguimiento} />
      <div className="sv-card-amounts">
        <span>{money(goal.saldoRealEstimado)}</span>
        <span className="muted">
          de {money(goal.montoObjetivo)} · {pct(goal.avanceMeta)}
        </span>
      </div>
      <div className={`sv-card-msg sv-msg-${goal.estadoSeguimiento === 'ATRASADA' ? 'late' : 'ok'}`}>
        {statusMessage(goal)}
      </div>

      {goal.estado !== 'ARCHIVADA' &&
        (open ? (
          <form onSubmit={registrar} className="sv-quick">
            {error && <div className="warning">⚠ {error}</div>}
            <div className="sv-quick-row">
              <input
                type="number"
                min="1"
                step="any"
                placeholder="Monto"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                required
                autoFocus
              />
              <input type="date" max={todayISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button type="submit" className="primary" disabled={saving}>
                {saving ? '…' : 'Guardar'}
              </button>
              <button type="button" className="ghost" onClick={() => setOpen(false)}>
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <button className="ghost" onClick={() => setOpen(true)}>
            + Aporte
          </button>
        ))}
    </div>
  )
}
