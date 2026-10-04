import type { TestCaseDraft } from '../lib/drafts'
import { newTestCaseDraft } from '../lib/drafts'
import { Button } from './ui/Button'

interface TestCaseEditorProps {
  cases: TestCaseDraft[]
  onChange: (cases: TestCaseDraft[]) => void
  disabled?: boolean
}

export function TestCaseEditor({ cases, onChange, disabled }: TestCaseEditorProps) {
  const update = (key: string, patch: Partial<TestCaseDraft>) =>
    onChange(cases.map((c) => (c.key === key ? { ...c, ...patch } : c)))

  return (
    <div className="space-y-3">
      {cases.map((testCase, index) => (
        <div key={testCase.key} className="grid gap-2 border-2 border-ink bg-white p-3 sm:grid-cols-2">
          <label className="text-[0.85rem] font-semibold">
            Input {index + 1}
            <textarea
              disabled={disabled}
              rows={2}
              value={testCase.input}
              onChange={(event) => update(testCase.key, { input: event.target.value })}
              className="mt-1 w-full resize-y border-2 border-ink/60 p-2 font-mono text-[0.88rem] disabled:opacity-45"
            />
          </label>
          <label className="text-[0.85rem] font-semibold">
            Expected output
            <textarea
              disabled={disabled}
              rows={2}
              value={testCase.expectedOutput}
              onChange={(event) => update(testCase.key, { expectedOutput: event.target.value })}
              className="mt-1 w-full resize-y border-2 border-ink/60 p-2 font-mono text-[0.88rem] disabled:opacity-45"
            />
          </label>
          <div className="sm:col-span-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onChange(cases.filter((c) => c.key !== testCase.key))}
              className="text-[0.85rem] font-semibold text-ink-soft underline disabled:opacity-45"
            >
              Remove this case
            </button>
          </div>
        </div>
      ))}
      <Button
        type="button"
        variant="secondary"
        disabled={disabled}
        onClick={() => onChange([...cases, newTestCaseDraft()])}
      >
        + Add test case
      </Button>
    </div>
  )
}
