import { ApiError } from './client'

/** Texto de error listo para mostrar al usuario. */
export function errorMessage(e: unknown, fallback: string): string {
  return e instanceof ApiError ? e.message : fallback
}
