import { useState } from 'react'
import type { BillRow, ExpenseCategory } from '../api/types'
import DateField from '../../../shared/ui/DateField'
import { money, parseNumber } from '../../../shared/utils/format'

interface Draft {
  key: string
  categoriaId: string
  fecha: string
  fechaInvalida: boolean
  valor: string
  pagado: boolean
  valorPagado: string
}

interface Props {
  anio: number
  mes: number
  filas: BillRow[]
  categorias: Pick<ExpenseCategory, 'id' | 'nombre' | 'activa'>[]
  onSave: (
    items: Array<{
      categoriaId: string
      fecha: string | null
      valor: number | null
      pagado: boolean
      valorPagado: number | null
    }>
  ) => void
  onGestionarCategorias: () => void
}

const toDraft = (f: BillRow): Draft => ({
  key: f.id,
  categoriaId: f.categoriaId,
  fecha: f.fecha ?? '',
  fechaInvalida: false,
  valor: f.valor === null ? '' : String(f.valor),
  pagado: f.pagado,
  valorPagado: f.valorPagado === null ? '' : String(f.valorPagado)
})

/** Bloque de facturas del mes (G-K del Excel). Reemplazo completo al guardar. */
export default function BillsPanel({ anio, mes, filas, categorias, onSave, onGestionarCategorias }: Props) {
  const [rows, setRows] = useState<Draft[]>(() => filas.map(toDraft))
  const [error, setError] = useState<string | null>(null)
  const prefijoMes = `${anio}-${String(mes).padStart(2, '0')}`

  const set = (key: string, patch: Partial<Draft>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  const quitar = (key: string) => {
    const row = rows.find((x) => x.key === key)
    const nombre = categorias.find((c) => c.id === row?.categoriaId)?.nombre || 'esta fila'
    if (!key.startsWith('nueva-') && !window.confirm(`¿Quitar la factura "${nombre}"? Se eliminará al guardar el mes.`)) return
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
        if (!r.categoriaId) throw new Error('Toda fila necesita categoría.')
        const fecha = r.fecha.trim() === '' ? null : r.fecha.trim()
        if (fecha !== null && !fecha.startsWith(prefijoMes)) throw new Error('La fecha debe estar dentro del mes.')
        return {
          categoriaId: r.categoriaId,
          fecha,
          valor: numOrNull(r.valor, 'El valor'),
          pagado: r.pagado,
          valorPagado: numOrNull(r.valorPagado, 'El valor pagado')
        }
      })
      if (new Set(items.map((i) => i.categoriaId)).size !== items.length)
        throw new Error('Hay una factura repetida.')
      setError(null)
      onSave(items)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Revisa los valores.')
    }
  }

  const totalPagado = rows.reduce((s, r) => {
    const n = parseNumber(r.valorPagado)
    return s + (n !== null && n >= 0 ? Math.floor(n) : 0)
  }, 0)

  return (
    <div className="panel">
      <div className="ex-table-head">
        <h3 style={{ fontSize: 15 }}>Facturas — {money(totalPagado)} pagadas</h3>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="secondary sm" onClick={onGestionarCategorias}>
            ⚙ Catálogo
          </button>
          <button
            className="secondary sm"
            onClick={() =>
              setRows((rs) => [...rs, { key: `nueva-${Date.now()}`, categoriaId: '', fecha: '', fechaInvalida: false, valor: '', pagado: false, valorPagado: '' }])
            }
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
              <th>Pagada</th>
              <th>Categoría</th>
              <th>Fecha</th>
              <th style={{ textAlign: 'right' }}>Valor</th>
              <th style={{ textAlign: 'right' }}>Pagado</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key}>
                <td>
                  <input
                    type="checkbox"
                    style={{ width: 'auto' }}
                    aria-label="Factura pagada"
                    checked={r.pagado}
                    onChange={(e) => set(r.key, { pagado: e.target.checked })}
                  />
                </td>
                <td>
                  <select
                    aria-label="Categoría de la factura"
                    value={r.categoriaId}
                    onChange={(e) => set(r.key, { categoriaId: e.target.value })}
                    style={{ minWidth: 150 }}
                  >
                    <option value="">— Elige —</option>
                    {categorias
                      .filter((c) => c.activa || c.id === r.categoriaId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.nombre}
                        </option>
                      ))}
                  </select>
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
                    aria-label="Valor"
                    value={r.valor}
                    onChange={(e) => set(r.key, { valor: e.target.value })}
                    style={{ width: 130, textAlign: 'right' }}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    aria-label="Valor pagado"
                    value={r.valorPagado}
                    onChange={(e) => set(r.key, { valorPagado: e.target.value })}
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
                <td colSpan={6} className="muted">
                  Sin facturas este mes. Agrega una fila.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
