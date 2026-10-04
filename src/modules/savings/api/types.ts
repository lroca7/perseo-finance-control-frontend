// Tipos espejo de los DTO del módulo de ahorro (backend: com.perseo.finance.savings.dto).
// Tasas y porcentajes viajan como FRACCIÓN: 0.11 = 11 %.

export type ProductType = 'CUENTA_AHORROS' | 'CDT' | 'FIC' | 'FPV_AFC' | 'MANUAL'
export type ContributionTiming = 'INICIO' | 'FIN'
export type WithholdingMode = 'MENSUAL' | 'AL_VENCIMIENTO'
export type GoalStatus = 'ACTIVA' | 'ALCANZADA' | 'ARCHIVADA'
export type GoalTrackingStatus = 'EN_CAMINO' | 'ATRASADA' | 'ALCANZADA' | 'SIN_PLAN'
export type MovementType = 'APORTE' | 'RETIRO'
export type MonthStatus = 'CERRADO' | 'EN_CURSO'
export type RateOrigin = 'VIGENTE' | 'ULTIMA_CONOCIDA' | 'PERSONALIZADO'

// ---------- Metas ----------

export interface GoalResponse {
  id: string
  nombre: string
  icono: string
  montoObjetivo: number
  saldoInicial: number
  fechaObjetivo: string | null
  estado: GoalStatus
  planReferenciaId: string | null
  cantidadPlanes: number
  saldoRealEstimado: number
  avanceMeta: number
  estadoSeguimiento: GoalTrackingStatus
  mesesParaMeta: number | null
  aporteNecesario: number | null
  ritmoActual: number | null
  createdAt: string
}

export interface GoalRequest {
  nombre: string
  icono: string
  montoObjetivo: number
  saldoInicial: number
  fechaObjetivo: string | null
  /** Solo en actualización: ACTIVA o ARCHIVADA. */
  estado?: GoalStatus
}

// ---------- Planes ----------

export interface PlanRequest {
  nombre: string
  tipoProducto: ProductType
  tasaEA: number
  comisionEA: number
  aporteMensual: number
  momentoAporte: ContributionTiming
  crecimientoAporteAnual: number
  plazoMeses: number
  fechaInicio: string | null
  inflacionAnual: number
  tratamientoRetencion: WithholdingMode | null
  retencionTarifa: number | null
}

export interface PlanResponse {
  id: string
  goalId: string
  nombre: string
  tipoProducto: ProductType
  tasaEA: number
  comisionEA: number
  aporteMensual: number
  momentoAporte: ContributionTiming
  crecimientoAporteAnual: number
  plazoMeses: number
  fechaInicio: string
  inflacionAnual: number
  tratamientoRetencion: WithholdingMode
  retencionTarifa: number | null
  esReferencia: boolean
  createdAt: string
}

// ---------- Simulación ----------

export interface PreviewRequest {
  saldoInicial: number
  montoObjetivo: number | null
  tipoProducto: ProductType
  tasaEA: number
  comisionEA: number
  aporteMensual: number
  momentoAporte: ContributionTiming
  crecimientoAporteAnual: number
  plazoMeses: number
  fechaInicio: string | null
  inflacionAnual: number
  tratamientoRetencion: WithholdingMode | null
  retencionTarifa: number | null
}

export interface SimulationMonth {
  mes: number
  fecha: string
  saldoInicial: number
  aporte: number
  rendimientoBruto: number
  comision: number
  impuesto: number
  saldoFinal: number
  impuestoPendiente: number
  saldoNeto: number
  metaAlcanzada: boolean
}

export interface SimulationSummary {
  totalAportado: number
  rendimientoBruto: number
  comisiones: number
  impuestos: number
  saldoNetoFinal: number
  valorRealSaldoNeto: number
  avanceMeta: number | null
  mesMetaAlcanzada: number | null
}

export interface TaxParameterUsed {
  tarifa: number
  vigenteDesde: string | null
  vigenteHasta: string | null
  origen: RateOrigin
}

export interface SimulationResponse {
  meses: SimulationMonth[]
  resumen: SimulationSummary
  parametrosTributarios: TaxParameterUsed[]
  advertencias: string[]
  aviso: string
}

// ---------- Movimientos y conciliaciones ----------

export interface MovementRequest {
  fecha: string
  monto: number
  tipo: MovementType
  nota?: string
  confirmarExceso?: boolean
}

export interface MovementResponse {
  id: string
  goalId: string
  fecha: string
  monto: number
  tipo: MovementType
  nota: string | null
  createdAt: string
}

export interface BalanceCheckRequest {
  fecha: string
  saldoReal: number
  nota?: string
}

export interface BalanceCheckResponse {
  id: string
  goalId: string
  fecha: string
  saldoReal: number
  nota: string | null
  createdAt: string
}

// ---------- Seguimiento ----------

export interface TrackingMonth {
  mes: number
  fecha: string
  estado: MonthStatus
  aportePlaneado: number
  aporteReal: number | null
  diferencia: number | null
  saldoPlaneado: number
  saldoReal: number | null
  conciliado: boolean
}

export interface ProgressResponse {
  goalId: string
  planReferenciaId: string | null
  estado: GoalTrackingStatus
  montoObjetivo: number
  saldoRealEstimado: number
  saldoRealNeto: number | null
  avanceMeta: number
  mesActual: number | null
  mesEvaluado: number | null
  saldoPlaneado: number | null
  diferencia: number | null
  ritmoActual: number | null
  mesMetaPlan: number | null
  mesMetaProyectado: number | null
  fechaMetaProyectada: string | null
  mesesDeRetraso: number | null
  mesesParaMeta: number | null
  aporteNecesario: number | null
  mesesParaAporteNecesario: number | null
  meses: TrackingMonth[]
  advertencias: string[]
  aviso: string
}

// ---------- Catálogo ----------

export interface ProductInfo {
  tipo: ProductType
  nombre: string
  tratamientoRetencion: WithholdingMode
  permiteComision: boolean
  retencionVigente: number | null
}
