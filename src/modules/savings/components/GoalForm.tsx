import { useState } from 'react'
import type { FormEvent } from 'react'
import { errorMessage } from '../../../shared/api/errorMessage'
import { tomorrowISO } from '../../../shared/utils/format'
import { GOAL_ICONS } from '../labels'
import type { GoalResponse } from '../api/types'

export interface GoalFormValues {
  nombre: string
  icono: string
  montoObjetivo: number
  saldoInicial: number
  fechaObjetivo: string | null
}

interface Props {
  initial?: GoalResponse
  submitLabel: string
  onSubmit: (values: GoalFormValues) => Promise<void>
  onCancel: () => void
}

export default function GoalForm({ initial, submitLabel, onSubmit, onCancel }: Props) {
  const [nombre, setNombre] = useState(initial?.nombre ?? '')
  const [icono, setIcono] = useState(initial?.icono ?? 'piggy-bank')
  const [monto, setMonto] = useState(initial ? String(initial.montoObjetivo) : '')
  const [saldo, setSaldo] = useState(initial ? String(initial.saldoInicial) : '0')
  const [fecha, setFecha] = useState(initial?.fechaObjetivo ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onSubmit({
        nombre: nombre.trim(),
        icono,
        montoObjetivo: Number(monto) || 0,
        saldoInicial: Number(saldo) || 0,
        fechaObjetivo: fecha === '' ? null : fecha
      })
    } catch (err) {
      setError(errorMessage(err, 'No se pudo guardar la meta'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit}>
      {error && <div className="warning">⚠ {error}</div>}
      <div className="sv-fields">
        <div className="field">
          <label>Nombre</label>
          <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} required />
        </div>
        <div className="field">
          <label>Tipo de meta</label>
          <select value={icono} onChange={(e) => setIcono(e.target.value)}>
            {GOAL_ICONS.map((i) => (
              <option key={i.key} value={i.key}>
                {i.emoji} {i.label}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Monto objetivo</label>
          <input type="number" min="1" step="any" value={monto} onChange={(e) => setMonto(e.target.value)} required />
        </div>
        <div className="field">
          <label>Lo que ya tienes ahorrado</label>
          <input type="number" min="0" step="any" value={saldo} onChange={(e) => setSaldo(e.target.value)} />
        </div>
        <div className="field">
          <label>Fecha objetivo (opcional)</label>
          <input type="date" min={tomorrowISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="primary" disabled={saving}>
          {saving ? 'Guardando…' : submitLabel}
        </button>
        <button type="button" className="ghost" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
