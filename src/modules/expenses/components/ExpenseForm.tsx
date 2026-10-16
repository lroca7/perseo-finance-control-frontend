import { useState } from 'react'
import type { ExpenseCategory } from '../api/types'
import { money, parseNumber } from '../../../shared/utils/format'

import DateField from '../../../shared/ui/DateField'

interface Props {
  fecha: string
  valor: string
  categoriaId: string
  descripcion: string
  categorias: Pick<ExpenseCategory, 'id' | 'nombre' | 'activa'>[]
  editandoId: string | null
  fueraDeMes: boolean
  onFecha: (v: string) => void
  onValor: (v: string) => void
  onCategoria: (v: string) => void
  onDescripcion: (v: string) => void
  onGuardar: () => string | null
  onCancelarEdicion: () => void
}

/** Formulario de registro rápido: fecha, valor, categoría y descripción. */
export default function ExpenseForm(p: Props) {
  const [error, setError] = useState<string | null>(null)
  const [fechaInvalida, setFechaInvalida] = useState(false)
  const activas = p.categorias.filter((c) => c.activa)
  const valorNum = parseNumber(p.valor)

  const guardar = () => {
    if (fechaInvalida) return setError('Revisa la fecha.')
    if (!p.fecha) return setError('La fecha es obligatoria.')
    if (valorNum === null || !Number.isInteger(valorNum) || valorNum <= 0)
      return setError('El valor debe ser un número entero mayor a 0.')
    if (!p.categoriaId) return setError('Elige una categoría.')
    setError(null)
    const msg = p.onGuardar()
    if (msg) setError(msg)
  }

  return (
    <div className="panel">
      <h3 style={{ fontSize: 15, marginBottom: 12 }}>
        {p.editandoId ? 'Editar gasto' : '+ Registrar gasto'}
      </h3>
      <div className="ex-form">
        <div className="field">
          <label htmlFor="ex-fecha">Fecha del gasto</label>
          <DateField
            id="ex-fecha"
            ariaLabel="Fecha del gasto"
            value={p.fecha}
            onChange={p.onFecha}
            onInvalid={setFechaInvalida}
          />
        </div>
        <div className="field">
          <label htmlFor="ex-valor">Valor</label>
          <input
            id="ex-valor"
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            placeholder="50000"
            value={p.valor}
            onChange={(e) => p.onValor(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="ex-cat">Categoría</label>
          <select id="ex-cat" value={p.categoriaId} onChange={(e) => p.onCategoria(e.target.value)}>
            <option value="">— Elige —</option>
            {activas.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="ex-desc">Descripción (opcional)</label>
          <input
            id="ex-desc"
            type="text"
            placeholder="Ej. Hamburguesas"
            value={p.descripcion}
            onChange={(e) => p.onDescripcion(e.target.value)}
          />
        </div>
      </div>
      {p.fueraDeMes && p.fecha && (
        <div className="warning" style={{ marginTop: 10 }}>
          ⚠ La fecha no es del mes seleccionado: igual se guarda, pero no suma en este mes.
        </div>
      )}
      {valorNum !== null && valorNum > 0 && (
        <p className="muted" style={{ margin: '8px 0 0', fontSize: 13 }}>
          Se registrará {money(valorNum)}
        </p>
      )}
      {error && (
        <div className="warning" style={{ marginTop: 10 }}>
          ⚠ {error}
        </div>
      )}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <button className="primary" onClick={guardar}>
          {p.editandoId ? 'Guardar cambios' : 'Guardar gasto'}
        </button>
        {p.editandoId && (
          <button className="secondary" onClick={() => { setError(null); p.onCancelarEdicion() }}>
            Cancelar
          </button>
        )}
      </div>
    </div>
  )
}
