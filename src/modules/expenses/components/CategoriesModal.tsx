import { useState } from 'react'
import type { ExpenseCategory } from '../api/types'

interface Props {
  categorias: ExpenseCategory[]
  usos: Record<string, number>
  abierto: boolean
  onCerrar: () => void
  onCrear: (nombre: string) => string | null
  onRenombrar: (id: string, nombre: string) => string | null
  onCambiarEstado: (id: string, activa: boolean) => string | null
  onEliminar: (id: string) => string | null
}

/** Gestión de categorías editables: crear, renombrar, desactivar y eliminar. */
export default function CategoriesModal({ categorias, usos, abierto, onCerrar, onCrear, onRenombrar, onCambiarEstado, onEliminar }: Props) {
  const [nuevo, setNuevo] = useState('')
  const [renombrando, setRenombrando] = useState<string | null>(null)
  const [texto, setTexto] = useState('')
  const [error, setError] = useState<string | null>(null)

  if (!abierto) return null

  const crear = () => {
    const msg = onCrear(nuevo)
    if (msg) setError(msg)
    else {
      setNuevo('')
      setError(null)
    }
  }

  const guardarNombre = (id: string) => {
    const msg = onRenombrar(id, texto)
    if (msg) setError(msg)
    else {
      setRenombrando(null)
      setError(null)
    }
  }

  return (
    <div className="ex-modal-backdrop" onClick={onCerrar}>
      <div className="ex-modal" role="dialog" aria-modal="true" aria-label="Categorías" onClick={(e) => e.stopPropagation()}>
        <div className="ex-modal-head">
          <h3 style={{ fontSize: 15 }}>Categorías de gasto</h3>
          <button className="secondary sm" onClick={onCerrar}>
            Cerrar
          </button>
        </div>
        <div className="ex-new-cat">
          <input
            type="text"
            placeholder="Nueva categoría…"
            aria-label="Nombre de la nueva categoría"
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && crear()}
          />
          <button className="primary sm" onClick={crear}>
            + Crear
          </button>
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
                <th>Estado</th>
                <th style={{ textAlign: 'right' }}>Usos</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {categorias.map((c) => {
                const n = usos[c.id] ?? 0
                return (
                  <tr key={c.id} className={c.activa ? undefined : 'ex-inactiva'}>
                    <td>
                      {renombrando === c.id ? (
                        <span style={{ display: 'inline-flex', gap: 6 }}>
                          <input
                            type="text"
                            autoFocus
                            aria-label="Nuevo nombre"
                            value={texto}
                            onChange={(e) => setTexto(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') guardarNombre(c.id)
                              if (e.key === 'Escape') setRenombrando(null)
                            }}
                          />
                          <button className="primary sm" onClick={() => guardarNombre(c.id)}>
                            OK
                          </button>
                        </span>
                      ) : (
                        c.nombre
                      )}
                    </td>
                    <td>{c.activa ? <span className="sv-badge sv-done">activa</span> : <span className="sv-badge sv-none">inactiva</span>}</td>
                    <td style={{ textAlign: 'right' }}>{n}</td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {renombrando !== c.id && (
                        <button
                          className="secondary sm"
                          onClick={() => { setRenombrando(c.id); setTexto(c.nombre); setError(null) }}
                        >
                          ✎
                        </button>
                      )}{' '}
                      <button
                        className="secondary sm"
                        title={c.activa ? 'Desactivar (se conserva el historial)' : 'Reactivar'}
                        onClick={() => {
                          const msg = onCambiarEstado(c.id, !c.activa)
                          setError(msg)
                        }}
                      >
                        {c.activa ? '⏸' : '▶'}
                      </button>{' '}
                      <button
                        className="remove"
                        title={n > 0 ? 'Solo se puede eliminar sin gastos asociados' : 'Eliminar'}
                        aria-label={`Eliminar categoría ${c.nombre}`}
                        onClick={() => {
                          if (!window.confirm(`¿Eliminar la categoría "${c.nombre}"?`)) return
                          const msg = onEliminar(c.id)
                          setError(msg)
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <p className="muted" style={{ fontSize: 12, margin: '10px 0 0' }}>
          Las categorías con gastos no se pueden eliminar: se desactivan y salen del formulario, pero el historial se
          conserva.
        </p>
      </div>
    </div>
  )
}
