import type { LanguageInfo } from '../api'


export type AiItemSource =
  | { kind: 'file' }
  | { kind: 'zip'; zipId: string; zipName: string }

export interface AiBatchItem {
  id: string
  file: File
  language: string
  status: 'pending' | 'running' | 'done' | 'error'
  result?: import('../api').AIAnalysisResult
  error?: unknown
  source: AiItemSource
}

export function languageForExtension(languages: LanguageInfo[], ext: string): LanguageInfo | undefined {
  return languages.find((language) => language.extensions.includes(ext))
}

export function allExtensions(languages: LanguageInfo[]): string[] {
  return [...new Set(languages.flatMap((l) => l.extensions))]
}

export function keyForFile(file: File): string {
  return `${file.name}-${file.size}-${file.lastModified}`
}

export interface AiZipGroup {
  zipId: string
  zipName: string
  items: AiBatchItem[]
}
export function groupItemsBySource(items: AiBatchItem[]): {
  zipGroups: AiZipGroup[]
  looseItems: AiBatchItem[]
} {
  const zipGroups: AiZipGroup[] = []
  const zipIndex = new Map<string, AiZipGroup>()
  const looseItems: AiBatchItem[] = []

  for (const item of items) {
    if (item.source.kind === 'zip') {
      let group = zipIndex.get(item.source.zipId)
      if (!group) {
        group = { zipId: item.source.zipId, zipName: item.source.zipName, items: [] }
        zipIndex.set(item.source.zipId, group)
        zipGroups.push(group)
      }
      group.items.push(item)
    } else {
      looseItems.push(item)
    }
  }

  return { zipGroups, looseItems }
}

export function groupStatusSummary(items: AiBatchItem[]): {
  done: number
  error: number
  total: number
} {
  let done = 0
  let error = 0
  for (const item of items) {
    if (item.status === 'done') done += 1
    else if (item.status === 'error') error += 1
  }
  return { done, error, total: items.length }
}

export type AiRiskLabel = 'low' | 'medium' | 'high'

export interface AiProjectOverview {
  total: number
  analyzed: number
  pending: number
  failed: number
  unavailable: number
  unavailableReason: string | null
  labelCounts: Record<AiRiskLabel, number>
  overallLabel: AiRiskLabel | 'unavailable' | null
  avgIndicator: number | null
  flaggedFiles: Array<{ id: string; name: string; label: AiRiskLabel; indicator?: number }>
  topObservations: Array<{ category: string; count: number }>
}

const LABEL_SEVERITY: Record<AiRiskLabel, number> = { low: 0, medium: 1, high: 2 }
export function computeProjectOverview(items: AiBatchItem[]): AiProjectOverview {
  const labelCounts: Record<AiRiskLabel, number> = { low: 0, medium: 0, high: 0 }
  const observationCounts = new Map<string, number>()
  const flaggedFiles: AiProjectOverview['flaggedFiles'] = []
  let unavailable = 0
  let unavailableReason: string | null = null
  let failed = 0
  let analyzed = 0
  let pending = 0
  let indicatorSum = 0
  let indicatorCount = 0

  for (const item of items) {
    if (item.status === 'error') {
      failed += 1
      continue
    }
    if (item.status === 'pending' || item.status === 'running') {
      pending += 1
      continue
    }
    if (!item.result) continue
    analyzed += 1

    if (!item.result.available) {
      unavailable += 1
      unavailableReason ??= item.result.error ?? null
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
    pending,
    failed,
    unavailable,
    unavailableReason,
    labelCounts,
    overallLabel,
    avgIndicator: indicatorCount > 0 ? indicatorSum / indicatorCount : null,
    flaggedFiles,
    topObservations,
  }
}
