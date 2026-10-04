import { useEffect, useState } from 'react'

export function useFileText(file: File | null | undefined): string | null {
  const normalized = file ?? null
  const [state, setState] = useState<{ file: File | null; text: string | null }>({
    file: normalized,
    text: null,
  })

  if (state.file !== normalized) {
    setState({ file: normalized, text: null })
  }

  useEffect(() => {
    if (!normalized) return
    let cancelled = false
    void normalized.text().then((value) => {
      if (!cancelled) {
        setState((current) => (current.file === normalized ? { file: normalized, text: value } : current))
      }
    })
    return () => {
      cancelled = true
    }
  }, [normalized])

  return state.file === normalized ? state.text : null
}
