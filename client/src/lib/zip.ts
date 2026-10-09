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

/**
 * Extracts files from a zip archive whose path matches `matches`, skipping
 * directories, hidden files, __MACOSX junk, node_modules and .git. Each
 * extracted entry becomes a browser File named after its path inside the
 * archive (so submissions from different folders don't collide).
 */
export async function extractFilesFromZip(
  zipFile: File,
  matches: (path: string) => boolean,
): Promise<File[]> {
  const zip = await JSZip.loadAsync(zipFile)
  const out: File[] = []

  const entries = Object.values(zip.files)
  for (const entry of entries) {
    if (entry.dir) continue
    const path = entry.name
    if (isIgnorablePath(path)) continue
    if (!matches(path)) continue

    const blob = await entry.async('blob')
    // Keep the path (folder names and all) in the filename so two students'
    // same-named files (e.g. two "main.py") don't collide once flattened.
    const name = path.replace(/\//g, '__')
    out.push(new File([blob], name, { type: 'text/plain' }))
  }

  return out
}
