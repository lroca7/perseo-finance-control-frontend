// Estos tipos reflejan 1:1 los DTOs de Kotlin (backend/.../dto/*.kt).
// Si el contrato de la API cambia, este archivo debe actualizarse a la par
// (ver HU-T.11 y HU-T.15 sobre mantener paridad backend/frontend).

export type AmortizationType = 'CAPITAL_FIJO' | 'CUOTA_FIJA'
export type PaymentStrategy = 'REDUCIR_PLAZO' | 'REDUCIR_CUOTA'

export interface CardResponse {
  id: string
  banco: string
  alias: string
  cupoTotal: number
  tasaEA: number
  cargosFijosMensuales: number
  saldoTotalLineas: number
}

export interface CreateCardRequest {
  banco: string
  alias: string
  cupoTotal: number
  tasaEA: number
  cargosFijosMensuales: number
}

export interface EstimatedLinePayment {
  creditLineId: string
  nombre: string
  cuotaMes: number
}

export interface EstimatedMonthlyPaymentResponse {
  porLinea: EstimatedLinePayment[]
  cargosFijos: number
  total: number
}

export interface CreditLineResponse {
  id: string
  cardId: string
  nombre: string
  saldoPendiente: number
  cuotasRestantes: number
  tasaEA: number
  tipoAmortizacion: AmortizationType
  ignorada: boolean
  capitalFijoMensual: number
}

export interface CreateCreditLineRequest {
  nombre: string
  saldoPendiente: number
  cuotasRestantes: number
  tasaEA?: number | null
  tipoAmortizacion: AmortizationType
  ignorada: boolean
}

export interface CreateExtraPaymentRequest {
  numeroCuota: number
  monto: number
  estrategia: PaymentStrategy
}

export interface ExtraPaymentResponse {
  id: string
  numeroCuota: number
  monto: number
  estrategia: PaymentStrategy
}

export interface CreateStatementRequest {
  periodoInicio: string // 'YYYY-MM-DD'
  periodoFin: string
  saldoTotal: number
  pagoMinimo: number
  fechaLimitePago: string
  cuotaManejo: number
  otrosCargos: number
}

export interface StatementResponse {
  id: string
  cardId: string
  periodoInicio: string
  periodoFin: string
  saldoTotal: number
  pagoMinimo: number
  fechaLimitePago: string
  cuotaManejo: number
  otrosCargos: number
}

export interface ParsedCreditLineCandidate {
  nombre: string
  cuotaActual: number
  cuotasTotales: number
  valorTransaccionOriginal: number | null
  valorAPagarEstaCuota: number | null
  saldoPendiente: number | null
  tasaEA: number | null
}

export interface ParsedStatementResponse {
  periodoInicio: string | null
  periodoFin: string | null
  saldoTotal: number | null
  pagoMinimo: number | null
  fechaLimitePago: string | null
  cuotaManejo: number | null
  otrosCargos: number | null
  cupoTotal: number | null
  candidatosLineasCredito: ParsedCreditLineCandidate[]
  camposFaltantes: string[]
  textoDebug: string
}

export interface ScheduleRowResponse {
  numeroCuota: number
  interes: number
  capital: number
  cuotaTotal: number
  saldoFinal: number
  abonoExtra: number
}

export interface SimulationResponse {
  filas: ScheduleRowResponse[]
  meses: number
  totalInteres: number
  totalCapital: number
  totalPagado: number
  nuncaSePagaEnPlazo: boolean
}

export interface ComparisonResponse {
  sinAbonos: SimulationResponse
  conAbonos: SimulationResponse
  ahorroIntereses: number
  mesesAhorrados: number
}
