import type { ApiErrorResponse } from './types'

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fieldErrors: ApiErrorResponse['errors'] = []
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  if (!res.ok) {
    let body: ApiErrorResponse | null = null
    try {
      body = await res.json()
    } catch {
      // el backend no siempre devuelve JSON (ej. 404 genérico de Spring)
    }
    const message = body?.errors?.map((e) => `${e.field}: ${e.message}`).join(', ')
      ?? `Error ${res.status} al llamar ${path}`
    throw new ApiError(message, res.status, body?.errors ?? [])
  }

  // 204 No Content no trae body
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  /** Para multipart/form-data (ej. subir un PDF). No forzar Content-Type: el
   * navegador debe poner el boundary correcto solo. */
  postForm: async <T>(path: string, form: FormData): Promise<T> => {
    const res = await fetch(`/api${path}`, { method: 'POST', body: form })
    if (!res.ok) {
      let body: ApiErrorResponse | null = null
      try {
        body = await res.json()
      } catch {
        // sin body JSON
      }
      const message = body?.errors?.map((e) => `${e.field}: ${e.message}`).join(', ')
        ?? `Error ${res.status} al subir el archivo`
      throw new ApiError(message, res.status, body?.errors ?? [])
    }
    return res.json() as Promise<T>
  }
}
