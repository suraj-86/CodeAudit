
export interface LanguageCapabilities {
  exactMatch: boolean
  structural: boolean
  batch: boolean
  execution: boolean
  ai: boolean
}

export type CapabilityKey = keyof LanguageCapabilities

export interface LanguageInfo {
  id: string
  label: string
  extensions: string[]
  capabilities: LanguageCapabilities
}

export interface UploadLimits {
  maxFileSizeBytes: number
  maxFiles: number
  maxTotalSourceBytes: number
  maxBatchSubmissions: number
}

export interface LanguagesResponse {
  languages: LanguageInfo[]
  limits: UploadLimits
}

export interface HealthResponse {
  status: string
  service: string
}

export interface TestCase {
  id: string
  input: string
  expectedOutput: string
}

export type ExecutionStatus =
  | 'Passed'
  | 'Failed'
  | 'Compilation Error'
  | 'Runtime Error'
  | 'Timeout'
  | 'Unsupported'
  | 'Execution Unavailable'

export interface TestCaseResult {
  testCaseId: string
  status: ExecutionStatus
  actualOutput?: string
  error?: string
  executionTimeMs?: number
}

export interface ExecutionResult {
  status: ExecutionStatus
  passedTests: number
  failedTests: number
  testCases: TestCaseResult[]
  executionTimeMs?: number
}

export interface StructuralSimilarity {
  similarity: number
  threshold: number
  suspicious: boolean
}

export type AIAnalysisLabel = 'low' | 'medium' | 'high' | 'unavailable'

export interface AIAnalysisResult {
  available: boolean
  provider: string
  indicator?: number
  label: AIAnalysisLabel
  confidence?: number
  observations: Array<{ category: string; description: string }>
  disclaimer: string
  error?: string
}

export interface WorkflowResult {
  projectName?: string
  sourceFiles: Array<{
    filename: string
    language?: string
    sha256?: string
  }>
  correctness?: {
    source: ExecutionResult
    comparison?: ExecutionResult
  }
  similarity?: StructuralSimilarity
  aiAnalysis?: AIAnalysisResult
  evidence: Array<{ category: string; description: string }>
  disclaimer: string
  generatedAt: string
  warnings: string[]
}

export interface BatchPairComparison {
  firstId: string
  secondId: string
  exactMatch: boolean
  hashA: string
  hashB: string
  structuralSimilarity: number | null
  structuralThreshold: number
  structuralSuspicious: boolean
  structuralUnsupportedReason?: string
}

export interface ReferenceComparison {
  submissionId: string
  submissionName: string
  referenceId: string
  referenceName: string
  similarity: number
  threshold: number
  suspicious: boolean
}

export interface BatchResult {
  submissions: Array<{ id: string; name: string; language: string }>
  matrix: {
    submissionIds: string[]
    comparisons: BatchPairComparison[]
  }
  suspiciousPairs: BatchPairComparison[]
  referenceComparisons: ReferenceComparison[]
}

export interface WorkflowInput {
  language: string
  source: File
  reference?: File | undefined
  referenceLanguage?: string | undefined
  testCases?: TestCase[] | undefined
  runAI: boolean
  structuralThreshold?: number | undefined
  projectName?: string | undefined
}

export interface BatchInput {
  language: string
  submissions: File[]
  reference: File
  structuralThreshold?: number | undefined
}
