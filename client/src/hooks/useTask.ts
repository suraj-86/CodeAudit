import { useCallback, useEffect, useRef, useState } from 'react'
import { isAbortError } from '../api'

export type TaskState<T> =
  | { status: 'idle' }
  | { status: 'loading'; startedAt: number }
  | { status: 'success'; data: T }
  | { status: 'error'; error: unknown }

/**
 * Runs one cancellable async request at a time and exposes its state as
 * idle → loading → success | error. A newer run (or cancel/reset) makes
 * any older, still-pending run's result be ignored.
 */
export function useTask<T>() {
  const [state, setState] = useState<TaskState<T>>({ status: 'idle' })
  const controller = useRef<AbortController | null>(null)

  const cancel = useCallback(() => {
    controller.current?.abort()
    controller.current = null
    setState({ status: 'idle' })
  }, [])

  const run = useCallback(async (work: (signal: AbortSignal) => Promise<T>) => {
    controller.current?.abort()
    const mine = new AbortController()
    controller.current = mine
    setState({ status: 'loading', startedAt: Date.now() })

    try {
      const data = await work(mine.signal)
      if (controller.current === mine) {
        controller.current = null
        setState({ status: 'success', data })
      }
    } catch (error) {
      if (controller.current !== mine || isAbortError(error)) return
      controller.current = null
      setState({ status: 'error', error })
    }
  }, [])

  const reset = cancel

  useEffect(() => () => controller.current?.abort(), [])

  return { state, run, cancel, reset }
}
