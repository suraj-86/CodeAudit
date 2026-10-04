import { useCallback, useEffect, useState } from 'react'
import { getHealth } from '../api'

export type ServerStatus = 'checking' | 'online' | 'offline'

export function useServerStatus() {
  const [status, setStatus] = useState<ServerStatus>('checking')
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    getHealth(controller.signal)
      .then(() => setStatus('online'))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setStatus(error instanceof Error ? 'offline' : 'offline')
        }
      })
    return () => controller.abort()
  }, [attempt])

  const recheck = useCallback(() => {
    setStatus('checking')
    setAttempt((n) => n + 1)
  }, [])

  return { status, recheck }
}
