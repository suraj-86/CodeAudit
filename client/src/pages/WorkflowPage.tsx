import { useState } from 'react'
import { runWorkflow, type WorkflowInput } from '../api'
import { useLanguages } from '../hooks/useLanguages'
import { useTask } from '../hooks/useTask'
import { draftProblem, draftToFile, emptyDraft, toTestCases, type SourceDraft, type TestCaseDraft } from '../lib/drafts'
import { Section } from '../components/Section'
import { LanguagePicker } from '../components/LanguagePicker'
import { CapabilityChips } from '../components/CapabilityChips'
import { SourceInput } from '../components/SourceInput'
import { TestCaseEditor } from '../components/TestCaseEditor'
import { AdvancedThreshold } from '../components/AdvancedThreshold'
import { Toggle } from '../components/ui/Toggle'
import { Button } from '../components/ui/Button'
import { ScanningLoader } from '../components/ScanningLoader'
import { ErrorNotice } from '../components/ErrorNotice'
import { WorkflowResultView } from '../components/WorkflowResultView'

const CAPABILITY_KEYS = ['exactMatch', 'structural', 'execution', 'ai'] as const
const DEFAULT_THRESHOLD = 0.75

export function WorkflowPage() {
  const { state: languagesState } = useLanguages()
  const { state, run, reset } = useTask<Awaited<ReturnType<typeof runWorkflow>>>()

  const languages = languagesState.status === 'ready' ? languagesState.data.languages : []
  const limits = languagesState.status === 'ready' ? languagesState.data.limits : null

  const [languageId, setLanguageId] = useState(languages[0]?.id ?? '')
  const language = languages.find((l) => l.id === languageId) ?? languages[0]

  const [source, setSource] = useState<SourceDraft>(emptyDraft())
  const [reference, setReference] = useState<SourceDraft>(emptyDraft())
  const [testCases, setTestCases] = useState<TestCaseDraft[]>([])
  const [runAI, setRunAI] = useState(true)
  const [threshold, setThreshold] = useState<number | undefined>(undefined)

  const busy = state.status === 'loading'
  const sourceFile = language ? draftToFile(source, language, 'submission') : null
  const referenceFile = language ? draftToFile(reference, language, 'reference') : null

  const canSubmit = Boolean(
    language &&
      limits &&
      sourceFile &&
      !busy &&
      !draftProblem(source, language, limits, 'submission') &&
      !draftProblem(reference, language, limits, 'reference'),
  )

  const submit = () => {
    if (!language || !sourceFile) return
    const input: WorkflowInput = {
      language: language.id,
      source: sourceFile,
      reference: referenceFile ?? undefined,
      testCases: language.capabilities.execution ? toTestCases(testCases) : undefined,
      runAI,
      structuralThreshold: threshold,
    }
    void run((signal) => runWorkflow(input, signal))
  }

  const startOver = () => {
    reset()
    setSource(emptyDraft())
    setReference(emptyDraft())
    setTestCases([])
  }

  if (!language || !limits) {
    return (
      <Section title="Check two files">
        <p className="text-ink-soft">No languages are configured on the server yet.</p>
      </Section>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Check two files</h1>
        <p className="mt-1 max-w-prose text-ink-soft">
          Submit one program, and optionally a reference to compare it against. CodeAudit runs whichever
          checks apply to the language you pick and shows each one separately.
        </p>
      </div>

      {state.status === 'success' ? (
        <div className="space-y-4">
          <WorkflowResultView result={state.data} />
          <Button variant="secondary" onClick={startOver}>
            Start a new check
          </Button>
        </div>
      ) : (
        <Section title="Submission">
          <div className="space-y-6">
            <LanguagePicker languages={languages} value={language.id} onChange={setLanguageId} disabled={busy} />
            <CapabilityChips language={language} keys={[...CAPABILITY_KEYS]} />

            <SourceInput
              id="source"
              label="Your program"
              draft={source}
              onChange={setSource}
              language={language}
              limits={limits}
              disabled={busy}
            />

            <SourceInput
              id="reference"
              label="Reference to compare against"
              hint="Needed for exact-match and structure comparison"
              draft={reference}
              onChange={setReference}
              language={language}
              limits={limits}
              optional
              disabled={busy}
            />

            {language.capabilities.execution && (
              <div>
                <p className="mb-2 font-semibold">Test cases</p>
                <TestCaseEditor cases={testCases} onChange={setTestCases} disabled={busy} />
              </div>
            )}

            {language.capabilities.ai && (
              <Toggle
                checked={runAI}
                onChange={setRunAI}
                label="Run AI-assisted analysis"
                description="An extra, separate signal. Never proof on its own."
                disabled={busy}
              />
            )}

            {language.capabilities.structural && (
              <AdvancedThreshold
                value={threshold}
                defaultValue={DEFAULT_THRESHOLD}
                onChange={setThreshold}
                disabled={busy}
              />
            )}

            {!sourceFile && (
              <p className="text-[0.85rem] text-ink-soft">Add your program above to enable the check.</p>
            )}

            <Button onClick={submit} disabled={!canSubmit}>
              {busy ? 'Checking…' : 'Run check'}
            </Button>
          </div>
        </Section>
      )}

      {state.status === 'loading' && <ScanningLoader label="Running the checks…" />}
      {state.status === 'error' && <ErrorNotice error={state.error} onRetry={submit} />}
    </div>
  )
}
