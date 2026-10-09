import type { AiProjectOverview, AiRiskLabel } from '../lib/ai-batch'
import { formatPercent } from '../lib/format'
import { Section } from './Section'

const LABEL_TONE: Record<AiRiskLabel, string> = {
  low: 'bg-mint/40',
  medium: 'bg-marigold/40',
  high: 'bg-coral/40',
}

const LABEL_COPY: Record<AiRiskLabel | 'unavailable', string> = {
  low: 'Mostly low AI-indicator risk',
  medium: 'Some files show a medium AI-indicator signal',
  high: 'At least one file shows a high AI-indicator signal',
  unavailable: 'AI analysis was unavailable for every file',
}

export function AiProjectOverviewCard({
  overview,
  onSelectFile,
}: {
  overview: AiProjectOverview
  onSelectFile: (id: string) => void
}) {
  const { total, analyzed, failed, unavailable, labelCounts, overallLabel, avgIndicator, flaggedFiles, topObservations } =
    overview

  return (
    <Section title="Project overview" description={`Rolled up from ${analyzed} of ${total} files analyzed.`}>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {overallLabel && overallLabel !== 'unavailable' && (
            <span className={`border-2 border-ink px-3 py-1 font-semibold capitalize ${LABEL_TONE[overallLabel]}`}>
              {overallLabel} risk
            </span>
          )}
          <span className="text-[0.95rem]">
            {overallLabel ? LABEL_COPY[overallLabel] : 'No files have finished analyzing yet.'}
          </span>
        </div>

        {avgIndicator !== null && (
          <p className="text-[0.9rem] text-ink-soft">
            Average AI indicator across analyzed files: {formatPercent(avgIndicator, 0)}
          </p>
        )}

        <div className="flex flex-wrap gap-4 text-[0.9rem]">
          <span>
            <span className="font-semibold">{labelCounts.low}</span> low
          </span>
          <span>
            <span className="font-semibold">{labelCounts.medium}</span> medium
          </span>
          <span>
            <span className="font-semibold">{labelCounts.high}</span> high
          </span>
          {unavailable > 0 && (
            <span>
              <span className="font-semibold">{unavailable}</span> unavailable
            </span>
          )}
          {failed > 0 && (
            <span>
              <span className="font-semibold">{failed}</span> failed
            </span>
          )}
        </div>

        {flaggedFiles.length > 0 && (
          <div>
            <p className="mb-1.5 font-semibold">Flagged files</p>
            <ul className="space-y-1.5">
              {flaggedFiles.slice(0, 10).map((file) => (
                <li key={file.id}>
                  <button
                    type="button"
                    onClick={() => onSelectFile(file.id)}
                    className="underline decoration-2 underline-offset-2 hover:decoration-coral"
                  >
                    {file.name}
                  </button>{' '}
                  — <span className="capitalize">{file.label}</span>
                  {file.indicator !== undefined && ` (${formatPercent(file.indicator, 0)})`}
                </li>
              ))}
            </ul>
            {flaggedFiles.length > 10 && (
              <p className="mt-1 text-[0.85rem] text-ink-soft">
                +{flaggedFiles.length - 10} more flagged file{flaggedFiles.length - 10 === 1 ? '' : 's'} below.
              </p>
            )}
          </div>
        )}

        {topObservations.length > 0 && (
          <div>
            <p className="mb-1.5 font-semibold">Most common observations across the project</p>
            <ul className="space-y-1">
              {topObservations.map((observation) => (
                <li key={observation.category} className="text-[0.9rem] text-ink-soft">
                  {observation.category} — in {observation.count} file{observation.count === 1 ? '' : 's'}
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-[0.85rem] text-ink-soft italic">
          This is a project-level roll-up of independent per-file signals, not a verdict. Open any file below for its
          own detail.
        </p>
      </div>
    </Section>
  )
}
