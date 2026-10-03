import { describe, expect, it } from 'vitest'
import { nameOf, resolveSelection } from './batch-selection'
import type { BatchPairComparison, ReferenceComparison } from '../api'

const SUBMISSIONS = [
  { id: 'a', name: 'alice.cpp' },
  { id: 'b', name: 'bob.cpp' },
]

const FILE_A = new File(['int a;'], 'alice.cpp')
const FILE_B = new File(['int b;'], 'bob.cpp')
const REFERENCE = new File(['int ref;'], 'reference.cpp')

const FILE_BY_ID = new Map([
  ['a', FILE_A],
  ['b', FILE_B],
])

describe('nameOf', () => {
  it('finds a submission name by id, falling back to the id itself', () => {
    expect(nameOf(SUBMISSIONS, 'a')).toBe('alice.cpp')
    expect(nameOf(SUBMISSIONS, 'missing')).toBe('missing')
  })
})

describe('resolveSelection', () => {
  it('resolves a pair selection to both submissions and their files', () => {
    const pair: BatchPairComparison = {
      firstId: 'a',
      secondId: 'b',
      exactMatch: false,
      hashA: 'x',
      hashB: 'y',
      structuralSimilarity: 0.87,
      structuralThreshold: 0.75,
      structuralSuspicious: true,
    }

    const resolved = resolveSelection({ kind: 'pair', pair }, SUBMISSIONS, FILE_BY_ID, REFERENCE)

    expect(resolved.leftLabel).toBe('alice.cpp')
    expect(resolved.rightLabel).toBe('bob.cpp')
    expect(resolved.leftFile).toBe(FILE_A)
    expect(resolved.rightFile).toBe(FILE_B)
    expect(resolved.similarity).toBe(0.87)
    expect(resolved.exactMatch).toBe(false)
  })

  it('carries the unsupported-language reason through for a pair', () => {
    const pair: BatchPairComparison = {
      firstId: 'a',
      secondId: 'b',
      exactMatch: false,
      hashA: 'x',
      hashB: 'y',
      structuralSimilarity: null,
      structuralThreshold: 0.75,
      structuralSuspicious: false,
      structuralUnsupportedReason: 'Structural comparison currently supports C++ submissions only.',
    }

    const resolved = resolveSelection({ kind: 'pair', pair }, SUBMISSIONS, FILE_BY_ID, REFERENCE)
    expect(resolved.similarity).toBeNull()
    expect(resolved.unsupportedReason).toMatch(/C\+\+ submissions only/)
  })

  it('resolves a reference selection, labelling the reference file and treating similarity 1 as exact', () => {
    const comparison: ReferenceComparison = {
      submissionId: 'a',
      submissionName: 'alice.cpp',
      referenceId: 'ref',
      referenceName: 'reference.cpp',
      similarity: 1,
      threshold: 0.75,
      suspicious: true,
    }

    const resolved = resolveSelection({ kind: 'reference', comparison }, SUBMISSIONS, FILE_BY_ID, REFERENCE)

    expect(resolved.leftFile).toBe(FILE_A)
    expect(resolved.rightFile).toBe(REFERENCE)
    expect(resolved.rightLabel).toContain('reference')
    expect(resolved.exactMatch).toBe(true)
  })

  it('returns null files when a submission id is not in the map', () => {
    const comparison: ReferenceComparison = {
      submissionId: 'unknown',
      submissionName: 'ghost.cpp',
      referenceId: 'ref',
      referenceName: 'reference.cpp',
      similarity: 0.2,
      threshold: 0.75,
      suspicious: false,
    }

    const resolved = resolveSelection({ kind: 'reference', comparison }, SUBMISSIONS, FILE_BY_ID, REFERENCE)
    expect(resolved.leftFile).toBeNull()
  })
})
