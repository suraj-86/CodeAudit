import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { ApiError, NetworkError, getLanguages } from '../api'
import { LanguagesContext, type LanguagesState } from '../hooks/languages-context'
import { ScanningLoader } from './ScanningLoader'
import { ErrorNotice } from './ErrorNotice'

// A free-tier host (e.g. Render) spins the backend down after idling and
// takes roughly 30-60s to wake it back up on the next request. During that
// window the request either hangs until the instance is ready (fine — the
// loading state just covers it) or the host's own edge proxy returns a
// transient 502/503/504 before the app has bound its port (not fine on its
// own — it would otherwise surface as a cold "couldn't reach the server"
// error on literally every first visit). This retries through that window
// automatically rather than making the person click "try again" themselves.
const COLD_START_RETRY_DELAYS_MS = [2000, 3000, 4000, 5000, 6000, 8000, 8000, 8000, 8000, 8000]

function isLikelyColdStart(error: unknown): boolean {
  if (error instanceof NetworkError) return true
  if (error instanceof ApiError) {
    return (
      error.status === 502 ||
      error.status === 503 ||
      error.status === 504 ||
      error.code === 'UNEXPECTED_RESPONSE'
    )
  }
  return false
}

export function LanguagesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LanguagesState>({ status: 'loading' })
  const [waking, setWaking] = useState(false)
  const [attempt, setAttempt] = useState(0)

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setWaking(false)
    setAttempt((n) => n + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    let cancelled = false
    let retryIndex = 0
    let timer: ReturnType<typeof setTimeout> | undefined

    const attemptLoad = () => {
      getLanguages(controller.signal)
        .then((data) => {
          if (!cancelled) setState({ status: 'ready', data })
        })
        .catch((error: unknown) => {
          if (cancelled || controller.signal.aborted) return

          if (isLikelyColdStart(error) && retryIndex < COLD_START_RETRY_DELAYS_MS.length) {
            setWaking(true)
            const delay = COLD_START_RETRY_DELAYS_MS[retryIndex]
            retryIndex += 1
            timer = setTimeout(attemptLoad, delay)
            return
          }

          setState({ status: 'error', error })
        })
    }

    attemptLoad()
    return () => {
      cancelled = true
      controller.abort()
      if (timer) clearTimeout(timer)
    }
  }, [attempt])

  if (state.status === 'loading') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ScanningLoader
          label={
            waking
              ? 'Waking up the server — this can take up to a minute on the free tier'
              : 'Loading CodeAudit…'
          }
        />
      </div>
    )
  }

  if (state.status === 'error') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ErrorNotice error={state.error} onRetry={reload} />
      </div>
    )
  }

  return (
    <LanguagesContext.Provider value={{ state, reload }}>{children}</LanguagesContext.Provider>
  )
}
