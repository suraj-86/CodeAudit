import { requestJson, requestBlob } from './client'
import type {
  BatchInput,
  BatchResult,
  HealthResponse,
  LanguagesResponse,
  WorkflowInput,
  WorkflowResult,
} from './types'

export { ApiError, NetworkError, isAbortError } from './errors'
export { getApiBase, requestBlob } from './client'
export type * from './types'

export function getHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return requestJson<HealthResponse>('/health', { signal: signal ?? null })
}

export function getLanguages(signal?: AbortSignal): Promise<LanguagesResponse> {
  return requestJson<LanguagesResponse>('/languages', { signal: signal ?? null })
}

export function buildWorkflowForm(input: WorkflowInput): FormData {
  const form = new FormData()
  form.append('language', input.language)
  form.append('runAI', input.runAI ? 'true' : 'false')
  if (input.projectName?.trim()) form.append('projectName', input.projectName.trim())
  if (input.referenceLanguage) form.append('referenceLanguage', input.referenceLanguage)
  if (input.structuralThreshold !== undefined) {
    form.append('structuralThreshold', String(input.structuralThreshold))
  }
  if (input.testCases && input.testCases.length > 0) {
    form.append('testCases', JSON.stringify(input.testCases))
  }
  form.append('source', input.source, input.source.name)
  if (input.reference) form.append('reference', input.reference, input.reference.name)
  return form
}

export function runWorkflow(
  input: WorkflowInput,
  signal?: AbortSignal,
): Promise<WorkflowResult> {
  return requestJson<WorkflowResult>('/analyze/workflow', {
    method: 'POST',
    body: buildWorkflowForm(input),
    signal: signal ?? null,
  })
}

export function buildBatchForm(input: BatchInput): FormData {
  const form = new FormData()
  form.append('language', input.language)
  if (input.structuralThreshold !== undefined) {
    form.append('structuralThreshold', String(input.structuralThreshold))
  }
  for (const file of input.submissions) form.append('submissions', file, file.name)
  form.append('reference', input.reference, input.reference.name)
  return form
}

export function runBatch(
  input: BatchInput,
  signal?: AbortSignal,
): Promise<BatchResult> {
  return requestJson<BatchResult>('/analyze/batch', {
    method: 'POST',
    body: buildBatchForm(input),
    signal: signal ?? null,
  })
}

export type ReportInput = Omit<WorkflowResult, 'warnings'>

export function toReportInput(result: WorkflowResult): ReportInput {
  return {
    projectName: result.projectName,
    sourceFiles: result.sourceFiles,
    correctness: result.correctness,
    similarity: result.similarity,
    aiAnalysis: result.aiAnalysis,
    evidence: result.evidence,
    disclaimer: result.disclaimer,
    generatedAt: result.generatedAt,
  }
}

export function generateReportPdf(input: ReportInput, signal?: AbortSignal): Promise<Blob> {
  return requestBlob('/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
    signal: signal ?? null,
  })
}
