import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { getLanguages } from '../api'
import { LanguagesContext, type LanguagesState } from '../hooks/languages-context'
import { ScanningLoader } from './ScanningLoader'
import { ErrorNotice } from './ErrorNotice'

export function LanguagesProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LanguagesState>({ status: 'loading' })
  const [attempt, setAttempt] = useState(0)

  const reload = useCallback(() => {
    setState({ status: 'loading' })
    setAttempt((n) => n + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    getLanguages(controller.signal)
      .then((data) => setState({ status: 'ready', data }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setState({ status: 'error', error })
      })
    return () => controller.abort()
  }, [attempt])

  if (state.status === 'loading') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <ScanningLoader label="Loading CodeAudit…" />
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
