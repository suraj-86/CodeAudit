import { useEffect, useState } from 'react'
import { sha256OfText } from '../lib/sha256'

/** SHA-256 of a string, or null while it is being computed. */
export function useTextPrint(text: string): string | null {
  const [state, setState] = useState<{ text: string; hash: string } | null>(null)

  useEffect(() => {
    let cancelled = false
    void sha256OfText(text).then((hash) => {
      if (!cancelled) setState({ text, hash })
    })
    return () => {
      cancelled = true
    }
  }, [text])

  return state && state.text === text ? state.hash : null
}
