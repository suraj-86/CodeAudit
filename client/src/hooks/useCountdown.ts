import { useEffect, useState } from 'react'

/**
 * Counts down from `seconds` to 0, once per second, starting from
 * whatever `seconds` was on the first render. The caller is expected to
 * remount this hook's component (e.g. via a `key` tied to the specific
 * error instance) whenever a fresh countdown should start — see
 * `ErrorNotice`'s use of `keyForError`.
 */
export function useCountdown(seconds: number | undefined): number {
  const [remaining, setRemaining] = useState(seconds ?? 0)

  useEffect(() => {
    if (!seconds) return
    const id = window.setInterval(() => {
      setRemaining((n) => (n <= 1 ? 0 : n - 1))
    }, 1000)
    return () => window.clearInterval(id)
  }, [seconds])

  return remaining
}
