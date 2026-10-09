import type { LanguageInfo } from '../api'

export interface AiBatchItem {
  id: string
  file: File
  language: string
  status: 'pending' | 'running' | 'done' | 'error'
  result?: import('../api').AIAnalysisResult
  error?: unknown
}

/** First language (in list order) whose extensions include `ext`. */
export function languageForExtension(languages: LanguageInfo[], ext: string): LanguageInfo | undefined {
  return languages.find((language) => language.extensions.includes(ext))
}

export function allExtensions(languages: LanguageInfo[]): string[] {
  return [...new Set(languages.flatMap((l) => l.extensions))]
}

export function keyForFile(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`
}
