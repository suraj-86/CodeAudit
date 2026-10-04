import { ApiError, NetworkError } from '../api'
import { keyForError } from '../lib/error-key'
import { Alert } from './ui/Alert'
import { Button } from './ui/Button'
import { RetryCountdown } from './RetryCountdown'

interface ErrorNoticeProps {
  error: unknown
  onRetry?: () => void
}

export function ErrorNotice({ error, onRetry }: ErrorNoticeProps) {
  if (error instanceof ApiError && error.code === 'RATE_LIMITED') {
    return (
      <Alert tone="warning" title="Slow down a little">
        <RetryCountdown
          key={keyForError(error)}
          seconds={error.retryAfterSeconds}
          onReady={onRetry}
        />
      </Alert>
    )
  }

  if (error instanceof ApiError) {
    return (
      <Alert
        tone="error"
        title={error.message}
        actions={
          onRetry && (
            <Button variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          )
        }
      >
        {import.meta.env.DEV && <code className="font-mono text-[0.85rem]">{error.code}</code>}
      </Alert>
    )
  }

  if (error instanceof NetworkError) {
    return (
      <Alert
        tone="error"
        title="Couldn't reach the server"
        actions={
          onRetry && (
            <Button variant="secondary" onClick={onRetry}>
              Try again
            </Button>
          )
        }
      >
        Check that the CodeAudit backend is running and reachable.
      </Alert>
    )
  }

  return (
    <Alert
      tone="error"
      title="Something went wrong"
      actions={
        onRetry && (
          <Button variant="secondary" onClick={onRetry}>
            Try again
          </Button>
        )
      }
    >
      {error instanceof Error ? error.message : 'An unexpected error occurred.'}
    </Alert>
  )
}
