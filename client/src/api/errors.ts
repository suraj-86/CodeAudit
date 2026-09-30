/**
 * The server answered, but with an error. `code` is the backend's stable
 * machine-readable code (see docs/api-specification.md §12); `message` is
 * safe to show to a person.
 */
export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly details: unknown
  /** Present on RATE_LIMITED responses. */
  readonly retryAfterSeconds: number | undefined

  constructor(init: {
    status: number
    code: string
    message: string
    details?: unknown
    retryAfterSeconds?: number | undefined
  }) {
    super(init.message)
    this.name = 'ApiError'
    this.status = init.status
    this.code = init.code
    this.details = init.details ?? null
    this.retryAfterSeconds = init.retryAfterSeconds
  }
}

/** The request never got an answer (server down, offline, blocked). */
export class NetworkError extends Error {
  constructor(message = 'Could not reach the CodeAudit server.') {
    super(message)
    this.name = 'NetworkError'
  }
}

export function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError'
}
