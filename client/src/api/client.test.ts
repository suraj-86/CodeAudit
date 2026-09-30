import { afterEach, describe, expect, it, vi } from 'vitest'
import { requestJson } from './client'
import { ApiError, NetworkError } from './errors'

function jsonResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...headers } })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('requestJson', () => {
  it('returns parsed JSON on success', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(200, { status: 'ok' })))
    const result = await requestJson<{ status: string }>('/health')
    expect(result.status).toBe('ok')
  })

  it('turns the structured error envelope into an ApiError', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(400, { error: { code: 'LANGUAGE_REQUIRED', message: 'Language is required.' } }),
      ),
    )
    await expect(requestJson('/analyze/ai', { method: 'POST' })).rejects.toMatchObject({
      name: 'ApiError',
      code: 'LANGUAGE_REQUIRED',
      status: 400,
    })
  })

  it('reads a RATE_LIMITED retry hint from the response body', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        jsonResponse(429, {
          error: { code: 'RATE_LIMITED', message: 'Too many requests.', details: { retryAfterSeconds: 7 } },
        }),
      ),
    )
    try {
      await requestJson('/analyze/ai', { method: 'POST' })
      expect.unreachable()
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError)
      expect((error as ApiError).retryAfterSeconds).toBe(7)
    }
  })

  it('falls back to a generic ApiError when the body is not the envelope shape', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>502</html>', { status: 502 })))
    await expect(requestJson('/health')).rejects.toMatchObject({
      name: 'ApiError',
      code: 'UNEXPECTED_RESPONSE',
      status: 502,
    })
  })

  it('wraps a network failure as NetworkError, not ApiError', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    await expect(requestJson('/health')).rejects.toBeInstanceOf(NetworkError)
  })

  it('lets an AbortError propagate unwrapped', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('aborted', 'AbortError')))
    await expect(requestJson('/health')).rejects.toMatchObject({ name: 'AbortError' })
  })
})
