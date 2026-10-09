import { useMemo, useState } from 'react'
import { runBatch, type BatchInput } from '../api'
import { useLanguages } from '../hooks/useLanguages'
import { useFilePrints } from '../hooks/useFilePrints'
import { useFileText } from '../hooks/useFileText'
import { useTask } from '../hooks/useTask'
import { duplicateGroups, fileProblem } from '../lib/files'
import { formatPercent } from '../lib/format'
import { nameOf, resolveSelection, type Selection } from '../lib/batch-selection'
import { extractFilesFromZip, extensionOf } from '../lib/zip'
import { Section } from '../components/Section'
import { LanguagePicker } from '../components/LanguagePicker'
import { DropZone } from '../components/DropZone'
import { FileChip } from '../components/FileChip'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { ScanningLoader } from '../components/ScanningLoader'
import { ErrorNotice } from '../components/ErrorNotice'
import { BatchMatrix } from '../components/BatchMatrix'
import { SignalsBanner } from '../components/SignalsBanner'
import { CodeDiffView } from '../components/CodeDiffView'
import { ResultSummary } from '../components/ResultSummary'

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
  const [selection, setSelection] = useState<Selection | null>(null)
  const [extracting, setExtracting] = useState(false)
  const [zipNotice, setZipNotice] = useState<string | null>(null)

  const [submittedFiles, setSubmittedFiles] = useState<{
    submissions: File[]
    reference: File
  } | null>(null)

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

  const addSubmissions = async (files: File[]) => {
    if (!language) return
    setZipNotice(null)

    const zips = files.filter((file) => file.name.toLowerCase().endsWith('.zip'))
    const plain = files.filter((file) => !file.name.toLowerCase().endsWith('.zip'))

    let fromZips: File[] = []
    if (zips.length > 0) {
      setExtracting(true)
      try {
        for (const zip of zips) {
          const extracted = await extractFilesFromZip(zip, (path) =>
            language.extensions.includes(extensionOf(path)),
          )
          if (extracted.length === 0) {
            setZipNotice(
              `No ${language.label} files were found inside "${zip.name}". Each submission's folder should contain one ${language.label} file.`,
            )
          }
          fromZips = [...fromZips, ...extracted]
        }
      } finally {
        setExtracting(false)
      }
    }

    setSubmissions((current) => [...current, ...plain, ...fromZips])
  }

  const submit = () => {
    if (!language || !reference) return
    const input: BatchInput = { language: language.id, submissions, reference }
    setSubmittedFiles({ submissions: [...submissions], reference })
    void run((signal) => runBatch(input, signal))
  }

  const startOver = () => {
    reset()
    setSubmissions([])
    setReference(null)
    setSelection(null)
    setSubmittedFiles(null)
    setZipNotice(null)
  }

  const fileById = useMemo(() => {
    const map = new Map<string, File>()
    if (submittedFiles && state.status === 'success') {
      state.data.submissions.forEach((submission, index) => {
        const file = submittedFiles.submissions[index]
        if (file) map.set(submission.id, file)
      })
    }
    return map
  }, [submittedFiles, state])

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
          <ResultSummary
            title="What ran"
            items={[
              { label: 'Submissions', value: `${state.data.submissions.length}` },
              { label: 'Pairs compared', value: `${state.data.matrix.comparisons.length}` },
              {
                label: 'Flagged pairs',
                value: `${state.data.suspiciousPairs.length}`,
                tone: state.data.suspiciousPairs.length > 0 ? 'flag' : 'neutral',
              },
              {
                label: 'Flagged vs. reference',
                value: `${state.data.referenceComparisons.filter((c) => c.suspicious).length}`,
                tone:
                  state.data.referenceComparisons.some((c) => c.suspicious) ? 'flag' : 'neutral',
              },
            ]}
          />

          <SignalsBanner />

          <Section title={`${state.data.submissions.length} submissions compared`}>
            <BatchMatrix
              submissions={state.data.submissions}
              comparisons={state.data.matrix.comparisons}
              onSelectPair={(pair) => setSelection({ kind: 'pair', pair })}
            />
          </Section>

          {selection && (
            <Section title="Selected comparison">
              <SelectionDetail
                selection={selection}
                submissions={state.data.submissions}
                fileById={fileById}
                reference={submittedFiles?.reference ?? null}
                language={language.id}
              />
            </Section>
          )}

          <Section title="Flagged pairs" description="Above the structural-similarity threshold.">
            {state.data.suspiciousPairs.length > 0 ? (
              <ul className="space-y-1.5">
                {state.data.suspiciousPairs.map((pair, index) => (
                  <li key={index}>
                    <button
                      type="button"
                      onClick={() => setSelection({ kind: 'pair', pair })}
                      className="underline decoration-2 underline-offset-2 hover:decoration-coral"
                    >
                      {nameOf(state.data.submissions, pair.firstId)} ↔ {nameOf(state.data.submissions, pair.secondId)}
                    </button>{' '}
                    — {formatPercent(pair.structuralSimilarity ?? 0)}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-soft">
                No pair crossed the similarity threshold. The check ran on all{' '}
                {state.data.matrix.comparisons.length} pairs — this is a clean result, not a skipped one.
              </p>
            )}
          </Section>

          <Section title="Against the reference">
            {state.data.referenceComparisons.length > 0 ? (
              <ul className="space-y-1.5">
                {state.data.referenceComparisons.map((c) => (
                  <li key={c.submissionId}>
                    <button
                      type="button"
                      onClick={() => setSelection({ kind: 'reference', comparison: c })}
                      className={`underline decoration-2 underline-offset-2 hover:decoration-sky ${
                        c.suspicious ? 'font-semibold text-[#c2263f]' : ''
                      }`}
                    >
                      {c.submissionName}: {formatPercent(c.similarity)}
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-ink-soft">No reference comparisons were produced for this batch.</p>
            )}
          </Section>

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
                  hint={`Up to ${limits.maxBatchSubmissions} ${language.label} files — or a .zip of the whole class set, one folder per student`}
                  accept={[...language.extensions, '.zip']}
                  multiple
                  disabled={busy || extracting}
                  onFiles={(files) => void addSubmissions(files)}
                />
                {extracting && <p className="text-[0.9rem] text-ink-soft">Reading zip…</p>}
                {zipNotice && (
                  <Alert tone="warning" title="Heads up">
                    {zipNotice}
                  </Alert>
                )}
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

function SelectionDetail({
  selection,
  submissions,
  fileById,
  reference,
  language,
}: {
  selection: Selection
  submissions: Array<{ id: string; name: string }>
  fileById: Map<string, File>
  reference: File | null
  language: string
}) {
  const resolved = resolveSelection(selection, submissions, fileById, reference)
  const leftText = useFileText(resolved.leftFile)
  const rightText = useFileText(resolved.rightFile)

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-[0.92rem] sm:grid-cols-4">
        <dt className="text-ink-soft">Comparing</dt>
        <dd className="col-span-3 font-semibold">
          {resolved.leftLabel} ↔ {resolved.rightLabel}
        </dd>
        <dt className="text-ink-soft">Exact match</dt>
        <dd className="col-span-3">{resolved.exactMatch ? 'Yes — byte for byte identical' : 'No'}</dd>
        <dt className="text-ink-soft">Structural similarity</dt>
        <dd className="col-span-3">
          {resolved.similarity === null
            ? (resolved.unsupportedReason ?? 'Not available')
            : `${formatPercent(resolved.similarity)} (threshold ${formatPercent(resolved.threshold)})`}
        </dd>
      </dl>

      {leftText !== null && rightText !== null ? (
        <CodeDiffView
          leftLabel={resolved.leftLabel}
          rightLabel={resolved.rightLabel}
          leftText={leftText}
          rightText={rightText}
          language={language}
        />
      ) : (
        <p className="text-ink-soft">Loading the files for comparison…</p>
      )}
    </div>
  )
}
