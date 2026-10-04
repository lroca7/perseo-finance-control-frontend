import { useState } from 'react'
import type { FormEvent } from 'react'
import { savingsApi } from '../api/endpoints'
import { errorMessage } from '../../../shared/api/errorMessage'
import { todayISO } from '../../../shared/utils/format'

interface Props {
  goalId: string
  onSaved: () => void
}

/** Conciliar: copiar el saldo real que muestra el banco (HU-A.14). */
export default function BalanceCheckForm({ goalId, onSaved }: Props) {
  const [fecha, setFecha] = useState(todayISO())
  const [saldo, setSaldo] = useState('')
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await savingsApi.balanceChecks.create(goalId, {
        fecha,
        saldoReal: Number(saldo),
        nota: nota.trim() || undefined
      })
      setSaldo('')
      setNota('')
      onSaved()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo registrar la conciliación'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit}>
      <h3 className="sv-subtitle">Conciliar con tu banco</h3>
      <p className="muted" style={{ marginTop: 0 }}>
        Escribe el saldo que ves en tu cuenta o CDT. Desde esa fecha, la estimación parte de ese valor.
      </p>
      {error && <div className="warning">⚠ {error}</div>}
      <div className="sv-fields">
        <div className="field">
          <label>Fecha</label>
          <input type="date" max={todayISO()} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
        </div>
        <div className="field">
          <label>Saldo real</label>
          <input type="number" min="0" step="any" value={saldo} onChange={(e) => setSaldo(e.target.value)} required />
        </div>
        <div className="field">
          <label>Nota (opcional)</label>
          <input value={nota} onChange={(e) => setNota(e.target.value)} maxLength={200} />
        </div>
      </div>
      <button type="submit" className="primary" disabled={saving}>
        {saving ? 'Guardando…' : 'Conciliar'}
      </button>
    </form>
  )
}
