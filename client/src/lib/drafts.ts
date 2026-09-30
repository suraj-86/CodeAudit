import type { LanguageInfo, TestCase, UploadLimits } from '../api'
import { fileFromCode, fileProblem } from './files'

/** What a person has provided for one code slot: an uploaded file or pasted text. */
export interface SourceDraft {
  mode: 'upload' | 'paste'
  file: File | null
  text: string
}

export const emptyDraft = (): SourceDraft => ({ mode: 'upload', file: null, text: '' })

export function draftToFile(draft: SourceDraft, language: LanguageInfo, stem?: string): File | null {
  if (draft.mode === 'upload') return draft.file
  return draft.text.trim() ? fileFromCode(draft.text, language, stem) : null
}

export function draftProblem(
  draft: SourceDraft,
  language: LanguageInfo,
  limits: UploadLimits,
  stem?: string,
): string | null {
  const file = draftToFile(draft, language, stem)
  return file ? fileProblem(file, language, limits) : null
}

export interface TestCaseDraft {
  key: string
  input: string
  expectedOutput: string
}

let counter = 0
export const newTestCaseDraft = (): TestCaseDraft => ({
  key: `tc-${++counter}`,
  input: '',
  expectedOutput: '',
})

/** Drops untouched rows and numbers the rest the way the backend expects. */
export function toTestCases(drafts: TestCaseDraft[]): TestCase[] {
  return drafts
    .filter((d) => d.input.trim() !== '' || d.expectedOutput.trim() !== '')
    .map((d, index) => ({
      id: `case-${index + 1}`,
      input: d.input,
      expectedOutput: d.expectedOutput,
    }))
}
