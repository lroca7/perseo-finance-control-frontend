import { useState } from 'react'
import type { FormEvent } from 'react'
import { savingsApi } from '../api/endpoints'
import type { MovementType } from '../api/types'
import { ApiError } from '../../../shared/api/client'
import { errorMessage } from '../../../shared/api/errorMessage'
import { todayISO } from '../../../shared/utils/format'

interface Props {
  goalId: string
  onSaved: () => void
}

/** Registrar un aporte o un retiro real (HU-A.11, A.15). */
export default function MovementForm({ goalId, onSaved }: Props) {
  const [tipo, setTipo] = useState<MovementType>('APORTE')
  const [fecha, setFecha] = useState(todayISO())
  const [monto, setMonto] = useState('')
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const enviar = (confirmarExceso: boolean) =>
    savingsApi.movements.create(goalId, {
      fecha,
      monto: Number(monto),
      tipo,
      nota: nota.trim() || undefined,
      confirmarExceso
    })

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      try {
        await enviar(false)
      } catch (err) {
        // Decisión D6: un retiro mayor al saldo estimado se registra solo si el usuario confirma.
        const pideConfirmar = err instanceof ApiError && err.status === 409 && tipo === 'RETIRO'
        if (pideConfirmar && window.confirm('El retiro supera el saldo estimado de la meta. ¿Quieres registrarlo de todos modos?')) {
          await enviar(true)
        } else {
          throw err
        }
      }
      setMonto('')
      setNota('')
      onSaved()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo registrar el movimiento'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <h3 className="sv-subtitle">Registrar movimiento</h3>
      {error && <div className="warning">⚠ {error}</div>}
      <div className="sv-fields">
        <div className="field">
          <label>Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value as MovementType)}>
            <option value="APORTE">Aporte</option>
            <option value="RETIRO">Retiro</option>
          </select>
        </div>
        <div className="field">
          <label>Fecha</label>
          <input type="date" max={todayISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </div>
        <div className="field">
          <label>Monto</label>
          <input type="number" min="1" step="any" value={monto} onChange={(e) => setMonto(e.target.value)} required />
        </div>
        <div className="field">
          <label>Nota (opcional)</label>
          <input value={nota} onChange={(e) => setNota(e.target.value)} maxLength={200} />
        </div>
      </div>
      <button type="submit" className="primary" disabled={saving}>
        {saving ? 'Guardando…' : 'Registrar'}
      </button>
    </form>
  )
}
