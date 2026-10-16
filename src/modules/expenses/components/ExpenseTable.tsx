import { useState } from 'react'
import type { ExpenseItem } from '../api/types'
import { dateLabel, money } from '../../../shared/utils/format'

interface Props {
  gastos: ExpenseItem[]
  nombreCategoria: (id: string) => string
  onEditar: (g: ExpenseItem) => void
  onEliminar: (id: string) => void
}

/** Tabla del registro del mes con búsqueda y filtro por categoría. */
export default function ExpenseTable({ gastos, nombreCategoria, onEditar, onEliminar }: Props) {
  const [busqueda, setBusqueda] = useState('')
  const [filtro, setFiltro] = useState('')
  const [confirmando, setConfirmando] = useState<string | null>(null)

  const cats = [...new Set(gastos.map((g) => g.categoriaId))].map((id) => ({ id, nombre: nombreCategoria(id) }))
  const q = busqueda.trim().toLowerCase()
  const lista = gastos
    .filter((g) => (!filtro || g.categoriaId === filtro) && (!q || g.descripcion.toLowerCase().includes(q)))
    .sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))

  return (
    <div className="panel">
      <div className="ex-table-head">
        <h3 style={{ fontSize: 15 }}>Registro del mes — {gastos.length} gastos</h3>
        <div className="ex-filters">
          <input
            type="search"
            placeholder="Buscar descripción…"
            aria-label="Buscar por descripción"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
          <select aria-label="Filtrar por categoría" value={filtro} onChange={(e) => setFiltro(e.target.value)}>
            <option value="">Todas</option>
            {cats.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
      </div>
      {lista.length === 0 ? (
        <p className="muted" style={{ margin: '8px 0 0' }}>
          {gastos.length === 0
            ? 'Aún no hay gastos este mes. Registra el primero arriba.'
            : 'Ningún gasto coincide con la búsqueda.'}
        </p>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th style={{ textAlign: 'right' }}>Valor</th>
                <th>Categoría</th>
                <th>Descripción</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {lista.map((g) => (
                <tr key={g.id}>
                  <td style={{ whiteSpace: 'nowrap' }}>{dateLabel(g.fecha)}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{money(g.valor)}</td>
                  <td>{nombreCategoria(g.categoriaId)}</td>
                  <td>{g.descripcion || <span className="muted">—</span>}</td>
                  <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                    {confirmando === g.id ? (
                      <>
                        <span className="muted" style={{ fontSize: 12, marginRight: 6 }}>
                          ¿Eliminar?
                        </span>
                        <button className="remove" onClick={() => { onEliminar(g.id); setConfirmando(null) }}>
                          Sí
                        </button>{' '}
                        <button onClick={() => setConfirmando(null)}>
                          No
                        </button>
                      </>
                    ) : (
                      <>
                        <button className="secondary sm" onClick={() => onEditar(g)} aria-label="Editar gasto">
                          ✎
                        </button>{' '}
                        <button className="remove" onClick={() => setConfirmando(g.id)} aria-label="Eliminar gasto">
                          ✕
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
