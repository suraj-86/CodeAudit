import { useState } from 'react'
import { generateReportPdf, toReportInput, type WorkflowResult } from '../api'
import { downloadBlob } from '../lib/download'
import { shortHash } from '../lib/print'
import { useFileText } from '../hooks/useFileText'
import { Button } from './ui/Button'
import { Section } from './Section'
import { FilePrint } from './FilePrint'
import { SimilarityDial } from './SimilarityDial'
import { ExecutionResultView } from './ExecutionResultView'
import { AIResultView } from './AIResultView'
import { EvidenceList } from './EvidenceList'
import { WarningsList } from './WarningsList'
import { ErrorNotice } from './ErrorNotice'
import { SignalsBanner } from './SignalsBanner'
import { CodeDiffView } from './CodeDiffView'
import { ResultSummary } from './ResultSummary'
import { formatPercent } from '../lib/format'

interface WorkflowResultViewProps {
  result: WorkflowResult
  language: string
  /** The exact files submitted for this result, so the diff view shows what was actually checked. */
  sourceFile: File | null
  referenceFile: File | null
}

export function WorkflowResultView({
  result,
  language,
  sourceFile,
  referenceFile,
}: WorkflowResultViewProps) {
  const sourceText = useFileText(sourceFile)
  const referenceText = useFileText(referenceFile)
  const [report, setReport] = useState<
    { status: 'idle' } | { status: 'loading' } | { status: 'error'; error: unknown }
  >({ status: 'idle' })

  const downloadReport = async () => {
    setReport({ status: 'loading' })
    try {
      const blob = await generateReportPdf(toReportInput(result))
      downloadBlob(blob, `codeaudit-report-${Date.now()}.pdf`)
      setReport({ status: 'idle' })
    } catch (error) {
      setReport({ status: 'error', error })
    }
  }

  const exactMatchNote = result.evidence.find((item) => item.category === 'Exact Match')
  const checksRun = [
    Boolean(exactMatchNote),
    Boolean(result.similarity),
    Boolean(result.correctness),
    Boolean(result.aiAnalysis?.available),
  ].filter(Boolean).length

  return (
    <div className="space-y-5">
      <ResultSummary
        title="What ran"
        items={[
          { label: 'Checks completed', value: `${checksRun} of 4` },
          {
            label: 'Exact match',
            value: exactMatchNote
              ? // The backend reports exact-match only as evidence prose (no
                // separate boolean field on the result); its wording is fixed
                // by analysis-workflow.ts, so matching it exactly is safe for
                // this display-only purpose.
                exactMatchNote.description === 'The submission is byte-identical to the reference.'
                ? 'Yes'
                : 'No'
              : 'No reference given',
          },
          ...(result.similarity
            ? ([
                {
                  label: 'Structural similarity',
                  value: formatPercent(result.similarity.similarity),
                  tone: result.similarity.suspicious ? 'flag' : 'neutral',
                },
              ] as const)
            : []),
          ...(result.warnings.length > 0
            ? ([{ label: 'Skipped', value: `${result.warnings.length}` }] as const)
            : []),
        ]}
      />

      <SignalsBanner />

      <Section title="Files">
        <ul className="flex flex-wrap gap-4">
          {result.sourceFiles.map((file) => (
            <li key={file.filename} className="flex items-center gap-3">
              <FilePrint hash={file.sha256 ?? null} size={56} />
              <div>
                <p className="font-semibold">{file.filename}</p>
                {file.sha256 && (
                  <p className="font-mono text-[0.85rem] text-ink-soft">{shortHash(file.sha256)}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
        {exactMatchNote && (
          <p className="mt-3 border-2 border-ink bg-marigold/30 px-3 py-2 font-semibold">
            {exactMatchNote.description}
          </p>
        )}
      </Section>

      {referenceFile && (
        <Section
          title="Code side by side"
          description="The exact two files that were checked, with differences highlighted. Reading the code is still the most reliable check."
        >
          {sourceText !== null && referenceText !== null ? (
            <CodeDiffView
              leftLabel={sourceFile?.name ?? 'Submission'}
              rightLabel={referenceFile.name}
              leftText={sourceText}
              rightText={referenceText}
              language={language}
            />
          ) : (
            <p className="text-ink-soft">Loading the files for comparison…</p>
          )}
        </Section>
      )}

      <WarningsList warnings={result.warnings} />

      {result.similarity && (
        <Section
          title="Structural similarity"
          description="Compares the shape of the code — control flow, calls, operators — ignoring names, formatting and comments."
        >
          <SimilarityDial
            similarity={result.similarity.similarity}
            threshold={result.similarity.threshold}
            suspicious={result.similarity.suspicious}
          />
        </Section>
      )}

      {result.correctness && (
        <Section title="Correctness" description="Does the program produce the expected output for your test cases?">
          <div className="grid gap-5 sm:grid-cols-2">
            <ExecutionResultView title="Submission" result={result.correctness.source} />
            {result.correctness.comparison && (
              <ExecutionResultView title="Reference" result={result.correctness.comparison} />
            )}
          </div>
        </Section>
      )}

      {result.aiAnalysis && (
        <Section title="AI-assisted analysis">
          <AIResultView result={result.aiAnalysis} />
        </Section>
      )}

      <Section title="Evidence log" description="Everything the checks above found, in one list.">
        <EvidenceList evidence={result.evidence} />
        <p className="mt-3 text-[0.85rem] text-ink-soft italic">{result.disclaimer}</p>
      </Section>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={downloadReport} disabled={report.status === 'loading'}>
          {report.status === 'loading' ? 'Preparing PDF…' : 'Download PDF report'}
        </Button>
      </div>
      {report.status === 'error' && <ErrorNotice error={report.error} onRetry={downloadReport} />}
    </div>
  )
}
