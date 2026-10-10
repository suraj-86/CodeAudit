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
export const MAX_ZIP_FILES = 300

export interface ZipExtractionResult {
  files: File[]

  matchedEntries: number
  totalEntries: number
  truncated: boolean
}
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
