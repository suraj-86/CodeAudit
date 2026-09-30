import { useEffect } from 'react'
import { useCountdown } from '../hooks/useCountdown'

interface RetryCountdownProps {
  seconds: number | undefined
  onReady?: () => void
}

export function RetryCountdown({ seconds, onReady }: RetryCountdownProps) {
  const remaining = useCountdown(seconds)

  useEffect(() => {
    if (seconds && remaining === 0) onReady?.()
  }, [remaining, seconds, onReady])

  if (!seconds) return <>You've hit the request limit. Wait a moment and try again.</>

  return (
    <>
      You've hit the request limit.{' '}
      {remaining > 0 ? (
        <>
          Try again in{' '}
          <span className="font-mono font-semibold tabular-nums">
            {remaining}s
          </span>
          .
        </>
      ) : (
        'You can try again now.'
      )}
    </>
  )
}
