import { useState } from 'react'
import type { ExpenseCategory, ExpenseItem } from '../api/types'
import { money, parseNumber } from '../../../shared/utils/format'

interface Props {
  categorias: Pick<ExpenseCategory, 'id' | 'nombre' | 'activa'>[]
  gastosDelMes: Pick<ExpenseItem, 'categoriaId' | 'valor'>[]
  budgets: Record<string, number>
  onGuardarPresupuesto: (categoriaId: string, monto: number | null) => void
}

interface Fila {
  cat: Pick<ExpenseCategory, 'id' | 'nombre' | 'activa'>
  proyectado: number | null
  real: number
}

/** Presupuesto por categoría: proyectado editable, real automático (= SUMIF del Excel). */
export default function BudgetPanel({ categorias, gastosDelMes, budgets, onGuardarPresupuesto }: Props) {
  const [editando, setEditando] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const [error, setError] = useState<string | null>(null)

  const realPorCat = new Map<string, number>()
  for (const g of gastosDelMes) realPorCat.set(g.categoriaId, (realPorCat.get(g.categoriaId) ?? 0) + g.valor)

  const filas: Fila[] = categorias
    .filter((c) => c.activa)
    .map((cat) => ({
      cat,
      proyectado: budgets[cat.id] ?? null,
      real: realPorCat.get(cat.id) ?? 0
    }))
    .sort((a, b) => b.real - a.real || a.cat.nombre.localeCompare(b.cat.nombre))

  const totalProy = filas.reduce((s, f) => s + (f.proyectado ?? 0), 0)
  const totalReal = filas.reduce((s, f) => s + f.real, 0)

  const empezar = (f: Fila) => {
    setEditando(f.cat.id)
    setTexto(f.proyectado === null ? '' : String(f.proyectado))
    setError(null)
  }

  const guardar = (f: Fila) => {
    const t = texto.trim()
    if (t === '') {
      onGuardarPresupuesto(f.cat.id, null)
      setEditando(null)
      return
    }
    const n = parseNumber(t)
    if (n === null || !Number.isInteger(n) || n < 0) {
      setError('El proyectado debe ser un entero ≥ 0 (o vacío para quitarlo).')
      return
    }
    onGuardarPresupuesto(f.cat.id, n)
    setEditando(null)
  }

  return (
    <div className="panel">
      <h3 style={{ fontSize: 15, marginBottom: 4 }}>Presupuesto por categoría</h3>
      <p className="muted" style={{ margin: '0 0 12px', fontSize: 12.5 }}>
        El proyectado se edita por mes; el real se calcula solo con lo registrado.
      </p>
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
              <th style={{ textAlign: 'right' }}>Proyectado</th>
              <th style={{ textAlign: 'right' }}>Real</th>
              <th style={{ textAlign: 'right' }}>Diferencia</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((f) => {
              const dif = (f.proyectado ?? 0) - f.real
              const pasado = f.proyectado !== null && f.real > f.proyectado
              return (
                <tr key={f.cat.id} className={pasado ? 'ex-pasado' : undefined}>
                  <td>{f.cat.nombre}</td>
                  <td style={{ textAlign: 'right' }}>
                    {editando === f.cat.id ? (
                      <span style={{ display: 'inline-flex', gap: 6 }}>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          autoFocus
                          aria-label={`Proyectado para ${f.cat.nombre}`}
                          value={texto}
                          onChange={(e) => setTexto(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') guardar(f)
                            if (e.key === 'Escape') setEditando(null)
                          }}
                          style={{ width: 120 }}
                        />
                        <button className="primary sm" onClick={() => guardar(f)}>
                          OK
                        </button>
                      </span>
                    ) : (
                      <button
                        className="ex-proy"
                        title="Clic para editar el proyectado"
                        onClick={() => empezar(f)}
                      >
                        {f.proyectado === null ? <span className="muted">— ✎</span> : `${money(f.proyectado)} ✎`}
                      </button>
                    )}
                  </td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{money(f.real)}</td>
                  <td
                    style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}
                    className={f.proyectado === null ? 'muted' : dif < 0 ? 'ex-neg' : 'ex-pos'}
                  >
                    {f.proyectado === null ? '—' : money(dif)}
                  </td>
                  <td>
                    {f.proyectado === null ? (
                      <span className="sv-badge sv-none">sin meta</span>
                    ) : pasado ? (
                      <span className="sv-badge sv-late">pasado</span>
                    ) : (
                      <span className="sv-badge sv-done">ok</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr>
              <td>
                <strong>Total</strong>
              </td>
              <td style={{ textAlign: 'right' }}>
                <strong>{money(totalProy)}</strong>
              </td>
              <td style={{ textAlign: 'right' }}>
                <strong>{money(totalReal)}</strong>
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
