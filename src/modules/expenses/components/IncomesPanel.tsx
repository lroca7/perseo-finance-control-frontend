import { useState } from 'react'
import type { IncomeRow } from '../api/types'
import DateField from '../../../shared/ui/DateField'
import { money, parseNumber } from '../../../shared/utils/format'

interface Draft {
  key: string
  categoria: string
  fecha: string
  fechaInvalida: boolean
  proyectado: string
  recibido: string
}

interface Props {
  anio: number
  mes: number
  filas: IncomeRow[]
  sugerencias: string[]
  onSave: (items: Array<{ categoria: string; fecha: string | null; proyectado: number | null; recibido: number | null }>) => void
}

const toDraft = (f: IncomeRow): Draft => ({
  key: f.id,
  categoria: f.categoria,
  fecha: f.fecha ?? '',
  fechaInvalida: false,
  proyectado: f.proyectado === null ? '' : String(f.proyectado),
  recibido: f.recibido === null ? '' : String(f.recibido)
})

/** Bloque de ingresos del mes (B-E del Excel). Reemplazo completo al guardar. */
export default function IncomesPanel({ anio, mes, filas, sugerencias, onSave }: Props) {
  const [rows, setRows] = useState<Draft[]>(() => filas.map(toDraft))
  const [error, setError] = useState<string | null>(null)
  const prefijoMes = `${anio}-${String(mes).padStart(2, '0')}`

  const set = (key: string, patch: Partial<Draft>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const quitar = (key: string) => {
    const row = rows.find((x) => x.key === key)
    const nombre = row?.categoria.trim() || 'esta fila'
    if (!key.startsWith('nueva-') && !window.confirm(`¿Quitar el ingreso "${nombre}"? Se eliminará al guardar el mes.`)) return
    setRows((rs) => rs.filter((x) => x.key !== key))
  }

  const numOrNull = (t: string, campo: string): number | null => {
    if (t.trim() === '') return null
    const n = parseNumber(t)
    if (n === null || !Number.isInteger(n) || n < 0) throw new Error(`${campo} debe ser un entero ≥ 0.`)
    return n
  }

  const guardar = () => {
    try {
      const items = rows.map((r) => {
        if (r.fechaInvalida) throw new Error('Revisa las fechas.')
        if (r.categoria.trim() === '') throw new Error('Toda fila necesita categoría.')
        const fecha = r.fecha.trim() === '' ? null : r.fecha.trim()
        if (fecha !== null && !fecha.startsWith(prefijoMes)) throw new Error('La fecha debe estar dentro del mes.')
        return {
          categoria: r.categoria.trim(),
          fecha,
          proyectado: numOrNull(r.proyectado, 'El proyectado'),
          recibido: numOrNull(r.recibido, 'Lo recibido')
        }
      })
      const nombres = items.map((i) => i.categoria.toLowerCase())
      if (new Set(nombres).size !== nombres.length) throw new Error('Hay una categoría repetida.')
      setError(null)
      onSave(items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revisa los valores.')
    }
  }

  const totalRec = rows.reduce((s, r) => {
    const n = parseNumber(r.recibido)
    return s + (n !== null && n >= 0 ? Math.floor(n) : 0)
  }, 0)

  return (
    <div className="panel">
      <div className="ex-table-head">
        <h3 style={{ fontSize: 15 }}>Ingresos — {money(totalRec)} recibidos</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="secondary sm" onClick={() => setRows((rs) => [...rs, { key: `nueva-${Date.now()}`, categoria: '', fecha: '', fechaInvalida: false, proyectado: '', recibido: '' }])}>
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
              <th>Categoría</th>
              <th>Fecha</th>
              <th style={{ textAlign: 'right' }}>Proyectado</th>
              <th style={{ textAlign: 'right' }}>Recibido</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td>
                  <input
                    type="text"
                    aria-label="Categoría del ingreso"
                    list="ex-sug-ingresos"
                    value={r.categoria}
                    onChange={(e) => set(r.key, { categoria: e.target.value })}
                    style={{ minWidth: 140 }}
                  />
                </td>
                <td>
                  <DateField
                    ariaLabel="Fecha"
                    value={r.fecha}
                    onChange={(iso) => set(r.key, { fecha: iso })}
                    onInvalid={(b) => set(r.key, { fechaInvalida: b })}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    aria-label="Proyectado"
                    value={r.proyectado}
                    onChange={(e) => set(r.key, { proyectado: e.target.value })}
                    style={{ width: 130, textAlign: 'right' }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    aria-label="Recibido"
                    value={r.recibido}
                    onChange={(e) => set(r.key, { recibido: e.target.value })}
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
                <td colSpan={5} className="muted">
                  Sin ingresos este mes. Agrega una fila.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <datalist id="ex-sug-ingresos">
        {sugerencias.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </div>
  )
}
