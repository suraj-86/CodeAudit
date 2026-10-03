import type { BatchPairComparison, ReferenceComparison } from '../api'

/** Either a submission-vs-submission pair from the matrix, or a submission-vs-reference row. */
export type Selection =
  | { kind: 'pair'; pair: BatchPairComparison }
  | { kind: 'reference'; comparison: ReferenceComparison }

export interface ResolvedSelection {
  leftLabel: string
  rightLabel: string
  leftFile: File | null
  rightFile: File | null
  exactMatch: boolean
  similarity: number | null
  threshold: number
  unsupportedReason?: string | undefined
}

export function nameOf(submissions: Array<{ id: string; name: string }>, id: string): string {
  return submissions.find((s) => s.id === id)?.name ?? id
}

/** The two labelled files and the similarity facts for whichever row was selected. */
export function resolveSelection(
  selection: Selection,
  submissions: Array<{ id: string; name: string }>,
  fileById: Map<string, File>,
  reference: File | null,
): ResolvedSelection {
  if (selection.kind === 'reference') {
    const { comparison } = selection
    return {
      leftLabel: comparison.submissionName,
      rightLabel: `${comparison.referenceName} (reference)`,
      leftFile: fileById.get(comparison.submissionId) ?? null,
      rightFile: reference,
      exactMatch: comparison.similarity === 1,
      similarity: comparison.similarity,
      threshold: comparison.threshold,
    }
  }

  const { pair } = selection
  return {
    leftLabel: nameOf(submissions, pair.firstId),
    rightLabel: nameOf(submissions, pair.secondId),
    leftFile: fileById.get(pair.firstId) ?? null,
    rightFile: fileById.get(pair.secondId) ?? null,
    exactMatch: pair.exactMatch,
    similarity: pair.structuralSimilarity,
    threshold: pair.structuralThreshold,
    unsupportedReason: pair.structuralUnsupportedReason,
  }
}
