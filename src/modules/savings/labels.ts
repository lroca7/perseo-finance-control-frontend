import type { GoalTrackingStatus, ProductType } from './api/types'

export const GOAL_ICONS: { key: string; emoji: string; label: string }[] = [
  { key: 'piggy-bank', emoji: '🐷', label: 'Ahorro' },
  { key: 'plane', emoji: '✈️', label: 'Viaje' },
  { key: 'shield', emoji: '🛡️', label: 'Fondo de emergencia' },
  { key: 'beach', emoji: '🏖️', label: 'Pensión / retiro' },
  { key: 'home', emoji: '🏠', label: 'Vivienda' },
  { key: 'car', emoji: '🚗', label: 'Vehículo' },
  { key: 'graduation', emoji: '🎓', label: 'Estudio' },
  { key: 'gift', emoji: '🎁', label: 'Regalo / evento' }
]

export const iconEmoji = (key: string): string => GOAL_ICONS.find((i) => i.key === key)?.emoji ?? '🐷'

export const STATUS_LABEL: Record<GoalTrackingStatus, string> = {
  EN_CAMINO: 'En camino',
  ATRASADA: 'Atrasada',
  ALCANZADA: 'Alcanzada',
  SIN_PLAN: 'Sin plan'
}

/** Sufijo de clase CSS (sv-ok, sv-late, sv-done, sv-none). */
export const STATUS_CLASS: Record<GoalTrackingStatus, string> = {
  EN_CAMINO: 'ok',
  ATRASADA: 'late',
  ALCANZADA: 'done',
  SIN_PLAN: 'none'
}

export const PRODUCT_LABEL: Record<ProductType, string> = {
  CUENTA_AHORROS: 'Cuenta de ahorros',
  CDT: 'CDT',
  FIC: 'FIC',
  FPV_AFC: 'FPV / AFC',
  MANUAL: 'Manual'
}
