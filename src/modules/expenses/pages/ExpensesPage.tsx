import { useCallback, useEffect, useState } from 'react'
import { expensesApi } from '../api/endpoints'
import type { ExpenseCategory, ExpenseItem, ExpenseMonth } from '../api/types'
import BillsPanel from '../components/BillsPanel'
import BudgetPanel from '../components/BudgetPanel'
import CategoriesModal from '../components/CategoriesModal'
import ExpenseForm from '../components/ExpenseForm'
import ExpenseTable from '../components/ExpenseTable'
import IncomesPanel from '../components/IncomesPanel'
import { DebtsPanel, MonthSavingsPanel } from '../components/MonthBlocks'
import {
  MIGRACION_AHORROS,
  MIGRACION_ANIO,
  MIGRACION_DEUDAS,
  MIGRACION_FACTURAS,
  MIGRACION_GASTOS,
  MIGRACION_INGRESOS,
  MIGRACION_MES,
  MIGRACION_TOTAL
} from '../data/migracionOctubre'
import { DEV_USER_ID } from '../../../shared/config/devUser'
import { ApiError } from '../../../shared/api/client'
import { errorMessage } from '../../../shared/api/errorMessage'
import MetricCard from '../../../shared/ui/MetricCard'
import { money, parseNumber, todayISO } from '../../../shared/utils/format'

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sept', 'oct', 'nov', 'dic']
const hoy = new Date()

type Catalogo = 'gastos' | 'facturas'

