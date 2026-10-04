/** Forma de los errores que devuelve el backend (validaciones y errores de negocio). */
export interface ApiFieldError {
  field: string
  message: string
}

export interface ApiErrorResponse {
  errors: ApiFieldError[]
}
