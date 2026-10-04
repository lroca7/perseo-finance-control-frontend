import { useState } from 'react'
import { savingsApi } from '../api/endpoints'
import type { BalanceCheckResponse, MovementResponse } from '../api/types'
import { errorMessage } from '../../../shared/api/errorMessage'
import { dateLabel, money } from '../../../shared/utils/format'

interface Props {
  movements: MovementResponse[]
  checks: BalanceCheckResponse[]
  onChanged: () => void
}

/** Historial de movimientos y conciliaciones, con opción de eliminar (HU-A.22). */
export default function MovementsPanel({ movements, checks, onChanged }: Props) {
  const [error, setError] = useState<string | null>(null)

  const eliminar = async (texto: string, accion: () => Promise<void>) => {
    if (!window.confirm(`¿Eliminar ${texto}?`)) return
    setError(null)
    try {
      await accion()
      onChanged()
    } catch (err) {
      setError(errorMessage(err, 'No se pudo eliminar'))
    }
  }

  return (
    <div>
      {error && <div className="warning">⚠ {error}</div>}

      <h3 className="sv-subtitle">Movimientos</h3>
      {movements.length === 0 ? (
        <p className="muted">Aún no has registrado aportes ni retiros.</p>
      ) : (
        <div className="overflow">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Tipo</th>
                <th className="num">Monto</th>
                <th>Nota</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr key={m.id}>
                  <td>{dateLabel(m.fecha)}</td>
                  <td>{m.tipo === 'APORTE' ? 'Aporte' : 'Retiro'}</td>
                  <td className={`num ${m.tipo === 'APORTE' ? 'sv-pos' : 'sv-neg'}`}>
                    {m.tipo === 'APORTE' ? '+' : '−'}
                    {money(m.monto)}
                  </td>
                  <td className="muted">{m.nota ?? ''}</td>
                  <td>
                    <button
                      className="remove"
                      aria-label="Eliminar movimiento"
                      onClick={() =>
                        eliminar(`el movimiento del ${dateLabel(m.fecha)}`, () => savingsApi.movements.remove(m.id))
                      }
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h3 className="sv-subtitle" style={{ marginTop: 18 }}>
        Conciliaciones
      </h3>
      {checks.length === 0 ? (
        <p className="muted">Aún no has conciliado el saldo con tu banco.</p>
      ) : (
        <div className="overflow">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th className="num">Saldo real</th>
                <th>Nota</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.id}>
                  <td>{dateLabel(c.fecha)}</td>
                  <td className="num">{money(c.saldoReal)}</td>
                  <td className="muted">{c.nota ?? ''}</td>
                  <td>
                    <button
                      className="remove"
                      aria-label="Eliminar conciliación"
                      onClick={() =>
                        eliminar(`la conciliación del ${dateLabel(c.fecha)}`, () => savingsApi.balanceChecks.remove(c.id))
                      }
                    >
                      ✕
                    </button>
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
