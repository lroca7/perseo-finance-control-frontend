import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { cardsApi, creditLinesApi, statementsApi } from '../api/endpoints'
import type {
  CardResponse,
  CreditLineResponse,
  AmortizationType,
  StatementResponse,
  ParsedStatementResponse,
  EstimatedMonthlyPaymentResponse
} from '../api/types'
import { fmt } from '../../../shared/utils/format'
import { ApiError } from '../../../shared/api/client'

export default function CardDetailPage() {
  const { cardId } = useParams<{ cardId: string }>()
  const [card, setCard] = useState<CardResponse | null>(null)
  const [lines, setLines] = useState<CreditLineResponse[]>([])
  const [statements, setStatements] = useState<StatementResponse[]>([])
  const [estimado, setEstimado] = useState<EstimatedMonthlyPaymentResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [showStatementForm, setShowStatementForm] = useState(false)
  const [preview, setPreview] = useState<ParsedStatementResponse | null>(null)
  const [parsing, setParsing] = useState(false)
  const [bancoParser, setBancoParser] = useState<'DAVIVIENDA' | 'BANCOLOMBIA'>('DAVIVIENDA')
  const [editandoCargos, setEditandoCargos] = useState(false)
  const [cargosFijosInput, setCargosFijosInput] = useState('')

  const [nombre, setNombre] = useState('')
  const [saldoPendiente, setSaldoPendiente] = useState('')
  const [cuotasRestantes, setCuotasRestantes] = useState('')
  const [tasaEA, setTasaEA] = useState('')
  const [tipoAmortizacion, setTipoAmortizacion] = useState<AmortizationType>('CAPITAL_FIJO')

  const [periodoInicio, setPeriodoInicio] = useState('')
  const [periodoFin, setPeriodoFin] = useState('')
  const [saldoTotal, setSaldoTotal] = useState('')
  const [pagoMinimo, setPagoMinimo] = useState('')
  const [fechaLimitePago, setFechaLimitePago] = useState('')
  const [cuotaManejo, setCuotaManejo] = useState('')
  const [otrosCargos, setOtrosCargos] = useState('')

  const cargar = () => {
    if (!cardId) return
    Promise.all([
      cardsApi.obtener(cardId),
      creditLinesApi.listarPorTarjeta(cardId),
      statementsApi.listarPorTarjeta(cardId),
      cardsApi.estimarMes(cardId)
    ])
      .then(([c, l, s, est]) => {
        setCard(c)
        setLines(l)
        setStatements(s)
        setEstimado(est)
        setCargosFijosInput(String(c.cargosFijosMensuales))
      })
      .catch((e: ApiError) => setError(e.message))
  }

  useEffect(cargar, [cardId])

  useEffect(() => {
    if (!card) return
    setBancoParser(card.banco.toLowerCase().includes('bancolombia') ? 'BANCOLOMBIA' : 'DAVIVIENDA')
  }, [card])

  const guardarCargosFijos = async () => {
    if (!card || !cardId) return
    try {
      await cardsApi.actualizar(cardId, {
        banco: card.banco,
        alias: card.alias,
        cupoTotal: card.cupoTotal,
        tasaEA: card.tasaEA,
        cargosFijosMensuales: Number(cargosFijosInput) || 0
      })
      setEditandoCargos(false)
      cargar()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo actualizar los cargos fijos')
    }
  }

  const eliminarLinea = async (lineId: string, nombre: string) => {
    if (!window.confirm(`¿Eliminar la línea "${nombre}"? Esto borra también sus abonos extraordinarios.`)) return
    try {
      await creditLinesApi.eliminar(lineId)
      cargar()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo eliminar la línea')
    }
  }

  const crear = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardId) return
    setError(null)
    try {
      await creditLinesApi.crear(cardId, {
        nombre,
        saldoPendiente: Number(saldoPendiente) || 0,
        cuotasRestantes: Number(cuotasRestantes) || 1,
        tasaEA: tasaEA ? Number(tasaEA) : null,
        tipoAmortizacion,
        ignorada: false
      })
      setNombre('')
      setSaldoPendiente('')
      setCuotasRestantes('')
      setTasaEA('')
      setShowForm(false)
      cargar()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo crear la línea')
    }
  }

  const subirPdf = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !cardId) return
    setError(null)
    setParsing(true)
    try {
      const result = await statementsApi.parsearPdf(cardId, file, bancoParser)
      setPreview(result)
      setShowStatementForm(true)
      // Prellenar el formulario con lo que sí se pudo leer; lo que falte
      // queda vacío para que el usuario lo complete (nunca se inventa).
      if (result.periodoInicio) setPeriodoInicio(result.periodoInicio)
      if (result.periodoFin) setPeriodoFin(result.periodoFin)
      if (result.saldoTotal != null) setSaldoTotal(String(result.saldoTotal))
      if (result.pagoMinimo != null) setPagoMinimo(String(result.pagoMinimo))
      if (result.fechaLimitePago) setFechaLimitePago(result.fechaLimitePago)
      if (result.cuotaManejo != null) setCuotaManejo(String(result.cuotaManejo))
      if (result.otrosCargos != null) setOtrosCargos(String(result.otrosCargos))
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo leer el PDF')
    } finally {
      setParsing(false)
      e.target.value = ''
    }
  }

  const importarCandidato = async (c: ParsedStatementResponse['candidatosLineasCredito'][number]) => {
    if (!cardId) return
    try {
      await creditLinesApi.crear(cardId, {
        nombre: c.nombre,
        saldoPendiente: c.saldoPendiente ?? 0,
        cuotasRestantes: Math.max(c.cuotasTotales - c.cuotaActual, 1),
        tasaEA: c.tasaEA,
        tipoAmortizacion: 'CAPITAL_FIJO',
        ignorada: false
      })
      cargar()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo importar la línea')
    }
  }

  const crearExtracto = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!cardId) return
    setError(null)
    try {
      await statementsApi.crear(cardId, {
        periodoInicio,
        periodoFin,
        saldoTotal: Number(saldoTotal) || 0,
        pagoMinimo: Number(pagoMinimo) || 0,
        fechaLimitePago,
        cuotaManejo: Number(cuotaManejo) || 0,
        otrosCargos: Number(otrosCargos) || 0
      })
      setPeriodoInicio('')
      setPeriodoFin('')
      setSaldoTotal('')
      setPagoMinimo('')
      setFechaLimitePago('')
      setCuotaManejo('')
      setOtrosCargos('')
      setShowStatementForm(false)
      cargar()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo cargar el extracto')
    }
  }

  const eliminarExtracto = async (statementId: string, detalle: string) => {
    if (!window.confirm(`¿Eliminar ${detalle}?`)) return
    try {
      await statementsApi.eliminar(statementId)
      cargar()
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'No se pudo eliminar el extracto')
    }
  }

  if (!card) return <p className="muted">Cargando…</p>

  return (
    <div>
      <p className="muted" style={{ marginBottom: 14 }}>
        {card.banco} · {card.alias}
      </p>

      {error && <div className="warning">⚠ {error}</div>}

      <div className="panel">
        <h2 style={{ fontSize: 15.5, marginBottom: 2 }}>Pago aproximado del mes en curso</h2>
        <p className="muted" style={{ marginBottom: 12 }}>
          Estimado tuyo, calculado con la cuota #1 de cada línea activa + cargos fijos.
          No es el pago mínimo oficial que exige el banco.
        </p>

        {estimado && (
          <>
            {estimado.porLinea.map((l) => (
              <div key={l.creditLineId} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                <span className="muted">{l.nombre}</span>
                <span>{fmt(l.cuotaMes)}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
              <span className="muted">Cargos fijos mensuales</span>
              {editandoCargos ? (
                <span style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <input
                    type="number"
                    value={cargosFijosInput}
                    onChange={(e) => setCargosFijosInput(e.target.value)}
                    style={{ width: 110 }}
                  />
                  <button className="primary" onClick={guardarCargosFijos}>Guardar</button>
                  <button className="ghost" onClick={() => setEditandoCargos(false)}>Cancelar</button>
                </span>
              ) : (
                <span>
                  {fmt(estimado.cargosFijos)}{' '}
                  <button className="ghost" onClick={() => setEditandoCargos(true)}>Editar</button>
                </span>
              )}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 8, paddingTop: 8, display: 'flex', justifyContent: 'space-between' }}>
              <b>Total aproximado</b>
              <b>{fmt(estimado.total)}</b>
            </div>
          </>
        )}
      </div>

      <div className="panel">
        <h2 style={{ fontSize: 15.5, marginBottom: 10 }}>Líneas de crédito</h2>

        {lines.length === 0 && (
          <p className="muted">
            Registra el diferido más grande de esta tarjeta (ej. REDIFE) para empezar a simular.
            No hace falta cargar compras pequeñas a 1 cuota.
          </p>
        )}

        <div className="overflow">
          {lines.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th className="num">Saldo</th>
                  <th className="num">Cuotas restantes</th>
                  <th>Tipo</th>
                  <th></th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((l) => (
                  <tr key={l.id} style={l.ignorada ? { opacity: 0.5 } : undefined}>
                    <td>{l.nombre}</td>
                    <td className="num">{fmt(l.saldoPendiente)}</td>
                    <td className="num">{l.cuotasRestantes}</td>
                    <td>{l.tipoAmortizacion === 'CAPITAL_FIJO' ? 'Capital fijo' : 'Cuota fija'}</td>
                    <td>
                      <Link to={`/lines/${l.id}`}>Simular →</Link>
                    </td>
                    <td>
                      <button className="remove" onClick={() => eliminarLinea(l.id, l.nombre)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: 14 }}>
          {!showForm ? (
            <button className="ghost" onClick={() => setShowForm(true)}>
              + Agregar línea de crédito
            </button>
          ) : (
            <form onSubmit={crear}>
              <div className="field">
                <label>Nombre (ej. REDIFE CAPITAL)</label>
                <input value={nombre} onChange={(e) => setNombre(e.target.value)} required />
              </div>
              <div className="field">
                <label>Saldo pendiente</label>
                <input
                  type="number"
                  value={saldoPendiente}
                  onChange={(e) => setSaldoPendiente(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Cuotas restantes</label>
                <input
                  type="number"
                  value={cuotasRestantes}
                  onChange={(e) => setCuotasRestantes(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Tasa E.A. % (vacío = usa la de la tarjeta)</label>
                <input
                  type="number"
                  step="0.01"
                  value={tasaEA}
                  onChange={(e) => setTasaEA(e.target.value)}
                  placeholder={`${card.tasaEA}`}
                />
              </div>
              <div className="field">
                <label>Tipo de amortización</label>
                <select
                  value={tipoAmortizacion}
                  onChange={(e) => setTipoAmortizacion(e.target.value as AmortizationType)}
                >
                  <option value="CAPITAL_FIJO">Capital fijo (diferido tipo REDIFE)</option>
                  <option value="CUOTA_FIJA">Cuota fija (anualidad)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="primary">Guardar</button>
                <button type="button" className="ghost" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <div className="panel">
        <h2 style={{ fontSize: 15.5, marginBottom: 10 }}>Extractos cargados</h2>
        <p className="muted" style={{ marginBottom: 12 }}>
          Carga manual mes a mes (HU-2.1). Sirve como historial — la simulación
          siempre corre sobre el saldo actual de las líneas de crédito, no sobre
          extractos pasados.
        </p>

        {statements.length === 0 && (
          <p className="muted">Todavía no has cargado ningún extracto de esta tarjeta.</p>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Banco del extracto</label>
            <select value={bancoParser} onChange={(e) => setBancoParser(e.target.value as 'DAVIVIENDA' | 'BANCOLOMBIA')}>
              <option value="DAVIVIENDA">Davivienda</option>
              <option value="BANCOLOMBIA">Bancolombia</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Cargar desde PDF (beta)</label>
            <input type="file" accept="application/pdf" onChange={subirPdf} disabled={parsing} />
          </div>
        </div>
        {parsing && <p className="muted" style={{ marginTop: -8, marginBottom: 14 }}>Leyendo el PDF…</p>}

        {preview && preview.camposFaltantes.length > 0 && (
          <div className="warning">
            ⚠ No se pudieron leer estos campos, complétalos a mano abajo: {preview.camposFaltantes.join(', ')}
          </div>
        )}

        {preview && (
          <details style={{ marginBottom: 14 }}>
            <summary className="muted" style={{ cursor: 'pointer' }}>
              Ver texto crudo extraído del PDF (para diagnóstico)
            </summary>
            <textarea
              readOnly
              value={preview.textoDebug}
              style={{ width: '100%', height: 220, marginTop: 8, fontFamily: 'monospace', fontSize: 11.5 }}
            />
          </details>
        )}

        {preview && preview.candidatosLineasCredito.length > 0 && (
          <div style={{ marginBottom: 14 }}>
            <p className="muted" style={{ marginBottom: 6 }}>
              Diferidos detectados en el PDF — revisa y decide cuáles importar como línea de crédito:
            </p>
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Cuota</th>
                  <th className="num">Saldo pendiente</th>
                  <th className="num">Tasa E.A.</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {preview.candidatosLineasCredito.map((c, i) => (
                  <tr key={i}>
                    <td>{c.nombre}</td>
                    <td>{c.cuotaActual} de {c.cuotasTotales}</td>
                    <td className="num">{c.saldoPendiente != null ? fmt(c.saldoPendiente) : '—'}</td>
                    <td className="num">{c.tasaEA != null ? `${c.tasaEA}%` : '—'}</td>
                    <td>
                      <button className="ghost" onClick={() => importarCandidato(c)}>Importar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="overflow">
          {statements.length > 0 && (
            <table>
              <thead>
                <tr>
                  <th>Período</th>
                  <th className="num">Saldo total</th>
                  <th className="num">Pago mínimo</th>
                  <th>Fecha límite</th>
                  <th className="num">Manejo</th>
                  <th className="num">Otros cargos</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {statements.map((s) => (
                  <tr key={s.id}>
                    <td>{s.periodoInicio} → {s.periodoFin}</td>
                    <td className="num">{fmt(s.saldoTotal)}</td>
                    <td className="num">{fmt(s.pagoMinimo)}</td>
                    <td>{s.fechaLimitePago}</td>
                    <td className="num">{fmt(s.cuotaManejo)}</td>
                    <td className="num">{fmt(s.otrosCargos)}</td>
                    <td>
                      <button className="remove" onClick={() => eliminarExtracto(s.id, `el extracto ${s.periodoInicio} → ${s.periodoFin}`)}>✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div style={{ marginTop: 14 }}>
          {!showStatementForm ? (
            <button className="ghost" onClick={() => setShowStatementForm(true)}>
              + Cargar extracto
            </button>
          ) : (
            <form onSubmit={crearExtracto}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="field">
                  <label>Inicio del período</label>
                  <input type="date" value={periodoInicio} onChange={(e) => setPeriodoInicio(e.target.value)} required />
                </div>
                <div className="field">
                  <label>Fin del período</label>
                  <input type="date" value={periodoFin} onChange={(e) => setPeriodoFin(e.target.value)} required />
                </div>
              </div>
              <div className="field">
                <label>Saldo total del extracto</label>
                <input type="number" value={saldoTotal} onChange={(e) => setSaldoTotal(e.target.value)} required />
              </div>
              <div className="field">
                <label>Pago mínimo</label>
                <input type="number" value={pagoMinimo} onChange={(e) => setPagoMinimo(e.target.value)} required />
              </div>
              <div className="field">
                <label>Fecha límite de pago</label>
                <input type="date" value={fechaLimitePago} onChange={(e) => setFechaLimitePago(e.target.value)} required />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="field">
                  <label>Cuota de manejo</label>
                  <input type="number" value={cuotaManejo} onChange={(e) => setCuotaManejo(e.target.value)} />
                </div>
                <div className="field">
                  <label>Otros cargos</label>
                  <input type="number" value={otrosCargos} onChange={(e) => setOtrosCargos(e.target.value)} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button type="submit" className="primary">Guardar extracto</button>
                <button type="button" className="ghost" onClick={() => setShowStatementForm(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
