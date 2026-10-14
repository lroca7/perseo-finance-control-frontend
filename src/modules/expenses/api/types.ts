/** Espejo de los DTOs del backend (módulo expenses). */

export interface ExpenseCategory {
  id: string
  nombre: string
  activa: boolean
  usos: number
}

export interface ExpenseItem {
  id: string
  fecha: string
  valor: number
  categoriaId: string
  categoriaNombre: string
  descripcion: string
  createdAt: string
}

export interface MonthCategoryRow {
  categoriaId: string
  nombre: string
  activa: boolean
  /** null = sin proyectado este mes. */
  proyectado: number | null
  real: number
}

export interface ExpenseMonth {
  anio: number
  mes: number
  categorias: MonthCategoryRow[]
  gastos: ExpenseItem[]
  totalProyectado: number
  totalReal: number
  /** "anio-mes" del último mes anterior con presupuesto, o null. */
  herenciaDesde: string | null
  ingresos: IncomesBlock
  facturas: BillsBlock
  ahorro: MonthSavingsBlock
  deudas: MonthDebtsBlock
  sugerenciasIngresos: string[]
  sugerenciasAhorro: string[]
  sugerenciasDeudas: string[]
  /** Facturas pagadas + gasto real + ahorrado + deudas pagadas. */
  totalGastado: number
  /** Recibido − gastado. */
  saldoRestante: number
}

export interface ImportResult {
  importados: number
  total: number
  ingresos: number
  facturas: number
  ahorros: number
  deudas: number
}

// ---- Bloques mensuales (HU-G.3) ----

export interface IncomeRow {
  id: string
  categoria: string
  fecha: string | null
  proyectado: number | null
  recibido: number | null
}

export interface BillRow {
  id: string
  categoriaId: string
  categoriaNombre: string
  categoriaActiva: boolean
  fecha: string | null
  valor: number | null
  pagado: boolean
  valorPagado: number | null
}

export interface MonthSavingRow {
  id: string
  nombre: string
  meta: number | null
  ahorrado: number | null
}

export interface MonthDebtRow {
  id: string
  nombre: string
  pendiente: number | null
  pagado: number | null
}

export interface IncomesBlock {
  filas: IncomeRow[]
  totalProyectado: number
  totalRecibido: number
}

export interface BillsBlock {
  filas: BillRow[]
  totalValor: number
  totalPagado: number
}

export interface MonthSavingsBlock {
  filas: MonthSavingRow[]
  totalMeta: number
  totalAhorrado: number
}

export interface MonthDebtsBlock {
  filas: MonthDebtRow[]
  totalPendiente: number
  totalPagado: number
}
