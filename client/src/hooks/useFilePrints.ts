import { useEffect, useState } from 'react'
import { sha256OfFile } from '../lib/sha256'
export function useFilePrints(files: File[]): Map<File, string> {
  const [prints, setPrints] = useState<Map<File, string>>(new Map())

  useEffect(() => {
    let cancelled = false
    const missing = files.filter((file) => !prints.has(file))
    if (missing.length === 0) return

    void Promise.all(
      missing.map(async (file) => [file, await sha256OfFile(file)] as const),
    ).then((entries) => {
      if (cancelled) return
      setPrints((current) => {
        const next = new Map(current)
        for (const [file, hash] of entries) next.set(file, hash)
        return next
      })
    })

    return () => {
      cancelled = true
    }
  }, [files, prints])

  return prints
}
