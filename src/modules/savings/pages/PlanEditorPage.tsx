import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { savingsApi } from '../api/endpoints'
import type {
  ContributionTiming,
  GoalResponse,
  PlanRequest,
  PreviewRequest,
  ProductInfo,
  ProductType,
  RateOrigin,
  SimulationResponse,
  WithholdingMode
} from '../api/types'
import SimulationTable from '../components/SimulationTable'
import { PRODUCT_LABEL } from '../labels'
import { errorMessage } from '../../../shared/api/errorMessage'
import { useDebouncedValue } from '../../../shared/hooks/useDebouncedValue'
import LineChart from '../../../shared/ui/LineChart'
import type { ChartMarker, ChartSeries } from '../../../shared/ui/LineChart'
import MetricCard from '../../../shared/ui/MetricCard'
import { firstOfMonthISO, fromFraction, money, parseNumber, pct, toFraction } from '../../../shared/utils/format'

const ORIGIN_LABEL: Record<RateOrigin, string> = {
  VIGENTE: 'vigente',
  ULTIMA_CONOCIDA: 'última conocida',
  PERSONALIZADO: 'personalizada'
}

/**
 * Crear o editar un plan con simulación en vivo (HU-A.2, A.3, A.4, A.5, A.9, A.10).
 * Rutas: /ahorro/metas/:goalId/planes/nuevo  y  /ahorro/planes/:planId
 */
