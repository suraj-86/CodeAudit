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

export type AiRiskLabel = 'low' | 'medium' | 'high'

export interface AiProjectOverview {
  total: number
  analyzed: number
  failed: number
  unavailable: number
  labelCounts: Record<AiRiskLabel, number>
  overallLabel: AiRiskLabel | 'unavailable' | null
  avgIndicator: number | null
  flaggedFiles: Array<{ id: string; name: string; label: AiRiskLabel; indicator?: number }>
  topObservations: Array<{ category: string; count: number }>
}

const LABEL_SEVERITY: Record<AiRiskLabel, number> = { low: 0, medium: 1, high: 2 }

/** Rolls up every finished item into a single project-level verdict: the most
 *  severe label present wins (one high-risk file is worth flagging even if
 *  the other 99 are clean), same logic a human skimming the list would use. */
export function computeProjectOverview(items: AiBatchItem[]): AiProjectOverview {
  const labelCounts: Record<AiRiskLabel, number> = { low: 0, medium: 0, high: 0 }
  const observationCounts = new Map<string, number>()
  const flaggedFiles: AiProjectOverview['flaggedFiles'] = []
  let unavailable = 0
  let failed = 0
  let analyzed = 0
  let indicatorSum = 0
  let indicatorCount = 0

  for (const item of items) {
    if (item.status === 'error') {
      failed += 1
      continue
    }
    if (item.status !== 'done' || !item.result) continue
    analyzed += 1

    if (!item.result.available) {
      unavailable += 1
      continue
    }

    const label = item.result.label as AiRiskLabel | 'unavailable'
    if (label === 'low' || label === 'medium' || label === 'high') {
      labelCounts[label] += 1
      if (label !== 'low') {
        flaggedFiles.push({
          id: item.id,
          name: item.file.name,
          label,
          indicator: item.result.indicator,
        })
      }
    }

    if (item.result.indicator !== undefined) {
      indicatorSum += item.result.indicator
      indicatorCount += 1
    }

    for (const observation of item.result.observations) {
      observationCounts.set(
        observation.category,
        (observationCounts.get(observation.category) ?? 0) + 1,
      )
    }
  }

  let overallLabel: AiProjectOverview['overallLabel'] = null
  if (labelCounts.high > 0) overallLabel = 'high'
  else if (labelCounts.medium > 0) overallLabel = 'medium'
  else if (labelCounts.low > 0) overallLabel = 'low'
  else if (analyzed > 0) overallLabel = 'unavailable'

  flaggedFiles.sort((a, b) => LABEL_SEVERITY[b.label] - LABEL_SEVERITY[a.label])

  const topObservations = [...observationCounts.entries()]
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    total: items.length,
    analyzed,
    failed,
    unavailable,
    labelCounts,
    overallLabel,
    avgIndicator: indicatorCount > 0 ? indicatorSum / indicatorCount : null,
    flaggedFiles,
    topObservations,
  }
}
