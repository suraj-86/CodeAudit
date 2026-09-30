import { useState } from 'react'
import { runBatch, type BatchInput, type BatchPairComparison } from '../api'
import { useLanguages } from '../hooks/useLanguages'
import { useFilePrints } from '../hooks/useFilePrints'
import { useTask } from '../hooks/useTask'
import { duplicateGroups, fileProblem } from '../lib/files'
import { formatPercent } from '../lib/format'
import { Section } from '../components/Section'
import { LanguagePicker } from '../components/LanguagePicker'
import { DropZone } from '../components/DropZone'
import { FileChip } from '../components/FileChip'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { ScanningLoader } from '../components/ScanningLoader'
import { ErrorNotice } from '../components/ErrorNotice'
import { BatchMatrix } from '../components/BatchMatrix'

const BATCH_CAPABLE = 'batch'

export function BatchPage() {
  const { state: languagesState } = useLanguages()
  const { state, run, reset } = useTask<Awaited<ReturnType<typeof runBatch>>>()

  const allLanguages = languagesState.status === 'ready' ? languagesState.data.languages : []
  const languages = allLanguages.filter((l) => l.capabilities[BATCH_CAPABLE])
  const limits = languagesState.status === 'ready' ? languagesState.data.limits : null

  const [languageId, setLanguageId] = useState(languages[0]?.id ?? '')
  const language = languages.find((l) => l.id === languageId) ?? languages[0]

  const [submissions, setSubmissions] = useState<File[]>([])
  const [reference, setReference] = useState<File | null>(null)
  const [selectedPair, setSelectedPair] = useState<BatchPairComparison | null>(null)

  const submissionPrints = useFilePrints(submissions)
  const referencePrints = useFilePrints(reference ? [reference] : [])
  const twins = language ? duplicateGroups(submissions, submissionPrints) : []

  const busy = state.status === 'loading'
  const allFilesValid = Boolean(
    language &&
      limits &&
      submissions.every((file) => !fileProblem(file, language, limits)) &&
      (!reference || !fileProblem(reference, language, limits)),
  )
  const canSubmit = Boolean(
    language && limits && submissions.length >= 2 && reference && !busy && allFilesValid,
  )

  const addSubmissions = (files: File[]) => setSubmissions((current) => [...current, ...files])

  const submit = () => {
    if (!language || !reference) return
    const input: BatchInput = { language: language.id, submissions, reference }
    void run((signal) => runBatch(input, signal))
  }

  const startOver = () => {
    reset()
    setSubmissions([])
    setReference(null)
    setSelectedPair(null)
  }

  if (languagesState.status === 'ready' && languages.length === 0) {
    return (
      <Section title="Check a class set">
        <Alert tone="info" title="Batch comparison isn't available yet">
          None of the configured languages support batch/reference comparison right now.
        </Alert>
      </Section>
    )
  }

  if (!language || !limits) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">Check a class set</h1>
        <p className="mt-1 max-w-prose text-ink-soft">
          Upload every submission plus one reference solution. CodeAudit compares every pair and every
          submission against the reference.
        </p>
      </div>

      {state.status === 'success' ? (
        <div className="space-y-4">
          <Section title={`${state.data.submissions.length} submissions compared`}>
            <BatchMatrix
              submissions={state.data.submissions}
              comparisons={state.data.matrix.comparisons}
              onSelectPair={setSelectedPair}
            />
          </Section>

          {selectedPair && (
            <Section title="Selected pair">
              <PairDetail pair={selectedPair} submissions={state.data.submissions} />
            </Section>
          )}

          {state.data.suspiciousPairs.length > 0 && (
            <Section title="Flagged pairs" description="Above the structural-similarity threshold.">
              <ul className="space-y-1.5">
                {state.data.suspiciousPairs.map((pair, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => setSelectedPair(pair)}
                      className="underline decoration-2 underline-offset-2 hover:decoration-coral"
                    >
                      {nameOf(state.data.submissions, pair.firstId)} ↔ {nameOf(state.data.submissions, pair.secondId)}
                    </button>{' '}
                    — {formatPercent(pair.structuralSimilarity ?? 0)}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {state.data.referenceComparisons.length > 0 && (
            <Section title="Against the reference">
              <ul className="space-y-1.5">
                {state.data.referenceComparisons.map((c) => (
                  <li key={c.submissionId} className={c.suspicious ? 'font-semibold text-[#c2263f]' : ''}>
                    {c.submissionName}: {formatPercent(c.similarity)}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          <Button variant="secondary" onClick={startOver}>
            Start a new batch
          </Button>
        </div>
      ) : (
        <Section title="Submissions">
          <div className="space-y-6">
            <LanguagePicker languages={languages} value={language.id} onChange={setLanguageId} disabled={busy} />

            <div>
              <p className="mb-2 font-semibold">
                Submissions <span className="font-normal text-ink-soft">({submissions.length} added)</span>
              </p>
              <div className="space-y-2">
                {submissions.map((file, index) => (
                  <FileChip
                    key={`${file.name}-${index}`}
                    file={file}
                    hash={submissionPrints.get(file) ?? null}
                    problem={fileProblem(file, language, limits)}
                    twins={twins
                      .find((group) => group.includes(file))
                      ?.filter((f) => f !== file)
                      .map((f) => f.name)}
                    disabled={busy}
                    onRemove={() => setSubmissions((current) => current.filter((_, i) => i !== index))}
                  />
                ))}
                <DropZone
                  id="submissions"
                  label="Drop submissions here, or click to choose"
                  hint={`Up to ${limits.maxBatchSubmissions} ${language.label} files`}
                  accept={language.extensions}
                  multiple
                  disabled={busy}
                  onFiles={addSubmissions}
                />
              </div>
            </div>

            <div>
              <p className="mb-2 font-semibold">Reference solution</p>
              {reference ? (
                <FileChip
                  file={reference}
                  hash={referencePrints.get(reference) ?? null}
                  problem={fileProblem(reference, language, limits)}
                  disabled={busy}
                  onRemove={() => setReference(null)}
                />
              ) : (
                <DropZone
                  id="reference"
                  label="Drop the reference solution here"
                  accept={language.extensions}
                  disabled={busy}
                  onFiles={(files) => setReference(files[0] ?? null)}
                />
              )}
            </div>

            <Button onClick={submit} disabled={!canSubmit}>
              {busy ? 'Comparing…' : `Compare ${submissions.length || 0} submissions`}
            </Button>
          </div>
        </Section>
      )}

      {state.status === 'loading' && <ScanningLoader label="Comparing every pair…" />}
      {state.status === 'error' && <ErrorNotice error={state.error} onRetry={submit} />}
    </div>
  )
}

function nameOf(submissions: Array<{ id: string; name: string }>, id: string): string {
  return submissions.find((s) => s.id === id)?.name ?? id
}

function PairDetail({
  pair,
  submissions,
}: {
  pair: BatchPairComparison
  submissions: Array<{ id: string; name: string }>
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[0.92rem] sm:grid-cols-4">
      <dt className="text-ink-soft">Pair</dt>
      <dd className="col-span-3 font-semibold">
        {nameOf(submissions, pair.firstId)} ↔ {nameOf(submissions, pair.secondId)}
      </dd>
      <dt className="text-ink-soft">Exact match</dt>
      <dd className="col-span-3">{pair.exactMatch ? 'Yes — byte for byte identical' : 'No'}</dd>
      <dt className="text-ink-soft">Structural similarity</dt>
      <dd className="col-span-3">
        {pair.structuralSimilarity === null
          ? (pair.structuralUnsupportedReason ?? 'Not available')
          : `${formatPercent(pair.structuralSimilarity)} (threshold ${formatPercent(pair.structuralThreshold)})`}
      </dd>
    </dl>
  )
}
