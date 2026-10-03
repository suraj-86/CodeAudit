import { useEffect, useState } from 'react'

/** Reads a File's text content. Returns null while unset or still loading. */
export function useFileText(file: File | null | undefined): string | null {
  const normalized = file ?? null
  const [state, setState] = useState<{ file: File | null; text: string | null }>({
    file: normalized,
    text: null,
  })

  // Reset synchronously during render when the file identity changes, rather
  // than inside an effect — this is the file currently being read, not a
  // side effect of reading it.
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
