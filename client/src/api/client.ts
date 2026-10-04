import { ApiError, NetworkError, isAbortError } from './errors'

export function getApiBase(): string {
  const configured = import.meta.env.VITE_API_BASE_URL
  const base = configured && configured.trim() ? configured.trim() : '/api'
  return base.replace(/\/+$/, '')
}

interface ErrorEnvelope {
  error: { code: string; message: string; details?: unknown }
}

function isErrorEnvelope(value: unknown): value is ErrorEnvelope {
  if (typeof value !== 'object' || value === null) return false
  const error = (value as { error?: unknown }).error
  if (typeof error !== 'object' || error === null) return false
  const { code, message } = error as { code?: unknown; message?: unknown }
  return typeof code === 'string' && typeof message === 'string'
}

function retryAfterFrom(response: Response, details: unknown): number | undefined {
  if (typeof details === 'object' && details !== null) {
    const seconds = (details as { retryAfterSeconds?: unknown }).retryAfterSeconds
    if (typeof seconds === 'number' && seconds > 0) return seconds
  }
  const header = Number(response.headers.get('Retry-After'))
  return Number.isFinite(header) && header > 0 ? header : undefined
}

async function toApiError(response: Response): Promise<ApiError> {
  let body: unknown = null
  try {
    body = await response.json()
  } catch {
  }

  if (isErrorEnvelope(body)) {
    return new ApiError({
      status: response.status,
      code: body.error.code,
      message: body.error.message,
      details: body.error.details,
      retryAfterSeconds: retryAfterFrom(response, body.error.details),
    })
  }

  if (response.status === 429) {
    return new ApiError({
      status: 429,
      code: 'RATE_LIMITED',
      message: 'Too many requests. Wait a moment and try again.',
      retryAfterSeconds: retryAfterFrom(response, null),
    })
  }

  return new ApiError({
    status: response.status,
    code: 'UNEXPECTED_RESPONSE',
    message: `The server sent an unexpected response (status ${response.status}).`,
  })
}

async function send(path: string, init: RequestInit): Promise<Response> {
  let response: Response
  try {
    response = await fetch(`${getApiBase()}${path}`, init)
  } catch (error) {
    if (isAbortError(error)) throw error
    throw new NetworkError()
  }

  if (!response.ok) throw await toApiError(response)
  return response
}

export async function requestJson<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await send(path, init)
  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError({
      status: response.status,
      code: 'UNEXPECTED_RESPONSE',
      message: 'The server sent a response that could not be read.',
    })
  }
}

export async function requestBlob(path: string, init: RequestInit = {}): Promise<Blob> {
  const response = await send(path, init)
  return response.blob()
}
