export type Role = 'ADMIN' | 'EDITOR'

export interface ApiResponse<T> {
  status: 'success'
  data: T
}

export interface ApiErrorResponse {
  status: 'error'
  message: string
  details?: unknown
}
