import { formatPercent } from '../lib/format'

interface SimilarityDialProps {
  similarity: number
  threshold: number
  suspicious: boolean
}

/** A stamped-percentage dial: fill sweeps to the score, threshold marked as a tick. */
export function SimilarityDial({ similarity, threshold, suspicious }: SimilarityDialProps) {
  const angle = similarity * 360
  const thresholdAngle = threshold * 360
  const tone = suspicious ? '#ff5a6e' : '#1fcf9b'

  return (
    <div className="flex items-center gap-4">
      <div
        role="img"
        aria-label={`Structural similarity ${formatPercent(similarity)}, threshold ${formatPercent(threshold)}`}
        className="relative grid h-24 w-24 shrink-0 place-items-center rounded-full border-2 border-ink"
        style={{
          background: `conic-gradient(${tone} ${angle}deg, #ffffff ${angle}deg)`,
        }}
      >
        <div
          aria-hidden="true"
          className="absolute top-1/2 left-1/2 h-full w-0.5 -translate-x-1/2 -translate-y-1/2 bg-ink/70"
          style={{ transform: `translate(-50%, -50%) rotate(${thresholdAngle}deg)` }}
        />
        <div className="grid h-16 w-16 place-items-center rounded-full border-2 border-ink bg-white text-center">
          <span className="font-display text-lg leading-none font-bold">{formatPercent(similarity)}</span>
        </div>
      </div>
      <p className="max-w-52 text-[0.92rem] text-ink-soft">
        Flagged as suspicious once similarity passes the marked threshold ({formatPercent(threshold)}). This one is{' '}
        <span className="font-semibold text-ink">{suspicious ? 'over the line' : 'under the line'}</span>.
      </p>
    </div>
  )
}
