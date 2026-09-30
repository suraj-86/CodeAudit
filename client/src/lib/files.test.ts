import { describe, expect, it } from 'vitest'
import { extensionOf, fileProblem, fileFromCode, duplicateGroups } from './files'
import type { LanguageInfo, UploadLimits } from '../api'

const PYTHON: LanguageInfo = {
  id: 'python',
  label: 'Python',
  extensions: ['.py'],
  capabilities: { exactMatch: true, structural: false, batch: false, execution: true, ai: true },
}

const LIMITS: UploadLimits = {
  maxFileSizeBytes: 1024,
  maxFiles: 10,
  maxTotalSourceBytes: 1024 * 10,
  maxBatchSubmissions: 100,
}

describe('extensionOf', () => {
  it('reads the extension, lower-cased', () => {
    expect(extensionOf('Solution.PY')).toBe('.py')
    expect(extensionOf('noext')).toBe('')
  })
})

describe('fileProblem', () => {
  it('flags a wrong extension', () => {
    const file = new File(['x'], 'a.cpp')
    expect(fileProblem(file, PYTHON, LIMITS)).toMatch(/end in \.py/)
  })

  it('flags an empty file', () => {
    const file = new File([], 'a.py')
    expect(fileProblem(file, PYTHON, LIMITS)).toMatch(/empty/)
  })

  it('flags an oversized file', () => {
    const file = new File(['x'.repeat(2000)], 'a.py')
    expect(fileProblem(file, PYTHON, LIMITS)).toMatch(/limit/)
  })

  it('passes a valid file', () => {
    const file = new File(['print(1)'], 'a.py')
    expect(fileProblem(file, PYTHON, LIMITS)).toBeNull()
  })
})

describe('fileFromCode', () => {
  it('wraps text with the language\'s extension', () => {
    const file = fileFromCode('print(1)', PYTHON, 'pasted')
    expect(file.name).toBe('pasted.py')
  })
})

describe('duplicateGroups', () => {
  it('groups files that share a hash, and skips singletons', () => {
    const a = new File(['x'], 'a.py')
    const b = new File(['x'], 'b.py')
    const c = new File(['y'], 'c.py')
    const prints = new Map([
      [a, 'hash1'],
      [b, 'hash1'],
      [c, 'hash2'],
    ])
    const groups = duplicateGroups([a, b, c], prints)
    expect(groups).toHaveLength(1)
    expect(groups[0]).toEqual([a, b])
  })
})
