import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { creditLinesApi, simulationApi } from '../api/endpoints'
import type { CreditLineResponse, ComparisonResponse, ExtraPaymentResponse, PaymentStrategy } from '../api/types'
import { fmt } from '../../../shared/utils/format'
import { ApiError } from '../../../shared/api/client'

const MONTH_ABBR = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export default function LineSimulationPage() {
  const { lineId } = useParams<{ lineId: string }>()
  const [line, setLine] = useState<CreditLineResponse | null>(null)
  const [comparison, setComparison] = useState<ComparisonResponse | null>(null)
  const [abonos, setAbonos] = useState<ExtraPaymentResponse[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const [mesInicio, setMesInicio] = useState(now.getMonth()) // 0-11
  const [anioInicio, setAnioInicio] = useState(now.getFullYear())

  const mesAnioDeCuota = (numeroCuota: number): string => {
    const idx = mesInicio + (numeroCuota - 1)
    const mes = MONTH_ABBR[idx % 12]
    const anio = anioInicio + Math.floor(idx / 12)
    return `${mes}/${anio}`
  }

  const [nuevaCuota, setNuevaCuota] = useState('')
  const [nuevoMonto, setNuevoMonto] = useState('')
  const [estrategia, setEstrategia] = useState<PaymentStrategy>('REDUCIR_PLAZO')

  const cargar = useCallback(async () => {
    if (!lineId) return
    setLoading(true)
    setError(null)
    try {
      const [l, cmp, ab] = await Promise.all([
        creditLinesApi.obtener(lineId),
        simulationApi.comparar(lineId),
        simulationApi.listarAbonos(lineId)
      ])
      setLine(l)
      setComparison(cmp)
      setAbonos(ab)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cargar la simulación')
    } finally {
      setLoading(false)
    }
  }, [lineId])

  useEffect(() => {
    cargar()
  }, [cargar])

  const agregarAbono = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!lineId) return
    try {
      await simulationApi.agregarAbono(lineId, {
        numeroCuota: Number(nuevaCuota) || 1,
        monto: Number(nuevoMonto) || 0,
        estrategia
      })
      setNuevaCuota('')
      setNuevoMonto('')
      cargar()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo agregar el abono')
    }
  }

  const eliminarAbono = async (id: string, detalle: string) => {
    if (!lineId) return
    if (!window.confirm(`¿Eliminar ${detalle}?`)) return
    try {
      await simulationApi.eliminarAbono(lineId, id)
      cargar()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo eliminar el abono')
    }
  }

  if (loading && !line) return <p className="muted">Cargando…</p>
  if (!line || !comparison) return <div className="warning">⚠ {error ?? 'No se encontró la línea'}</div>

  const hayAbonos = abonos.length > 0
  const shown = hayAbonos ? comparison.conAbonos : comparison.sinAbonos

  return (
    <div>
      <p className="muted" style={{ marginBottom: 14 }}>{line.nombre}</p>

      {error && <div className="warning">⚠ {error}</div>}

      <div className="banner">
        <div className="label">Ahorro en intereses</div>
        <div className="big">
          {hayAbonos ? fmt(comparison.ahorroIntereses) : 'Agrega un abono para verlo'}
          {hayAbonos && comparison.mesesAhorrados > 0 && ` · ${comparison.mesesAhorrados} meses antes`}
        </div>
      </div>

      <div className="panel">
        <h2 style={{ fontSize: 15.5, marginBottom: 10 }}>Abonos extraordinarios</h2>

        {abonos.length > 0 && (
          <table style={{ marginBottom: 12 }}>
            <thead>
              <tr>
                <th># Cuota</th>
                <th className="num">Monto</th>
                <th>Estrategia</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {abonos.map((a) => (
                <tr key={a.id}>
                  <td>{a.numeroCuota}</td>
                  <td className="num">{fmt(a.monto)}</td>
                  <td>{a.estrategia === 'REDUCIR_PLAZO' ? 'Reducir plazo' : 'Reducir cuota'}</td>
                  <td>
                    <button className="remove" onClick={() => eliminarAbono(a.id, `el abono de la cuota ${a.numeroCuota} por ${fmt(a.monto)}`)}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <form onSubmit={agregarAbono} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 8, alignItems: 'end' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label># Cuota</label>
            <input type="number" value={nuevaCuota} onChange={(e) => setNuevaCuota(e.target.value)} required />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Monto</label>
            <input type="number" value={nuevoMonto} onChange={(e) => setNuevoMonto(e.target.value)} required />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Estrategia</label>
            <select value={estrategia} onChange={(e) => setEstrategia(e.target.value as PaymentStrategy)}>
              <option value="REDUCIR_PLAZO">Reducir plazo</option>
              <option value="REDUCIR_CUOTA">Reducir cuota</option>
            </select>
          </div>
          <button type="submit" className="primary">Agregar</button>
        </form>
      </div>

      <div className="panel">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div>
            <h3 className="muted" style={{ fontSize: 13, marginBottom: 8 }}>Sin abonos</h3>
            <p>Meses: <b>{comparison.sinAbonos.meses}</b></p>
            <p>Intereses: <b>{fmt(comparison.sinAbonos.totalInteres)}</b></p>
            <p>Total pagado: <b>{fmt(comparison.sinAbonos.totalPagado)}</b></p>
          </div>
          <div>
            <h3 className="muted" style={{ fontSize: 13, marginBottom: 8 }}>Con abonos</h3>
            <p>Meses: <b>{comparison.conAbonos.meses}</b></p>
            <p>Intereses: <b>{fmt(comparison.conAbonos.totalInteres)}</b></p>
            <p>Total pagado: <b>{fmt(comparison.conAbonos.totalPagado)}</b></p>
          </div>
        </div>
        {hayAbonos && (
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 12, paddingTop: 12 }}>
            <p style={{ margin: 0 }}>
              <span className="muted">Ahorro en intereses: </span>
              <b style={{ color: 'var(--good)' }}>{fmt(comparison.ahorroIntereses)}</b>
              {comparison.mesesAhorrados > 0 && (
                <span className="muted"> · {comparison.mesesAhorrados} meses antes</span>
              )}
            </p>
          </div>
        )}
      </div>

      <div className="panel">
        <h2 style={{ fontSize: 15.5, marginBottom: 4 }}>Cronograma</h2>
        <p className="muted" style={{ marginBottom: 12 }}>
          {hayAbonos ? 'Mostrando el plan con tus abonos aplicados.' : 'Mostrando el plan sin abonos.'}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 320, marginBottom: 14 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Mes de la cuota 1</label>
            <select value={mesInicio} onChange={(e) => setMesInicio(Number(e.target.value))}>
              {MONTH_ABBR.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Año</label>
            <input type="number" value={anioInicio} onChange={(e) => setAnioInicio(Number(e.target.value) || anioInicio)} />
          </div>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th># Cuota</th>
                <th>Mes</th>
                <th className="num">Interés</th>
                <th className="num">Capital</th>
                <th className="num">Cuota total</th>
                <th className="num">Saldo final</th>
              </tr>
            </thead>
            <tbody>
              {shown.filas.map((row) => (
                <tr key={row.numeroCuota} className={row.abonoExtra > 0 ? 'hit' : undefined}>
                  <td>{row.numeroCuota}</td>
                  <td>{mesAnioDeCuota(row.numeroCuota)}</td>
                  <td className="num">{fmt(row.interes)}</td>
                  <td className="num">{fmt(row.capital)}</td>
                  <td className="num">{fmt(row.cuotaTotal)}</td>
                  <td className="num">{fmt(row.saldoFinal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
