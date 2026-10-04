import type { SimulationMonth } from '../api/types'
import { money, monthLabel } from '../../../shared/utils/format'

/** Cronograma mes a mes de una simulación (HU-A.3). Usa el estilo `.table-scroll` de global.css. */
export default function SimulationTable({ meses }: { meses: SimulationMonth[] }) {
  const hayComision = meses.some((m) => m.comision !== 0)
  const hayPendiente = meses.some((m) => m.impuestoPendiente !== 0)

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Mes</th>
            <th className="num">Aporte</th>
            <th className="num">Rend. bruto</th>
            {hayComision && <th className="num">Comisión</th>}
            <th className="num">Impuesto</th>
            <th className="num">Saldo</th>
            {hayPendiente && <th className="num">Neto si retiras</th>}
          </tr>
        </thead>
        <tbody>
          {meses.map((m) => (
            <tr key={m.mes} className={m.metaAlcanzada ? 'hit' : undefined}>
              <td>
                {m.mes}. {monthLabel(m.fecha)}
                {m.metaAlcanzada && <span className="sv-chip sv-chip-ok">meta</span>}
              </td>
              <td className="num">{money(m.aporte)}</td>
              <td className="num">{money(m.rendimientoBruto)}</td>
              {hayComision && <td className="num">{money(m.comision)}</td>}
              <td className="num">{m.impuesto === 0 ? '—' : money(m.impuesto)}</td>
              <td className="num">{money(m.saldoFinal)}</td>
              {hayPendiente && <td className="num">{money(m.saldoNeto)}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
