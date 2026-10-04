/** Formato simple de pesos, usado por el módulo de tarjetas: 1234567 -> "$1.234.567". */
export const fmt = (n: number): string =>
  '$' + Math.round(n).toLocaleString('es-CO')

const cop = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 })
const pctFormat = new Intl.NumberFormat('es-CO', { style: 'percent', maximumFractionDigits: 2 })
const compactFormat = new Intl.NumberFormat('es-CO', { notation: 'compact', maximumFractionDigits: 1 })

export const money = (n: number): string => cop.format(Math.round(n))
export const compact = (n: number): string => compactFormat.format(n)

/** Fracción -> "28 %" (0.28 => 28 %). */
export const pct = (fraction: number): string => pctFormat.format(fraction)

/** Porcentaje escrito por el usuario (11) -> fracción para la API (0.11). */
export const toFraction = (percent: number): number => Math.round((percent / 100) * 1e6) / 1e6

/** Fracción de la API (0.11) -> texto de un input de porcentaje ("11"). */
export const fromFraction = (fraction: number): string => String(Number((fraction * 100).toFixed(4)))

const pad = (n: number): string => String(n).padStart(2, '0')

export const isoDate = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const todayISO = (): string => isoDate(new Date())
export const tomorrowISO = (): string => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return isoDate(d)
}
export const firstOfMonthISO = (): string => {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-01`
}

const parse = (iso: string): Date => new Date(`${iso}T00:00:00`)
export const monthLabel = (iso: string): string =>
  parse(iso).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' })
export const dateLabel = (iso: string): string =>
  parse(iso).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })

/** Texto de un input numérico -> número, o null si está vacío o no es válido. */
export const parseNumber = (text: string): number | null => {
  if (text.trim() === '') return null
  const n = Number(text)
  return Number.isFinite(n) ? n : null
}
