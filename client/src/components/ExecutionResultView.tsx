import type { ExecutionResult, ExecutionStatus } from '../api'

const STATUS_TONE: Record<ExecutionStatus, string> = {
  Passed: 'bg-mint/40 border-ink',
  Failed: 'bg-coral/30 border-ink',
  'Compilation Error': 'bg-coral/30 border-ink',
  'Runtime Error': 'bg-coral/30 border-ink',
  Timeout: 'bg-marigold/40 border-ink',
  Unsupported: 'bg-transparent border-dashed border-ink/40 text-ink-soft',
  'Execution Unavailable': 'bg-transparent border-dashed border-ink/40 text-ink-soft',
}

interface ExecutionResultViewProps {
  title: string
  result: ExecutionResult
}

export function ExecutionResultView({ title, result }: ExecutionResultViewProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h4 className="font-semibold">{title}</h4>
        <span
          className={`border-2 px-2 py-0.5 text-[0.85rem] font-semibold ${STATUS_TONE[result.status]}`}
        >
          {result.status}
        </span>
      </div>
      <p className="text-[0.92rem] text-ink-soft">
        {result.passedTests} of {result.passedTests + result.failedTests} test cases passed.
      </p>
      {result.testCases.length > 0 && (
        <ol className="space-y-1.5">
          {result.testCases.map((testCase, index) => (
            <li
              key={testCase.testCaseId}
              className={`border-2 px-3 py-1.5 text-[0.9rem] ${STATUS_TONE[testCase.status]}`}
            >
              <span className="font-semibold">
                Case {index + 1}: {testCase.status}
              </span>
              {testCase.error && <span className="block font-mono text-[0.85rem]">{testCase.error}</span>}
              {testCase.actualOutput !== undefined && testCase.status === 'Failed' && (
                <span className="block font-mono text-[0.85rem]">got: {testCase.actualOutput}</span>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}