export default function PlanEditorPage() {
  const params = useParams<{ goalId?: string; planId?: string }>()
  const navigate = useNavigate()
  const planId = params.planId

  const [goalId, setGoalId] = useState<string | undefined>(params.goalId)
  const [goal, setGoal] = useState<GoalResponse | null>(null)
  const [products, setProducts] = useState<ProductInfo[]>([])
  const [loadError, setLoadError] = useState<string | null>(null)

  const [nombre, setNombre] = useState('Plan A')
  const [tipo, setTipo] = useState<ProductType>('CUENTA_AHORROS')
  const [tasa, setTasa] = useState('10')
  const [comision, setComision] = useState('0')
  const [aporte, setAporte] = useState('0')
  const [momento, setMomento] = useState<ContributionTiming>('FIN')
  const [plazo, setPlazo] = useState('12')
  const [inicio, setInicio] = useState(firstOfMonthISO())
  const [inflacion, setInflacion] = useState('0')
  const [tratamiento, setTratamiento] = useState<WithholdingMode>('MENSUAL')
  // Valores que esta pantalla no edita todavía (fase 2) pero que se conservan al guardar.
  const [crecimiento, setCrecimiento] = useState(0)
  const [retencionTarifa, setRetencionTarifa] = useState<number | null>(null)

  const [sim, setSim] = useState<SimulationResponse | null>(null)
  const [simError, setSimError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    async function init() {
      try {
        const catalogo = await savingsApi.catalog.products()
        let gid = params.goalId
        if (planId) {
          const plan = await savingsApi.plans.get(planId)
          gid = plan.goalId
          if (!cancelled) {
            setNombre(plan.nombre)
            setTipo(plan.tipoProducto)
            setTasa(fromFraction(plan.tasaEA))
            setComision(fromFraction(plan.comisionEA))
            setAporte(String(plan.aporteMensual))
            setMomento(plan.momentoAporte)
            setPlazo(String(plan.plazoMeses))
            setInicio(plan.fechaInicio)
            setInflacion(fromFraction(plan.inflacionAnual))
            setTratamiento(plan.tratamientoRetencion)
            setCrecimiento(plan.crecimientoAporteAnual)
            setRetencionTarifa(plan.retencionTarifa)
          }
        }
        if (!gid) throw new Error('Falta la meta del plan')
        const meta = await savingsApi.goals.get(gid)
        if (!cancelled) {
          setProducts(catalogo)
          setGoalId(gid)
          setGoal(meta)
        }
      } catch (e) {
        if (!cancelled) setLoadError(errorMessage(e, 'No se pudo cargar el plan'))
      }
    }
    void init()
    return () => {
      cancelled = true
    }
  }, [planId, params.goalId])

  const info = products.find((p) => p.tipo === tipo)

  const cambiarProducto = (nuevo: ProductType) => {
    setTipo(nuevo)
    const datos = products.find((p) => p.tipo === nuevo)
    if (datos) {
      setTratamiento(datos.tratamientoRetencion)
      if (!datos.permiteComision) setComision('0')
    }
  }

  // Solicitud válida, o null si algún campo todavía no permite simular.
  const body = useMemo<PreviewRequest | null>(() => {
    if (!goal) return null
    const tasaN = parseNumber(tasa)
    const plazoN = parseNumber(plazo)
    const aporteN = parseNumber(aporte) ?? 0
    const comisionN = parseNumber(comision) ?? 0
    const inflacionN = parseNumber(inflacion) ?? 0
    if (tasaN == null || tasaN <= 0 || tasaN > 100) return null
    if (plazoN == null || !Number.isInteger(plazoN) || plazoN < 1 || plazoN > 600) return null
    if (aporteN < 0 || comisionN < 0 || comisionN >= 100 || inflacionN < 0 || inflacionN > 50) return null
    return {
      saldoInicial: goal.saldoInicial,
      montoObjetivo: goal.montoObjetivo,
      tipoProducto: tipo,
      tasaEA: toFraction(tasaN),
      comisionEA: toFraction(comisionN),
      aporteMensual: aporteN,
      momentoAporte: momento,
      crecimientoAporteAnual: crecimiento,
      plazoMeses: plazoN,
      fechaInicio: inicio || null,
      inflacionAnual: toFraction(inflacionN),
      tratamientoRetencion: tratamiento,
      retencionTarifa
    }
  }, [goal, tasa, plazo, aporte, comision, inflacion, tipo, momento, crecimiento, inicio, tratamiento, retencionTarifa])

  // Recalcula en vivo, con retraso para no llamar al backend en cada tecla (HU-A.2 criterio 2).
  const bodyConRetraso = useDebouncedValue(body, 300)

  useEffect(() => {
    if (!bodyConRetraso) {
      setSim(null)
      return
    }
    let cancelled = false
    savingsApi.simulation
      .preview(bodyConRetraso)
      .then((r) => {
        if (!cancelled) {
          setSim(r)
          setSimError(null)
        }
      })
      .catch((e) => {
        if (!cancelled) setSimError(errorMessage(e, 'No se pudo simular con estos datos'))
      })
    return () => {
      cancelled = true
    }
  }, [bodyConRetraso])

  const guardar = async (e: FormEvent) => {
    e.preventDefault()
    if (!body || !goalId) {
      setSaveError('Revisa los datos: hay valores incompletos o fuera de rango.')
      return
    }
    const request: PlanRequest = {
      nombre: nombre.trim(),
      tipoProducto: body.tipoProducto,
      tasaEA: body.tasaEA,
      comisionEA: body.comisionEA,
      aporteMensual: body.aporteMensual,
      momentoAporte: body.momentoAporte,
      crecimientoAporteAnual: body.crecimientoAporteAnual,
      plazoMeses: body.plazoMeses,
      fechaInicio: body.fechaInicio,
      inflacionAnual: body.inflacionAnual,
      tratamientoRetencion: body.tratamientoRetencion,
      retencionTarifa: body.retencionTarifa
    }
    setSaving(true)
    setSaveError(null)
    try {
      if (planId) await savingsApi.plans.update(planId, request)
      else await savingsApi.plans.create(goalId, request)
      navigate(`/ahorro/metas/${goalId}`)
    } catch (err) {
      setSaveError(errorMessage(err, 'No se pudo guardar el plan'))
    } finally {
      setSaving(false)
    }
  }

  const chart = useMemo(() => {
    if (!sim || !goal || sim.meses.length === 0) return null
    const inicial = sim.meses[0]?.saldoInicial ?? 0
    let acumulado = inicial
    const aportado = [
      { x: 0, y: inicial },
      ...sim.meses.map((m) => {
        acumulado += m.aporte
        return { x: m.mes, y: acumulado }
      })
    ]
    const series: ChartSeries[] = [
      {
        name: 'Saldo neto',
        color: 'var(--accent)',
        width: 3,
        points: [{ x: 0, y: inicial }, ...sim.meses.map((m) => ({ x: m.mes, y: m.saldoNeto }))]
      },
      { name: 'Total aportado', color: 'var(--muted)', width: 2, points: aportado }
    ]
    const markers: ChartMarker[] = []
    const mesMeta = sim.resumen.mesMetaAlcanzada
    if (mesMeta != null && mesMeta > 0) {
      markers.push({ x: mesMeta, y: goal.montoObjetivo, label: `Meta: mes ${mesMeta}`, color: 'var(--good)' })
    }
    return { series, markers }
  }, [sim, goal])

  if (loadError) {
    return (
      <div>
        <div className="warning">⚠ {loadError}</div>
        <Link to="/ahorro">← Volver a tus metas</Link>
      </div>
    )
  }
  if (!goal) return <p className="muted">Cargando…</p>

  const resumen = sim?.resumen
  const productosDisponibles =
    products.length > 0
      ? products
      : (['CUENTA_AHORROS', 'CDT', 'FIC', 'MANUAL'] as ProductType[]).map<ProductInfo>((t) => ({
          tipo: t,
          nombre: PRODUCT_LABEL[t],
          tratamientoRetencion: 'MENSUAL',
          permiteComision: t === 'FIC' || t === 'MANUAL',
          retencionVigente: null
        }))

  return (
    <div>
      <p style={{ margin: '0 0 12px' }}>
        <Link to={`/ahorro/metas/${goal.id}`}>← {goal.nombre}</Link>
      </p>

      <div className="sv-editor">
        <form className="panel" onSubmit={guardar}>
          <h2 style={{ fontSize: 16, marginBottom: 12 }}>{planId ? 'Editar plan' : 'Nuevo plan'}</h2>
          {saveError && <div className="warning">⚠ {saveError}</div>}

          <div className="field">
            <label>Nombre del plan</label>
            <input value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} required />
          </div>

          <div className="field">
            <label>Producto</label>
            <select value={tipo} onChange={(e) => cambiarProducto(e.target.value as ProductType)}>
              {productosDisponibles.map((p) => (
                <option key={p.tipo} value={p.tipo}>
                  {p.nombre}
                </option>
              ))}
            </select>
          </div>

          <div className="sv-fields">
            <div className="field">
              <label>Tasa E.A. %</label>
              <input type="number" min="0" step="0.01" value={tasa} onChange={(e) => setTasa(e.target.value)} required />
            </div>
            <div className="field">
              <label>Comisión E.A. %</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={comision}
                disabled={info != null && !info.permiteComision}
                onChange={(e) => setComision(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Aporte mensual</label>
              <input type="number" min="0" step="any" value={aporte} onChange={(e) => setAporte(e.target.value)} />
            </div>
            <div className="field">
              <label>Aporte al</label>
              <select value={momento} onChange={(e) => setMomento(e.target.value as ContributionTiming)}>
                <option value="FIN">Final del mes</option>
                <option value="INICIO">Inicio del mes</option>
              </select>
            </div>
            <div className="field">
              <label>Plazo (meses)</label>
              <input type="number" min="1" max="600" step="1" value={plazo} onChange={(e) => setPlazo(e.target.value)} required />
            </div>
            <div className="field">
              <label>Inicio del plan</label>
              <input type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
            </div>
            <div className="field">
              <label>Inflación anual %</label>
              <input type="number" min="0" max="50" step="0.01" value={inflacion} onChange={(e) => setInflacion(e.target.value)} />
            </div>
            <div className="field">
              <label>Retención</label>
              <select value={tratamiento} onChange={(e) => setTratamiento(e.target.value as WithholdingMode)}>
                <option value="MENSUAL">Cada mes</option>
                <option value="AL_VENCIMIENTO">Al vencimiento</option>
              </select>
            </div>
          </div>

          <p className="muted" style={{ marginTop: 0 }}>
            Retención sobre rendimientos:{' '}
            {retencionTarifa != null
              ? `${pct(retencionTarifa)} (personalizada)`
              : info?.retencionVigente != null
                ? `${pct(info.retencionVigente)} (vigente)`
                : 'sin parámetro configurado'}
            . Saldo inicial: {money(goal.saldoInicial)} (se edita en la meta).
          </p>

          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="primary" disabled={saving || body == null}>
              {saving ? 'Guardando…' : planId ? 'Guardar cambios' : 'Crear plan'}
            </button>
            <Link to={`/ahorro/metas/${goal.id}`}>
              <button type="button" className="ghost">
                Cancelar
              </button>
            </Link>
          </div>
        </form>

        <div>
          {simError && <div className="warning">⚠ {simError}</div>}

          {!sim && !simError && (
            <div className="panel">
              <p className="muted" style={{ margin: 0 }}>
                Completa la tasa y el plazo para ver la simulación.
              </p>
            </div>
          )}

          {sim && resumen && (
            <>
              <div className="sv-metrics">
                <MetricCard label="Total aportado" value={money(resumen.totalAportado)} />
                <MetricCard label="Rendimiento bruto" value={money(resumen.rendimientoBruto)} />
                <MetricCard
                  label="Impuestos y costos"
                  value={`−${money(resumen.impuestos + resumen.comisiones)}`}
                  tone="bad"
                />
                <MetricCard label="Saldo neto final" value={money(resumen.saldoNetoFinal)} tone="accent" />
              </div>

              <div className="panel">
                <p style={{ margin: 0 }}>
                  {resumen.mesMetaAlcanzada == null
                    ? 'No se alcanza la meta dentro del plazo.'
                    : resumen.mesMetaAlcanzada === 0
                      ? 'La meta ya está cubierta con lo que tienes.'
                      : `Alcanzas la meta en el mes ${resumen.mesMetaAlcanzada}.`}
                  {resumen.avanceMeta != null && ` Al final del plazo llegas al ${pct(resumen.avanceMeta)} de la meta.`}
                </p>
                {(parseNumber(inflacion) ?? 0) > 0 && (
                  <p className="muted" style={{ marginBottom: 0 }}>
                    En pesos de hoy equivale a ≈ {money(resumen.valorRealSaldoNeto)}.
                  </p>
                )}
              </div>

              {chart && (
                <div className="panel">
                  <h3 className="sv-subtitle">Crecimiento</h3>
                  <LineChart
                    series={chart.series}
                    markers={chart.markers}
                    target={goal.montoObjetivo}
                    targetLabel={`Meta ${money(goal.montoObjetivo)}`}
                    ariaLabel="Gráfica del saldo neto y el total aportado mes a mes"
                  />
                </div>
              )}

              <div className="panel">
                <h3 className="sv-subtitle">Cronograma</h3>
                <SimulationTable meses={sim.meses} />
              </div>

              {sim.advertencias.map((a) => (
                <div key={a} className="sv-note">
                  {a}
                </div>
              ))}
              <p className="muted">
                {sim.parametrosTributarios.length > 0 &&
                  `Retención usada: ${sim.parametrosTributarios
                    .map((p) => `${pct(p.tarifa)} (${ORIGIN_LABEL[p.origen]})`)
                    .join(', ')}. `}
                {sim.aviso}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
