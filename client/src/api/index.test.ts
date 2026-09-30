import { describe, expect, it } from 'vitest'
import { toReportInput } from './index'
import type { WorkflowResult } from './types'

const RESULT: WorkflowResult = {
  sourceFiles: [{ filename: 'a.cpp', sha256: 'abc' }],
  evidence: [{ category: 'Hash', description: 'a.cpp: SHA-256 abc.' }],
  disclaimer: 'This report presents independent analytical signals.',
  generatedAt: '2026-01-01T00:00:00.000Z',
  warnings: ['AI-assisted analysis skipped: disabled for this request.'],
}

describe('toReportInput', () => {
  it('drops warnings and keeps every other field', () => {
    const input = toReportInput(RESULT)
    expect(input).not.toHaveProperty('warnings')
    expect(input.sourceFiles).toEqual(RESULT.sourceFiles)
    expect(input.evidence).toEqual(RESULT.evidence)
    expect(input.disclaimer).toBe(RESULT.disclaimer)
    expect(input.generatedAt).toBe(RESULT.generatedAt)
  })
})
