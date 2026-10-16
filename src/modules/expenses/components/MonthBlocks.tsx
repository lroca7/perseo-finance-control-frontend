import { Link } from 'react-router-dom'
import { useState } from 'react'
import type { MonthDebtRow, MonthSavingRow } from '../api/types'
import { money, parseNumber } from '../../../shared/utils/format'

function numOrNull(t: string, campo: string): number | null {
  if (t.trim() === '') return null
  const n = parseNumber(t)
  if (n === null || !Number.isInteger(n) || n < 0) throw new Error(`${campo} debe ser un entero ≥ 0.`)
  return n
}

interface AhorroDraft {
  key: string
  nombre: string
  meta: string
  ahorrado: string
}

interface AhorroProps {
  filas: MonthSavingRow[]
  sugerencias: string[]
  onSave: (items: Array<{ nombre: string; meta: number | null; ahorrado: number | null }>) => void
}

/** Bloque de ahorro del mes (Q-S del Excel): flujo de caja; el detalle vive en Ahorro. */
export function MonthSavingsPanel({ filas, sugerencias, onSave }: AhorroProps) {
  const [rows, setRows] = useState<AhorroDraft[]>(() =>
    filas.map((f) => ({
      key: f.id,
      nombre: f.nombre,
      meta: f.meta === null ? '' : String(f.meta),
      ahorrado: f.ahorrado === null ? '' : String(f.ahorrado)
    }))
  )
  const [error, setError] = useState<string | null>(null)

  const set = (key: string, patch: Partial<AhorroDraft>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const quitar = (key: string) => {
    const row = rows.find((x) => x.key === key)
    const nombre = row?.nombre.trim() || 'esta fila'
    if (!key.startsWith('nueva-') && !window.confirm(`¿Quitar el ahorro "${nombre}"? Se eliminará al guardar el mes.`)) return
    setRows((rs) => rs.filter((x) => x.key !== key))
  }

  const guardar = () => {
    try {
      const items = rows.map((r) => {
        if (r.nombre.trim() === '') throw new Error('Toda fila necesita nombre.')
        return { nombre: r.nombre.trim(), meta: numOrNull(r.meta, 'La meta'), ahorrado: numOrNull(r.ahorrado, 'Lo ahorrado') }
      })
      const nombres = items.map((i) => i.nombre.toLowerCase())
      if (new Set(nombres).size !== nombres.length) throw new Error('Hay un ahorro repetido.')
      setError(null)
      onSave(items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revisa los valores.')
    }
  }

  const total = rows.reduce((s, r) => {
    const n = parseNumber(r.ahorrado)
    return s + (n !== null && n >= 0 ? Math.floor(n) : 0)
  }, 0)

  return (
    <div className="panel">
      <div className="ex-table-head">
        <h3 style={{ fontSize: 15 }}>
          Ahorro — {money(total)} <Link to="/ahorro" className="sv-chip">ver en Ahorro</Link>
        </h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="secondary sm"
            onClick={() => setRows((rs) => [...rs, { key: `nueva-${Date.now()}`, nombre: '', meta: '', ahorrado: '' }])}
          >
            + Fila
          </button>
          <button className="primary sm" onClick={guardar}>
            Guardar mes
          </button>
        </div>
      </div>
      {error && (
        <div className="warning" style={{ marginBottom: 10 }}>
          ⚠ {error}
        </div>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th style={{ textAlign: 'right' }}>Meta</th>
              <th style={{ textAlign: 'right' }}>Ahorrado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td>
                  <input
                    type="text"
                    aria-label="Nombre del ahorro"
                    list="ex-sug-ahorro"
                    value={r.nombre}
                    onChange={(e) => set(r.key, { nombre: e.target.value })}
                    style={{ minWidth: 140 }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    aria-label="Meta"
                    value={r.meta}
                    onChange={(e) => set(r.key, { meta: e.target.value })}
                    style={{ width: 130, textAlign: 'right' }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    aria-label="Ahorrado"
                    value={r.ahorrado}
                    onChange={(e) => set(r.key, { ahorrado: e.target.value })}
                    style={{ width: 130, textAlign: 'right' }}
                  />
                </td>
                <td>
                  <button className="remove" onClick={() => quitar(r.key)} aria-label="Quitar fila">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  Sin ahorros este mes. Agrega una fila.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <datalist id="ex-sug-ahorro">
        {sugerencias.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  )
}

interface DeudaDraft {
  key: string
  nombre: string
  pendiente: string
  pagado: string
}

interface DeudaProps {
  filas: MonthDebtRow[]
  sugerencias: string[]
  onSave: (items: Array<{ nombre: string; pendiente: number | null; pagado: number | null }>) => void
}

/** Bloque de deudas del mes (U-W del Excel): pagos mensuales; el detalle vive en Tarjetas. */
export function DebtsPanel({ filas, sugerencias, onSave }: DeudaProps) {
  const [rows, setRows] = useState<DeudaDraft[]>(() =>
    filas.map((f) => ({
      key: f.id,
      nombre: f.nombre,
      pendiente: f.pendiente === null ? '' : String(f.pendiente),
      pagado: f.pagado === null ? '' : String(f.pagado)
    }))
  )
  const [error, setError] = useState<string | null>(null)

  const set = (key: string, patch: Partial<DeudaDraft>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const quitar = (key: string) => {
    const row = rows.find((x) => x.key === key)
    const nombre = row?.nombre.trim() || 'esta fila'
    if (!key.startsWith('nueva-') && !window.confirm(`¿Quitar la deuda "${nombre}"? Se eliminará al guardar el mes.`)) return
    setRows((rs) => rs.filter((x) => x.key !== key))
  }

  const guardar = () => {
    try {
      const items = rows.map((r) => {
        if (r.nombre.trim() === '') throw new Error('Toda fila necesita nombre.')
        return { nombre: r.nombre.trim(), pendiente: numOrNull(r.pendiente, 'El pendiente'), pagado: numOrNull(r.pagado, 'Lo pagado') }
      })
      const nombres = items.map((i) => i.nombre.toLowerCase())
      if (new Set(nombres).size !== nombres.length) throw new Error('Hay una deuda repetida.')
      setError(null)
      onSave(items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revisa los valores.')
    }
  }

  const total = rows.reduce((s, r) => {
    const n = parseNumber(r.pagado)
    return s + (n !== null && n >= 0 ? Math.floor(n) : 0)
  }, 0)

  return (
    <div className="panel">
      <div className="ex-table-head">
        <h3 style={{ fontSize: 15 }}>
          Deudas — {money(total)} pagadas <Link to="/" className="sv-chip">ver en Tarjetas</Link>
        </h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="secondary sm"
            onClick={() => setRows((rs) => [...rs, { key: `nueva-${Date.now()}`, nombre: '', pendiente: '', pagado: '' }])}
          >
            + Fila
          </button>
          <button className="primary sm" onClick={guardar}>
            Guardar mes
          </button>
        </div>
      </div>
      {error && (
        <div className="warning" style={{ marginBottom: 10 }}>
          ⚠ {error}
        </div>
      )}
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Nombre</th>
              <th style={{ textAlign: 'right' }}>Pendiente</th>
              <th style={{ textAlign: 'right' }}>Pagado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td>
                  <input
                    type="text"
                    aria-label="Nombre de la deuda"
                    list="ex-sug-deudas"
                    value={r.nombre}
                    onChange={(e) => set(r.key, { nombre: e.target.value })}
                    style={{ minWidth: 140 }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    aria-label="Pendiente"
                    value={r.pendiente}
                    onChange={(e) => set(r.key, { pendiente: e.target.value })}
                    style={{ width: 130, textAlign: 'right' }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    aria-label="Pagado"
                    value={r.pagado}
                    onChange={(e) => set(r.key, { pagado: e.target.value })}
                    style={{ width: 130, textAlign: 'right' }}
                  />
                </td>
                <td>
                  <button className="remove" onClick={() => quitar(r.key)} aria-label="Quitar fila">
                    ✕
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={4} className="muted">
                  Sin deudas este mes. Agrega una fila.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <datalist id="ex-sug-deudas">
        {sugerencias.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  )
}
