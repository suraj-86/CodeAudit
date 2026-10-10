import type { AiProjectOverview, AiRiskLabel } from '../lib/ai-batch'
import { formatPercent } from '../lib/format'
import { Section } from './Section'
import { ResultSummary } from './ResultSummary'

const LABEL_TONE: Record<AiRiskLabel, string> = {
  low: 'bg-mint/40',
  medium: 'bg-marigold/40',
  high: 'bg-coral/40',
}

const BAR_COLOR: Record<AiRiskLabel | 'unavailable', string> = {
  low: 'bg-mint',
  medium: 'bg-marigold',
  high: 'bg-coral',
  unavailable: 'bg-ink/15',
}

const LABEL_COPY: Record<AiRiskLabel | 'unavailable', string> = {
  low: 'Mostly low AI-indicator risk across the project.',
  medium: 'Some files show a medium AI-indicator signal — worth a look.',
  high: 'At least one file shows a high AI-indicator signal.',
  unavailable: 'AI analysis was unavailable for every file in this run.',
}

export function AiProjectOverviewCard({
  overview,
  onSelectFile,
}: {
  overview: AiProjectOverview
  onSelectFile: (id: string) => void
}) {
  const {
    total,
    analyzed,
    pending,
    failed,
    unavailable,
    unavailableReason,
    labelCounts,
    overallLabel,
    avgIndicator,
    flaggedFiles,
    topObservations,
  } = overview

  const available = analyzed - unavailable
  const segments: Array<{ key: AiRiskLabel | 'unavailable'; count: number }> = [
    { key: 'high', count: labelCounts.high },
    { key: 'medium', count: labelCounts.medium },
    { key: 'low', count: labelCounts.low },
    { key: 'unavailable', count: unavailable },
  ]
  const segmentTotal = segments.reduce((sum, s) => sum + s.count, 0)

  return (
    <Section
      title="Project overview"
      description={
        pending > 0
          ? `Rolling up as files finish — ${analyzed} of ${total} done so far.`
          : `Rolled up from ${analyzed} of ${total} files.`
      }
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center gap-3">
          {overallLabel && overallLabel !== 'unavailable' && (
            <span className={`rounded-full border-2 border-ink px-3 py-1 font-semibold capitalize ${LABEL_TONE[overallLabel]}`}>
              {overallLabel} risk
            </span>
          )}
          <span className="text-[0.95rem] font-medium">
            {overallLabel ? LABEL_COPY[overallLabel] : 'No files have finished analyzing yet.'}
          </span>
        </div>

        {unavailableReason && unavailable === analyzed && analyzed > 0 && (
          <div className="rounded-xl border-2 border-dashed border-ink/40 px-4 py-3 text-[0.9rem] text-ink-soft">
            Every file came back unavailable: {unavailableReason}
          </div>
        )}

        <ResultSummary
          title="At a glance"
          items={[
            { label: 'Total files', value: `${total}` },
            { label: 'Analyzed', value: `${analyzed}` },
            ...(pending > 0 ? [{ label: 'Pending', value: `${pending}` }] : []),
            ...(failed > 0 ? [{ label: 'Failed', value: `${failed}`, tone: 'flag' as const }] : []),
            {
              label: 'Flagged (medium/high)',
              value: `${labelCounts.medium + labelCounts.high}`,
              tone: labelCounts.medium + labelCounts.high > 0 ? ('flag' as const) : ('neutral' as const),
            },
            ...(avgIndicator !== null ? [{ label: 'Avg. AI indicator', value: formatPercent(avgIndicator, 0) }] : []),
          ]}
        />

        {segmentTotal > 0 && (
          <div>
            <p className="mb-1.5 font-semibold">Risk distribution</p>
            <div
              role="img"
              aria-label={`${labelCounts.high} high, ${labelCounts.medium} medium, ${labelCounts.low} low, ${unavailable} unavailable`}
              className="flex h-5 w-full overflow-hidden rounded-full border-2 border-ink"
            >
              {segments
                .filter((s) => s.count > 0)
                .map((s) => (
                  <div
                    key={s.key}
                    className={`${BAR_COLOR[s.key]} ${s.key !== 'unavailable' ? 'border-ink/20' : ''}`}
                    style={{ width: `${(s.count / segmentTotal) * 100}%` }}
                    title={`${s.key}: ${s.count}`}
                  />
                ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[0.88rem]">
              <LegendItem color="bg-coral" label="High" count={labelCounts.high} total={segmentTotal} />
              <LegendItem color="bg-marigold" label="Medium" count={labelCounts.medium} total={segmentTotal} />
              <LegendItem color="bg-mint" label="Low" count={labelCounts.low} total={segmentTotal} />
              {unavailable > 0 && (
                <LegendItem color="bg-ink/15" label="Unavailable" count={unavailable} total={segmentTotal} />
              )}
            </div>
          </div>
        )}

        {available > 0 && avgIndicator !== null && (
          <div>
            <p className="mb-1.5 font-semibold">Average AI indicator</p>
            <div className="h-3 w-full overflow-hidden rounded-full border-2 border-ink bg-white">
              <div
                className="h-full rounded-full bg-violet"
                style={{ width: `${Math.round(avgIndicator * 100)}%` }}
              />
            </div>
            <p className="mt-1 text-[0.85rem] text-ink-soft">
              {formatPercent(avgIndicator, 0)} average across {available} file{available === 1 ? '' : 's'} where AI
              analysis was available.
            </p>
          </div>
        )}

        {flaggedFiles.length > 0 && (
          <div>
            <p className="mb-1.5 font-semibold">
              Flagged files <span className="font-normal text-ink-soft">({flaggedFiles.length})</span>
            </p>
            <ul className="space-y-1.5">
              {flaggedFiles.slice(0, 10).map((file) => (
                <li key={file.id} className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${file.label === 'high' ? 'bg-coral' : 'bg-marigold'}`}
                  />
                  <button
                    type="button"
                    onClick={() => onSelectFile(file.id)}
                    className="truncate underline decoration-2 underline-offset-2 hover:decoration-coral"
                    title={file.name}
                  >
                    {file.name}
                  </button>
                  <span className="shrink-0 text-[0.85rem] text-ink-soft">
                    <span className="capitalize">{file.label}</span>
                    {file.indicator !== undefined && ` (${formatPercent(file.indicator, 0)})`}
                  </span>
                </li>
              ))}
            </ul>
            {flaggedFiles.length > 10 && (
              <p className="mt-1 text-[0.85rem] text-ink-soft">
                +{flaggedFiles.length - 10} more flagged file{flaggedFiles.length - 10 === 1 ? '' : 's'} — expand the
                file list below to see them all.
              </p>
            )}
          </div>
        )}

        {topObservations.length > 0 && (
          <div>
            <p className="mb-1.5 font-semibold">Most common observations across the project</p>
            <ul className="space-y-1">
              {topObservations.map((observation) => (
                <li key={observation.category} className="flex items-baseline gap-2 text-[0.9rem]">
                  <span className="font-medium">{observation.category}</span>
                  <span className="text-ink-soft">
                    — in {observation.count} file{observation.count === 1 ? '' : 's'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-[0.85rem] text-ink-soft italic">
          This is a project-level roll-up of independent per-file signals, not a verdict. Open any file below —
          or a flagged one above — for its own detail.
        </p>
      </div>
    </Section>
  )
}

function LegendItem({ color, label, count, total }: { color: string; label: string; count: number; total: number }) {
  if (count === 0) return null
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden="true" className={`h-2.5 w-2.5 border border-ink/30 ${color}`} />
      {label} <span className="font-semibold">{count}</span>
      <span className="text-ink-soft">({formatPercent(count / total, 0)})</span>
    </span>
  )
}
