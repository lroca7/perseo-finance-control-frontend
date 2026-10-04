import { api } from '../../../shared/api/client'
import type {
  BalanceCheckRequest,
  BalanceCheckResponse,
  GoalRequest,
  GoalResponse,
  MovementRequest,
  MovementResponse,
  PlanRequest,
  PlanResponse,
  PreviewRequest,
  ProductInfo,
  ProgressResponse,
  SimulationResponse
} from './types'

export const savingsApi = {
  goals: {
    list: (userId: string, incluirArchivadas = false) =>
      api.get<GoalResponse[]>(`/goals?userId=${userId}&incluirArchivadas=${incluirArchivadas}`),
    get: (id: string) => api.get<GoalResponse>(`/goals/${id}`),
    create: (userId: string, body: GoalRequest) => api.post<GoalResponse>(`/goals?userId=${userId}`, body),
    update: (id: string, body: GoalRequest) => api.put<GoalResponse>(`/goals/${id}`, body),
    remove: (id: string) => api.delete<void>(`/goals/${id}`)
  },
  plans: {
    list: (goalId: string) => api.get<PlanResponse[]>(`/goals/${goalId}/plans`),
    get: (id: string) => api.get<PlanResponse>(`/plans/${id}`),
    create: (goalId: string, body: PlanRequest) => api.post<PlanResponse>(`/goals/${goalId}/plans`, body),
    update: (id: string, body: PlanRequest) => api.put<PlanResponse>(`/plans/${id}`, body),
    remove: (id: string, nuevaReferenciaId?: string) =>
      api.delete<void>(`/plans/${id}${nuevaReferenciaId ? `?nuevaReferenciaId=${nuevaReferenciaId}` : ''}`),
    setReference: (id: string) => api.post<PlanResponse>(`/plans/${id}/set-reference`, {}),
    duplicate: (id: string) => api.post<PlanResponse>(`/plans/${id}/duplicate`, {}),
    simulation: (id: string) => api.get<SimulationResponse>(`/plans/${id}/simulation`)
  },
  simulation: {
    preview: (body: PreviewRequest) => api.post<SimulationResponse>('/simulations/preview', body)
  },
  movements: {
    list: (goalId: string) => api.get<MovementResponse[]>(`/goals/${goalId}/contributions`),
    create: (goalId: string, body: MovementRequest) =>
      api.post<MovementResponse>(`/goals/${goalId}/contributions`, body),
    update: (id: string, body: MovementRequest) => api.put<MovementResponse>(`/contributions/${id}`, body),
    remove: (id: string) => api.delete<void>(`/contributions/${id}`)
  },
  balanceChecks: {
    list: (goalId: string) => api.get<BalanceCheckResponse[]>(`/goals/${goalId}/balance-checks`),
    create: (goalId: string, body: BalanceCheckRequest) =>
      api.post<BalanceCheckResponse>(`/goals/${goalId}/balance-checks`, body),
    update: (id: string, body: BalanceCheckRequest) =>
      api.put<BalanceCheckResponse>(`/balance-checks/${id}`, body),
    remove: (id: string) => api.delete<void>(`/balance-checks/${id}`)
  },
  progress: {
    get: (goalId: string, ritmo?: number) =>
      api.get<ProgressResponse>(`/goals/${goalId}/progress${ritmo != null ? `?ritmo=${ritmo}` : ''}`)
  },
  catalog: {
    products: () => api.get<ProductInfo[]>('/savings/products')
  }
}
