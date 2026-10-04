import type { TrackingMonth } from '../api/types'
import { money, monthLabel } from '../../../shared/utils/format'

/** Tabla mes a mes: planeado vs. real (HU-A.16). */
export default function TrackingTable({ meses }: { meses: TrackingMonth[] }) {
  if (meses.length === 0) {
    return <p className="muted">Todavía no hay meses para comparar: el plan empieza más adelante.</p>
  }

  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>Mes</th>
            <th className="num">Aporte planeado</th>
            <th className="num">Aporte real</th>
            <th className="num">Diferencia</th>
            <th className="num">Saldo real est.</th>
          </tr>
        </thead>
        <tbody>
          {meses.map((m) => (
            <tr key={m.mes}>
              <td>
                {monthLabel(m.fecha)}
                {m.estado === 'EN_CURSO' && <span className="sv-chip">en curso</span>}
                {m.conciliado && <span className="sv-chip sv-chip-ok">conciliado</span>}
              </td>
              <td className="num">{money(m.aportePlaneado)}</td>
              <td className="num">
                {m.aporteReal == null ? <span className="muted">sin registrar</span> : money(m.aporteReal)}
              </td>
              <td className={`num ${m.diferencia == null ? '' : m.diferencia < 0 ? 'sv-neg' : 'sv-pos'}`}>
                {m.diferencia == null ? '—' : money(m.diferencia)}
              </td>
              <td className="num">{m.saldoReal == null ? '—' : money(m.saldoReal)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
