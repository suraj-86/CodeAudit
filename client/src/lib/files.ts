import type { LanguageInfo, UploadLimits } from '../api'
import { formatBytes } from './format'

export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf('.')
  return dot > 0 ? filename.slice(dot).toLowerCase() : ''
}

export function fileProblem(
  file: File,
  language: LanguageInfo,
  limits: UploadLimits,
): string | null {
  if (!language.extensions.includes(extensionOf(file.name))) {
    return `${language.label} files end in ${language.extensions.join(', ')}. This one is ${
      extensionOf(file.name) || 'missing an extension'
    }.`
  }
  if (file.size === 0) return 'This file is empty.'
  if (file.size > limits.maxFileSizeBytes) {
    return `This file is ${formatBytes(file.size)}; the limit is ${formatBytes(limits.maxFileSizeBytes)}.`
  }
  return null
}

export function fileFromCode(code: string, language: LanguageInfo, stem = 'pasted'): File {
  const extension = language.extensions[0] ?? '.txt'
  return new File([code], `${stem}${extension}`, { type: 'text/plain' })
}

export function sameFile(a: File, b: File): boolean {
  return a.name === b.name && a.size === b.size && a.lastModified === b.lastModified
}

export function duplicateGroups(files: File[], prints: Map<File, string>): File[][] {
  const byHash = new Map<string, File[]>()
  for (const file of files) {
    const hash = prints.get(file)
    if (!hash) continue
    byHash.set(hash, [...(byHash.get(hash) ?? []), file])
  }
  return [...byHash.values()].filter((group) => group.length > 1)
}
