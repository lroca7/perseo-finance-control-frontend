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

/** Une los errores del backend en un texto; si no trae campo (error de negocio) muestra solo el mensaje. */
function buildMessage(body: ApiErrorResponse | null, fallback: string): string {
  const parts = body?.errors?.map((e) => (e.field ? `${e.field}: ${e.message}` : e.message))
  return parts && parts.length > 0 ? parts.join(', ') : fallback
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
    throw new ApiError(buildMessage(body, `Error ${res.status} al llamar ${path}`), res.status, body?.errors ?? [])
  }

  // 204 No Content no trae body
  if (res.status === 204) return undefined as T

  return res.json() as Promise<T>
}

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),
  post: <T>(path: string, body: unknown) => request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  put: <T>(path: string, body: unknown) => request<T>(path, { method: 'PUT', body: JSON.stringify(body) }),
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
      throw new ApiError(buildMessage(body, `Error ${res.status} al subir el archivo`), res.status, body?.errors ?? [])
    }
    return res.json() as Promise<T>
  }
}
