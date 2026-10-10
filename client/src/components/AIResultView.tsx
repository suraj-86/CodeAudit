import type { AIAnalysisResult } from '../api'
import { formatPercent } from '../lib/format'

const LABEL_TONE = {
  low: 'bg-mint/40',
  medium: 'bg-marigold/40',
  high: 'bg-coral/40',
  unavailable: 'bg-transparent border-dashed border-ink/40 text-ink-soft',
} as const

export function AIResultView({ result }: { result: AIAnalysisResult }) {
  if (!result.available) {
    return (
      <div className="rounded-xl border-2 border-dashed border-ink/40 px-4 py-3 text-[0.92rem] text-ink-soft">
        AI-assisted analysis wasn't available for this run
        {result.error ? `: ${result.error}` : '.'}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full border-2 border-ink px-3 py-1 font-semibold capitalize ${LABEL_TONE[result.label]}`}>
          {result.label}
        </span>
        {result.indicator !== undefined && (
          <span className="text-[0.92rem] text-ink-soft">
            indicator {formatPercent(result.indicator, 0)}
            {result.confidence !== undefined && ` · confidence ${formatPercent(result.confidence, 0)}`}
          </span>
        )}
      </div>
      {result.observations.length > 0 && (
        <ul className="space-y-1.5">
          {result.observations.map((observation, index) => (
            <li key={index} className="rounded-r-lg border-l-4 border-sky bg-white py-1 pl-3 text-[0.92rem]">
              <span className="font-semibold">{observation.category}: </span>
              {observation.description}
            </li>
          ))}
        </ul>
      )}
      <p className="text-[0.85rem] text-ink-soft italic">{result.disclaimer}</p>
    </div>
  )
}
