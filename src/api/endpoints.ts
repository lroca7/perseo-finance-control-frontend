import { api } from './client'
import type {
  CardResponse,
  CreateCardRequest,
  CreditLineResponse,
  CreateCreditLineRequest,
  CreateExtraPaymentRequest,
  ExtraPaymentResponse,
  ComparisonResponse,
  CreateStatementRequest,
  StatementResponse,
  ParsedStatementResponse,
  EstimatedMonthlyPaymentResponse
} from './types'

// NOTA: mientras no exista login (HU-T.8 pendiente), se usa un userId fijo
// de desarrollo. Cuando se agregue auth, esto se reemplaza por el usuario
// resuelto del token y deja de viajar como query param.
export const DEV_USER_ID = '00000000-0000-0000-0000-000000000001'

export const cardsApi = {
  listar: () => api.get<CardResponse[]>(`/cards?userId=${DEV_USER_ID}`),
  obtener: (cardId: string) => api.get<CardResponse>(`/cards/${cardId}`),
  crear: (body: CreateCardRequest) =>
    api.post<CardResponse>(`/cards?userId=${DEV_USER_ID}`, body),
  actualizar: (cardId: string, body: CreateCardRequest) =>
    api.put<CardResponse>(`/cards/${cardId}`, body),
  eliminar: (cardId: string) => api.delete<void>(`/cards/${cardId}`),
  estimarMes: (cardId: string) =>
    api.get<EstimatedMonthlyPaymentResponse>(`/cards/${cardId}/pago-estimado-mes`)
}

export const creditLinesApi = {
  listarPorTarjeta: (cardId: string) =>
    api.get<CreditLineResponse[]>(`/cards/${cardId}/lines`),
  obtener: (lineId: string) => api.get<CreditLineResponse>(`/lines/${lineId}`),
  crear: (cardId: string, body: CreateCreditLineRequest) =>
    api.post<CreditLineResponse>(`/cards/${cardId}/lines`, body),
  actualizar: (lineId: string, body: CreateCreditLineRequest) =>
    api.put<CreditLineResponse>(`/lines/${lineId}`, body),
  eliminar: (lineId: string) => api.delete<void>(`/lines/${lineId}`)
}

export const simulationApi = {
  comparar: (lineId: string) =>
    api.get<ComparisonResponse>(`/lines/${lineId}/simulation`),
  listarAbonos: (lineId: string) =>
    api.get<ExtraPaymentResponse[]>(`/lines/${lineId}/extra-payments`),
  agregarAbono: (lineId: string, body: CreateExtraPaymentRequest) =>
    api.post<CreditLineResponse>(`/lines/${lineId}/extra-payments`, body),
  eliminarAbono: (lineId: string, extraPaymentId: string) =>
    api.delete<void>(`/lines/${lineId}/extra-payments/${extraPaymentId}`)
}

export const statementsApi = {
  listarPorTarjeta: (cardId: string) =>
    api.get<StatementResponse[]>(`/cards/${cardId}/statements`),
  crear: (cardId: string, body: CreateStatementRequest) =>
    api.post<StatementResponse>(`/cards/${cardId}/statements`, body),
  eliminar: (statementId: string) => api.delete<void>(`/statements/${statementId}`),
  /** HU-2.2: sube el PDF y devuelve una preview (no guarda nada todavía). */
  parsearPdf: (cardId: string, file: File, banco: 'DAVIVIENDA' | 'BANCOLOMBIA') => {
    const form = new FormData()
    form.append('file', file)
    return api.postForm<ParsedStatementResponse>(
      `/cards/${cardId}/statements/parse-pdf?banco=${banco}`,
      form
    )
  }
}
