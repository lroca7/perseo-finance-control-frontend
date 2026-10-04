import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { savingsApi } from '../api/endpoints'
import type {
  BalanceCheckResponse,
  GoalResponse,
  MovementResponse,
  PlanResponse,
  ProgressResponse
} from '../api/types'
import BalanceCheckForm from '../components/BalanceCheckForm'
import GoalForm from '../components/GoalForm'
import type { GoalFormValues } from '../components/GoalForm'
import MovementForm from '../components/MovementForm'
import MovementsPanel from '../components/MovementsPanel'
import PlansPanel from '../components/PlansPanel'
import ProgressBar from '../components/ProgressBar'
import StatusBadge from '../components/StatusBadge'
import TrackingTable from '../components/TrackingTable'
import { iconEmoji } from '../labels'
import { errorMessage } from '../../../shared/api/errorMessage'
import LineChart from '../../../shared/ui/LineChart'
import type { ChartMarker, ChartSeries } from '../../../shared/ui/LineChart'
import MetricCard from '../../../shared/ui/MetricCard'
import { dateLabel, money, monthLabel, pct, todayISO } from '../../../shared/utils/format'

/** Seguimiento de una meta: plan vs. realidad, proyección y registro de lo ahorrado (HU-A.11 a A.16, A.22). */
export default function GoalDetailPage() {
  const { goalId } = useParams<{ goalId: string }>()
  const navigate = useNavigate()

  const [goal, setGoal] = useState<GoalResponse | null>(null)
  const [progress, setProgress] = useState<ProgressResponse | null>(null)
  const [plans, setPlans] = useState<PlanResponse[]>([])
  const [movements, setMovements] = useState<MovementResponse[]>([])
  const [checks, setChecks] = useState<BalanceCheckResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [ritmo, setRitmo] = useState<number | undefined>(undefined)
  const [ritmoInput, setRitmoInput] = useState('')

  const cargar = useCallback(async () => {
    if (!goalId) return
    try {
      const [g, p, pl, mv, ck] = await Promise.all([
        savingsApi.goals.get(goalId),
        savingsApi.progress.get(goalId, ritmo),
        savingsApi.plans.list(goalId),
        savingsApi.movements.list(goalId),
        savingsApi.balanceChecks.list(goalId)
      ])
      setGoal(g)
      setProgress(p)
      setPlans(pl)
      setMovements(mv)
      setChecks(ck)
      setError(null)
    } catch (e) {
      setError(errorMessage(e, 'No se pudo cargar la meta'))
    } finally {
      setLoading(false)
    }
  }, [goalId, ritmo])

  useEffect(() => {
    void cargar()
  }, [cargar])

  const recargar = () => void cargar()

  const guardarMeta = async (values: GoalFormValues) => {
    if (!goal) return
    await savingsApi.goals.update(goal.id, values)
    setEditing(false)
    await cargar()
  }

  const cambiarArchivo = async () => {
    if (!goal) return
    try {
      await savingsApi.goals.update(goal.id, {
        nombre: goal.nombre,
        icono: goal.icono,
        montoObjetivo: goal.montoObjetivo,
        saldoInicial: goal.saldoInicial,
        // La API exige fecha futura: si la fecha ya pasó, no se reenvía.
        fechaObjetivo: goal.fechaObjetivo && goal.fechaObjetivo > todayISO() ? goal.fechaObjetivo : null,
        estado: goal.estado === 'ARCHIVADA' ? 'ACTIVA' : 'ARCHIVADA'
      })
      await cargar()
    } catch (e) {
      setError(errorMessage(e, 'No se pudo cambiar el estado de la meta'))
    }
  }

  const eliminarMeta = async () => {
    if (!goal) return
    const aviso =
      `¿Eliminar "${goal.nombre}"? Se borrarán sus ${plans.length} planes, ` +
      `${movements.length} movimientos y ${checks.length} conciliaciones.`
    if (!window.confirm(aviso)) return
    try {
      await savingsApi.goals.remove(goal.id)
      navigate('/ahorro')
    } catch (e) {
      setError(errorMessage(e, 'No se pudo eliminar la meta'))
    }
  }

  const aplicarRitmo = () => {
    const valor = Number(ritmoInput)
    if (ritmoInput.trim() !== '' && Number.isFinite(valor) && valor >= 0) setRitmo(valor)
  }

  const quitarRitmo = () => {
    setRitmo(undefined)
    setRitmoInput('')
  }

  const chart = useMemo(() => {
    if (!goal || !progress || progress.estado === 'SIN_PLAN') return null
    const inicial = goal.saldoInicial

    const planPoints = [{ x: 0, y: inicial }, ...progress.meses.map((m) => ({ x: m.mes, y: m.saldoPlaneado }))]
    const ultimoX = planPoints[planPoints.length - 1]?.x ?? 0
    if (progress.mesMetaPlan != null && progress.mesMetaPlan > ultimoX) {
      planPoints.push({ x: progress.mesMetaPlan, y: progress.montoObjetivo })
    }

    const series: ChartSeries[] = [
      { name: 'Plan', color: 'var(--muted)', width: 2, points: planPoints },
      {
        name: 'Real',
        color: 'var(--accent)',
        width: 3,
        points: [
          { x: 0, y: inicial },
          ...progress.meses.flatMap((m) => (m.saldoReal != null ? [{ x: m.mes, y: m.saldoReal }] : []))
        ]
      }
    ]

    const markers: ChartMarker[] = []
    if (progress.mesMetaPlan != null) {
      markers.push({
        x: progress.mesMetaPlan,
        y: progress.montoObjetivo,
        label: `Plan: mes ${progress.mesMetaPlan}`,
        color: 'var(--muted)'
      })
    }
    if (progress.mesMetaProyectado != null && progress.mesEvaluado != null) {
      series.push({
        name: 'Proyección al ritmo actual',
        color: 'var(--accent2)',
        dotted: true,
        width: 2,
        points: [
          { x: progress.mesEvaluado, y: progress.saldoRealEstimado },
          { x: progress.mesMetaProyectado, y: progress.montoObjetivo }
        ]
      })
      markers.push({
        x: progress.mesMetaProyectado,
        y: progress.montoObjetivo,
        label: `Real: mes ${progress.mesMetaProyectado}`,
        color: 'var(--accent)'
      })
    }
    return { series, markers }
  }, [goal, progress])

  if (loading) return <p className="muted">Cargando…</p>
  if (!goal || !progress) {
    return (
      <div>
        {error && <div className="warning">⚠ {error}</div>}
        <Link to="/ahorro">← Volver a tus metas</Link>
      </div>
    )
  }

  const sinPlan = progress.estado === 'SIN_PLAN'
  const retraso = progress.mesesDeRetraso
  const textoRetraso =
    retraso == null
      ? null
      : retraso > 0
        ? `${retraso} meses después de lo planeado`
        : retraso < 0
          ? `${-retraso} meses antes de lo planeado`
          : 'justo cuando lo planeaste'

  return (
    <div>
      <p style={{ margin: '0 0 12px' }}>
        <Link to="/ahorro">← Tus metas</Link>
      </p>

      {error && <div className="warning">⚠ {error}</div>}

      <div className="panel">
        <div className="sv-head">
          <div>
            <h2 style={{ fontSize: 19 }}>
              <span aria-hidden="true">{iconEmoji(goal.icono)}</span> {goal.nombre}
            </h2>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              Meta de {money(goal.montoObjetivo)}
              {goal.fechaObjetivo ? ` · para el ${dateLabel(goal.fechaObjetivo)}` : ''}
              {goal.estado === 'ARCHIVADA' ? ' · archivada' : ''}
            </p>
          </div>
          <StatusBadge status={progress.estado} />
        </div>

        <div style={{ margin: '14px 0 4px' }}>
          <ProgressBar value={progress.avanceMeta} status={progress.estado} />
          <div className="sv-card-amounts">
            <span>{money(progress.saldoRealEstimado)}</span>
            <span className="muted">{pct(progress.avanceMeta)} de la meta</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
          <button className="ghost" onClick={() => setEditing((v) => !v)}>
            {editing ? 'Cerrar edición' : 'Editar meta'}
          </button>
          <button className="ghost" onClick={cambiarArchivo}>
            {goal.estado === 'ARCHIVADA' ? 'Reactivar' : 'Archivar'}
          </button>
          <button className="remove" onClick={eliminarMeta}>
            Eliminar meta
          </button>
        </div>

        {editing && (
          <div style={{ marginTop: 14 }}>
            <GoalForm initial={goal} submitLabel="Guardar cambios" onSubmit={guardarMeta} onCancel={() => setEditing(false)} />
          </div>
        )}
      </div>

      {sinPlan && (
        <div className="sv-note">
          Esta meta aún no tiene un plan: sin él no se pueden estimar rendimientos ni proyectar cuándo llegas.{' '}
          <Link to={`/ahorro/metas/${goal.id}/planes/nuevo`}>Crear el primer plan →</Link>
        </div>
      )}

      {!sinPlan && (
        <>
          <div className="sv-metrics">
            <MetricCard label="Planeado a hoy" value={money(progress.saldoPlaneado ?? 0)} />
            <MetricCard label="Real estimado" value={money(progress.saldoRealEstimado)} />
            <MetricCard
              label="Diferencia"
              value={money(progress.diferencia ?? 0)}
              tone={(progress.diferencia ?? 0) < 0 ? 'bad' : 'good'}
            />
          </div>

          {progress.estado === 'ALCANZADA' ? (
            <div className="banner">
              <div className="label">Estado</div>
              <div className="big">¡Meta alcanzada! 🎉</div>
            </div>
          ) : (
            <div className="sv-insights">
              <div className="sv-insight">
                <div className="sv-insight-label">
                  A este ritmo ({progress.ritmoActual != null ? money(progress.ritmoActual) : '—'}/mes)
                </div>
                <div className="sv-insight-main">
                  {progress.mesMetaProyectado != null
                    ? `Llegas en el mes ${progress.mesMetaProyectado}${
                        progress.fechaMetaProyectada ? ` · ${monthLabel(progress.fechaMetaProyectada)}` : ''
                      }`
                    : 'No alcanzas la meta con este ritmo'}
                </div>
                {textoRetraso && <div className="muted">{textoRetraso}</div>}
              </div>

              <div className="sv-insight">
                <div className="sv-insight-label">Para llegar a tiempo</div>
                <div className="sv-insight-main">
                  {progress.aporteNecesario != null ? `${money(progress.aporteNecesario)}/mes` : '—'}
                </div>
                <div className="muted">
                  {progress.mesesParaAporteNecesario != null
                    ? `durante los ${progress.mesesParaAporteNecesario} meses que le quedan al plan`
                    : 'el plazo del plan ya terminó o la meta está cubierta'}
                </div>
              </div>
            </div>
          )}

          {progress.estado !== 'ALCANZADA' && (
            <div className="panel">
              <h3 className="sv-subtitle">¿Y si ahorro otro monto al mes?</h3>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="Monto mensual"
                  value={ritmoInput}
                  onChange={(e) => setRitmoInput(e.target.value)}
                  style={{ maxWidth: 180 }}
                />
                <button className="primary" onClick={aplicarRitmo}>
                  Recalcular
                </button>
                {ritmo !== undefined && (
                  <button className="ghost" onClick={quitarRitmo}>
                    Usar mi ritmo real
                  </button>
                )}
              </div>
              {ritmo !== undefined && (
                <p className="muted" style={{ marginBottom: 0 }}>
                  Proyección con {money(ritmo)}/mes en lugar de tu promedio de los últimos 3 meses.
                </p>
              )}
            </div>
          )}
        </>
      )}

      <div className="sv-two">
        <div className="panel">
          <MovementForm goalId={goal.id} onSaved={recargar} />
        </div>
        <div className="panel">
          <BalanceCheckForm goalId={goal.id} onSaved={recargar} />
        </div>
      </div>

      {chart && (
        <div className="panel">
          <h3 className="sv-subtitle">Plan, real y proyección</h3>
          <LineChart
            series={chart.series}
            markers={chart.markers}
            target={progress.montoObjetivo}
            targetLabel={`Meta ${money(progress.montoObjetivo)}`}
            todayX={progress.mesEvaluado ?? undefined}
            ariaLabel="Gráfica del plan, el saldo real y la proyección hasta la meta"
          />
        </div>
      )}

      {!sinPlan && (
        <div className="panel">
          <h3 className="sv-subtitle">Mes a mes</h3>
          <TrackingTable meses={progress.meses} />
        </div>
      )}

      {progress.advertencias.map((a) => (
        <div key={a} className="sv-note">
          {a}
        </div>
      ))}

      <div className="panel">
        <MovementsPanel movements={movements} checks={checks} onChanged={recargar} />
      </div>

      <div className="panel">
        <PlansPanel goalId={goal.id} plans={plans} onChanged={recargar} />
      </div>

      <p className="muted">{progress.aviso}</p>
    </div>
  )
}
