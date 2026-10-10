import JSZip from 'jszip'

export function extensionOf(path: string): string {
  const dot = path.lastIndexOf('.')
  return dot > 0 ? path.slice(dot).toLowerCase() : ''
}

function isIgnorablePath(path: string): boolean {
  const base = path.split('/').pop() ?? path
  if (base.startsWith('.')) return true
  if (path.includes('__MACOSX/')) return true
  if (path.includes('/node_modules/') || path.startsWith('node_modules/')) return true
  if (path.includes('/.git/') || path.startsWith('.git/')) return true
  return false
}

/** Safety cap on how many matching files one zip upload will queue for AI
 *  analysis. The AI endpoint allows 10 requests/minute (server-side rate
 *  limit), so even 300 files already means ~30 minutes of analysis; this
 *  keeps a genuinely huge repo zip (thousands of files) from queuing more
 *  than that without the person asking for it explicitly. */
export const MAX_ZIP_FILES = 300

export interface ZipExtractionResult {
  /** Extracted files, capped at MAX_ZIP_FILES. */
  files: File[]
  /** Non-ignored entries in the archive that matched the filter. */
  matchedEntries: number
  /** Non-ignored entries in the archive, matched or not. */
  totalEntries: number
  /** True if matchedEntries exceeded MAX_ZIP_FILES and some were dropped. */
  truncated: boolean
}

/**
 * Extracts files from a zip archive whose path matches `matches`, skipping
 * directories, hidden files, __MACOSX junk, node_modules and .git. Each
 * extracted entry becomes a browser File named after its path inside the
 * archive (so submissions from different folders don't collide).
 */
export async function extractFilesFromZip(
  zipFile: File,
  matches: (path: string) => boolean,
): Promise<ZipExtractionResult> {
  const zip = await JSZip.loadAsync(zipFile)
  const files: File[] = []
  let totalEntries = 0
  let matchedEntries = 0

  const entries = Object.values(zip.files)
  for (const entry of entries) {
    if (entry.dir) continue
    const path = entry.name
    if (isIgnorablePath(path)) continue
    totalEntries += 1
    if (!matches(path)) continue
    matchedEntries += 1
    if (files.length >= MAX_ZIP_FILES) continue

    const blob = await entry.async('blob')
    // Keep the path (folder names and all) in the filename so two students'
    // same-named files (e.g. two "main.py") don't collide once flattened.
    const name = path.replace(/\//g, '__')
    files.push(new File([blob], name, { type: 'text/plain' }))
  }

  return {
    files,
    matchedEntries,
    totalEntries,
    truncated: matchedEntries > files.length,
  }
}
