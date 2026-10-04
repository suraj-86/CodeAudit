import { useEffect, useState } from 'react'

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
