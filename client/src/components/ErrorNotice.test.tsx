import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ErrorNotice } from './ErrorNotice'
import { ApiError, NetworkError } from '../api'

describe('ErrorNotice', () => {
  it('shows a plain-language message for an ApiError', () => {
    render(<ErrorNotice error={new ApiError({ status: 400, code: 'SOURCE_REQUIRED', message: 'Source code is required.' })} />)
    expect(screen.getByRole('alert')).toHaveTextContent('Source code is required.')
  })

  it('shows a countdown for a rate-limited error and calls onRetry when it reaches zero', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const onRetry = vi.fn()
    render(
      <ErrorNotice
        error={new ApiError({ status: 429, code: 'RATE_LIMITED', message: 'Too many requests.', retryAfterSeconds: 2 })}
        onRetry={onRetry}
      />,
    )
    expect(screen.getByText(/Try again in/)).toBeInTheDocument()
    await act(async () => {
      await vi.advanceTimersByTimeAsync(2100)
    })
    expect(onRetry).toHaveBeenCalledOnce()
    vi.useRealTimers()
  })

  it("tells the person to check the server for a NetworkError", () => {
    render(<ErrorNotice error={new NetworkError()} />)
    expect(screen.getByText(/Couldn't reach the server/)).toBeInTheDocument()
  })

  it('shows a retry button only when onRetry is given', async () => {
    const onRetry = vi.fn()
    const { rerender } = render(<ErrorNotice error={new Error('boom')} />)
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument()

    rerender(<ErrorNotice error={new Error('boom')} onRetry={onRetry} />)
    await userEvent.click(screen.getByRole('button', { name: /try again/i }))
    expect(onRetry).toHaveBeenCalledOnce()
  })
})