/** Gastos diarios + bloques mensuales (ingresos, facturas, ahorro, deudas), con backend real. */
export default function ExpensesPage() {
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [mes, setMes] = useState(hoy.getMonth() + 1)
  const mk = `${anio}-${mes}`
  const [data, setData] = useState<ExpenseMonth | null>(null)
  const [billCats, setBillCats] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [fecha, setFecha] = useState(todayISO())
  const [valor, setValor] = useState('')
  const [categoriaId, setCategoriaId] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [showCats, setShowCats] = useState(false)
  const [catTipo, setCatTipo] = useState<Catalogo>('gastos')
  const [aviso, setAviso] = useState<string | null>(null)
  const [importConflicto, setImportConflicto] = useState(false)

  const cargar = useCallback(() => {
    setLoading(true)
    Promise.all([
      expensesApi.months.get(DEV_USER_ID, anio, mes),
      expensesApi.billCategories.list(DEV_USER_ID)
    ])
      .then(([m, cats]) => {
        setData(m)
        setBillCats(cats)
        setError(null)
      })
      .catch((e) => setError(errorMessage(e, 'No se pudo cargar el mes')))
      .finally(() => setLoading(false))
  }, [anio, mes])

  useEffect(() => {
    cargar()
  }, [cargar])

  const nombreCategoria = (id: string) =>
    data?.categorias.find((c) => c.categoriaId === id)?.nombre ?? '(eliminada)'

  const limpiarForm = () => {
    setFecha(todayISO())
    setValor('')
    setCategoriaId('')
    setDescripcion('')
    setEditandoId(null)
  }

  /** Guarda contra el backend y recarga; devuelve mensaje de error o null. */
  const guardarGasto = (): string | null => {
    const v = parseNumber(valor)
    if (v === null || !Number.isInteger(v) || v <= 0) return 'El valor debe ser un número entero mayor a 0.'
    const body = { fecha, valor: v, categoriaId, descripcion: descripcion.trim() }
    const op =
      editandoId != null
        ? expensesApi.expenses.update(DEV_USER_ID, editandoId, body)
        : expensesApi.months.createExpense(DEV_USER_ID, anio, mes, body)
    op.then(() => {
      limpiarForm()
      setAviso(null)
      cargar()
    }).catch((e) => setAviso(errorMessage(e, 'No se pudo guardar el gasto')))
    return null
  }

  const editar = (g: ExpenseItem) => {
    setEditandoId(g.id)
    setFecha(g.fecha)
    setValor(String(g.valor))
    setCategoriaId(g.categoriaId)
    setDescripcion(g.descripcion)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const moverMes = (d: number) => {
    let m = mes + d
    let a = anio
    if (m < 1) {
      m = 12
      a -= 1
    }
    if (m > 12) {
      m = 1
      a += 1
    }
    setMes(m)
    setAnio(a)
    limpiarForm()
    setAviso(null)
  }

  const guardarPresupuesto = (id: string, monto: number | null) => {
    expensesApi.months
      .saveBudgets(DEV_USER_ID, anio, mes, { [id]: monto })
      .then((m) => setData(m))
      .catch((e) => setAviso(errorMessage(e, 'No se pudo guardar el presupuesto')))
  }

  const guardarBloque = (
    nombre: string,
    op: Promise<ExpenseMonth>
  ) => {
    op.then((m) => {
      setData(m)
      setAviso(null)
    }).catch((e) => setAviso(errorMessage(e, `No se pudo guardar ${nombre}`)))
  }

  /** Copia el proyectado del último mes con presupuesto (el Excel lo hacía a mano). */
  const heredarPresupuesto = () => {
    if (!data?.herenciaDesde) return
    const [a, m] = data.herenciaDesde.split('-').map(Number)
    expensesApi.months
      .get(DEV_USER_ID, a, m)
      .then((prev) => {
        const presupuestos: Record<string, number | null> = {}
        for (const c of prev.categorias) if (c.proyectado !== null) presupuestos[c.categoriaId] = c.proyectado
        return expensesApi.months.saveBudgets(DEV_USER_ID, anio, mes, presupuestos)
      })
      .then((m) => {
        setData(m)
        setAviso(`Presupuesto copiado de ${data.herenciaDesde}. Ajústalo por categoría si hace falta.`)
      })
      .catch((e) => setAviso(errorMessage(e, 'No se pudo heredar el presupuesto')))
  }

  /** Migración por única vez de octubre 2026 desde el Excel (5 bloques). */
  const importarOctubre = (forzar: boolean) => {
    expensesApi.months
      .importMonth(
        DEV_USER_ID,
        MIGRACION_ANIO,
        MIGRACION_MES,
        {
          gastos: MIGRACION_GASTOS,
          ingresos: MIGRACION_INGRESOS,
          facturas: MIGRACION_FACTURAS,
          ahorro: MIGRACION_AHORROS,
          deudas: MIGRACION_DEUDAS
        },
        forzar
      )
      .then((r) => {
        setImportConflicto(false)
        setAviso(
          `Octubre importado: ${r.importados} gastos por ${money(r.total)} (Excel: ${money(MIGRACION_TOTAL)}), ` +
            `${r.ingresos} ingresos, ${r.facturas} facturas, ${r.ahorros} ahorros, ${r.deudas} deudas.`
        )
        limpiarForm()
        cargar()
      })
      .catch((e) => {
        if (e instanceof ApiError && e.status === 409 && !forzar) {
          setImportConflicto(true)
          setAviso(`${e.message} Pulsa el botón de nuevo para reemplazarlos.`)
        } else {
          setAviso(errorMessage(e, 'No se pudo importar octubre'))
        }
      })
  }

  const pct: number | null =
    data && data.totalProyectado > 0 ? data.totalReal / data.totalProyectado : null
  const fueraDeMes =
    fecha !== '' && (fecha.length < 7 || Number(fecha.slice(0, 4)) !== anio || Number(fecha.slice(5, 7)) !== mes)

  const gastosVista = data?.gastos ?? []

  const categoriasVista =
    data?.categorias.map((c) => ({ id: c.categoriaId, nombre: c.nombre, activa: c.activa })) ?? []

  const budgetsVista: Record<string, number> = {}
  for (const c of data?.categorias ?? []) if (c.proyectado !== null) budgetsVista[c.categoriaId] = c.proyectado

  const [catsAdmin, setCatsAdmin] = useState<ExpenseCategory[]>([])
  const usos: Record<string, number> = {}
  for (const c of catsAdmin) usos[c.id] = c.usos
  const catsApi = catTipo === 'gastos' ? expensesApi.categories : expensesApi.billCategories
  const abrirCats = (tipo: Catalogo) => {
    setCatTipo(tipo)
    ;(tipo === 'gastos' ? expensesApi.categories : expensesApi.billCategories)
      .list(DEV_USER_ID)
      .then((l) => {
        setCatsAdmin(l)
        setShowCats(true)
      })
      .catch((e) => setAviso(errorMessage(e, 'No se pudieron cargar las categorías')))
  }

  const recargarCats = () =>
    catsApi
      .list(DEV_USER_ID)
      .then((l) => {
        setCatsAdmin(l)
        cargar()
      })
      .catch((e) => setAviso(errorMessage(e, 'No se pudieron cargar las categorías')))

  return (
    <div>
      <div className="panel">
        <div className="sv-head">
          <div>
            <h2 style={{ fontSize: 17 }}>Gastos diarios</h2>
            <p className="muted" style={{ margin: '4px 0 0' }}>
              Ingresos, facturas, gastos, ahorro y deudas del mes
            </p>
          </div>
          <div className="ex-month">
            <button className="secondary sm" onClick={() => moverMes(-1)} aria-label="Mes anterior">
              ‹
            </button>
            <strong style={{ minWidth: 110, textAlign: 'center' }}>
              {MESES[mes - 1]} {anio}
            </strong>
            <button className="secondary sm" onClick={() => moverMes(1)} aria-label="Mes siguiente">
              ›
            </button>
            <button className="secondary sm" onClick={() => abrirCats('gastos')}>
              ⚙ Categorías
            </button>
            {anio === MIGRACION_ANIO && mes === MIGRACION_MES && (
              <button
                className="secondary sm"
                onClick={() => importarOctubre(importConflicto)}
                title="Trae los 5 bloques de octubre desde el Excel"
              >
                {importConflicto ? '↻ Reemplazar octubre' : '⬇ Importar octubre del Excel'}
              </button>
            )}
          </div>
        </div>

        {loading && <p className="muted">Cargando…</p>}
        {error && (
          <div className="warning" style={{ marginTop: 12 }}>
            ⚠ {error} <button className="secondary sm" onClick={cargar}>Reintentar</button>
          </div>
        )}

        {data && (
          <>
            <div className="sv-metrics" style={{ margin: '16px 0 0' }}>
              <MetricCard label="Ingresos" value={money(data.ingresos.totalRecibido)} hint="recibidos en el mes" />
              <MetricCard
                label="Gastos totales"
                value={money(data.totalGastado)}
                hint="facturas + gastos + ahorro + deudas"
              />
              <MetricCard
                label="Saldo restante"
                value={money(data.saldoRestante)}
                tone={data.saldoRestante < 0 ? 'bad' : 'good'}
              />
            </div>
            {pct !== null && (
              <div
                className="sv-progress"
                style={{ marginTop: 12 }}
                role="progressbar"
                aria-valuenow={Math.round(pct * 100)}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <div
                  className={`sv-progress-fill ${pct > 1 ? 'sv-late' : pct >= 0.8 ? 'sv-ok' : 'sv-done'}`}
                  style={{ width: `${Math.min(100, pct * 100)}%` }}
                />
              </div>
            )}
            {pct !== null && (
              <p className="muted" style={{ fontSize: 12, margin: '6px 0 0' }}>
                Presupuesto de gastos: {money(data.totalProyectado)} · gastado {Math.round(pct * 100)} %
              </p>
            )}
            {data.totalProyectado === 0 && data.herenciaDesde && (
              <div className="sv-note" style={{ margin: '12px 0 0' }}>
                Este mes aún no tiene presupuesto de gastos.{' '}
                <button className="secondary sm" onClick={heredarPresupuesto}>
                  Copiar el de {data.herenciaDesde}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {aviso && (
        <div className="sv-note" style={{ marginBottom: 14 }}>
          {aviso}
        </div>
      )}

      {data && (
        <>
          <IncomesPanel
            key={`ing-${mk}`}
            anio={anio}
            mes={mes}
            filas={data.ingresos.filas}
            sugerencias={data.sugerenciasIngresos}
            onSave={(ingresos) =>
              guardarBloque('los ingresos', expensesApi.months.saveIncomes(DEV_USER_ID, anio, mes, ingresos))
            }
          />

          <BillsPanel
            key={`fac-${mk}`}
            anio={anio}
            mes={mes}
            filas={data.facturas.filas}
            categorias={billCats}
            onSave={(facturas) =>
              guardarBloque('las facturas', expensesApi.months.saveBills(DEV_USER_ID, anio, mes, facturas))
            }
            onGestionarCategorias={() => abrirCats('facturas')}
          />

          <ExpenseForm
            fecha={fecha}
            valor={valor}
            categoriaId={categoriaId}
            descripcion={descripcion}
            categorias={categoriasVista}
            editandoId={editandoId}
            fueraDeMes={fueraDeMes}
            onFecha={setFecha}
            onValor={setValor}
            onCategoria={setCategoriaId}
            onDescripcion={setDescripcion}
            onGuardar={guardarGasto}
            onCancelarEdicion={limpiarForm}
          />

          <BudgetPanel
            categorias={categoriasVista}
            gastosDelMes={gastosVista}
            budgets={budgetsVista}
            onGuardarPresupuesto={guardarPresupuesto}
          />

          <ExpenseTable
            gastos={gastosVista}
            nombreCategoria={nombreCategoria}
            onEditar={editar}
            onEliminar={(id) => {
              expensesApi.expenses
                .remove(DEV_USER_ID, id)
                .then(() => cargar())
                .catch((e) => setAviso(errorMessage(e, 'No se pudo eliminar el gasto')))
            }}
          />

          <MonthSavingsPanel
            key={`aho-${mk}`}
            filas={data.ahorro.filas}
            sugerencias={data.sugerenciasAhorro}
            onSave={(ahorros) =>
              guardarBloque('el ahorro', expensesApi.months.saveSavings(DEV_USER_ID, anio, mes, ahorros))
            }
          />

          <DebtsPanel
            key={`deu-${mk}`}
            filas={data.deudas.filas}
            sugerencias={data.sugerenciasDeudas}
            onSave={(deudas) =>
              guardarBloque('las deudas', expensesApi.months.saveDebts(DEV_USER_ID, anio, mes, deudas))
            }
          />
        </>
      )}

      <CategoriesModal
        categorias={catsAdmin}
        usos={usos}
        abierto={showCats}
        onCerrar={() => setShowCats(false)}
        onCrear={(nombre) => {
          catsApi
            .create(DEV_USER_ID, nombre)
            .then(() => recargarCats())
            .catch((e) => setAviso(errorMessage(e, 'No se pudo crear la categoría')))
          return null
        }}
        onRenombrar={(id, nombre) => {
          const c = catsAdmin.find((x) => x.id === id)
          catsApi
            .update(DEV_USER_ID, id, nombre, c?.activa ?? true)
            .then(() => recargarCats())
            .catch((e) => setAviso(errorMessage(e, 'No se pudo renombrar')))
          return null
        }}
        onCambiarEstado={(id, activa) => {
          const c = catsAdmin.find((x) => x.id === id)
          catsApi
            .update(DEV_USER_ID, id, c?.nombre ?? '', activa)
            .then(() => recargarCats())
            .catch((e) => setAviso(errorMessage(e, 'No se pudo cambiar el estado')))
          return null
        }}
        onEliminar={(id) => {
          catsApi
            .remove(DEV_USER_ID, id)
            .then(() => recargarCats())
            .catch((e) => setAviso(errorMessage(e, 'No se pudo eliminar')))
          return null
        }}
      />
    </div>
  )
}
