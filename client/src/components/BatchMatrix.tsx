import type { BatchPairComparison } from '../api'
import { formatPercent } from '../lib/format'

interface BatchMatrixProps {
  submissions: Array<{ id: string; name: string }>
  comparisons: BatchPairComparison[]
  onSelectPair?: (pair: BatchPairComparison) => void
}

function cellFor(
  comparisons: BatchPairComparison[],
  a: string,
  b: string,
): BatchPairComparison | undefined {
  return comparisons.find(
    (c) => (c.firstId === a && c.secondId === b) || (c.firstId === b && c.secondId === a),
  )
}

function cellTone(cell: BatchPairComparison | undefined): string {
  if (!cell) return 'bg-white'
  if (cell.exactMatch) return 'bg-ink text-white'
  if (cell.structuralSimilarity === null) return 'bg-paper text-ink-soft'
  if (cell.structuralSuspicious) return 'bg-coral/70'
  const t = cell.structuralSimilarity
  if (t > 0.5) return 'bg-marigold/60'
  return 'bg-mint/25'
}

/** Every submission against every other, as a heat-mapped grid of tiles. */
export function BatchMatrix({ submissions, comparisons, onSelectPair }: BatchMatrixProps) {
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="w-28" />
            {submissions.map((s) => (
              <th
                key={s.id}
                className="max-w-16 truncate px-1 pb-1 text-left text-[0.78rem] font-semibold"
                title={s.name}
              >
                {s.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {submissions.map((row) => (
            <tr key={row.id}>
              <th
                className="max-w-28 truncate pr-2 text-right text-[0.78rem] font-semibold"
                title={row.name}
              >
                {row.name}
              </th>
              {submissions.map((col) => {
                if (row.id === col.id) {
                  return (
                    <td key={col.id} className="h-9 w-9 border border-ink/30 bg-grid">
                      <span className="sr-only">Same file</span>
                    </td>
                  )
                }
                const cell = cellFor(comparisons, row.id, col.id)
                return (
                  <td key={col.id} className="p-0">
                    <button
                      type="button"
                      disabled={!cell || !onSelectPair}
                      onClick={() => cell && onSelectPair?.(cell)}
                      title={
                        cell
                          ? `${row.name} vs ${col.name}: ${
                              cell.exactMatch
                                ? 'exact match'
                                : cell.structuralSimilarity === null
                                  ? 'structural comparison unavailable'
                                  : formatPercent(cell.structuralSimilarity)
                            }`
                          : undefined
                      }
                      className={`h-9 w-9 border border-ink/30 text-[0.75rem] font-bold transition-transform duration-100 not-disabled:hover:z-10 not-disabled:hover:scale-125 not-disabled:hover:border-2 not-disabled:hover:border-ink disabled:cursor-default ${cellTone(cell)}`}
                    >
                      {cell?.exactMatch
                        ? '='
                        : cell?.structuralSimilarity !== null && cell?.structuralSimilarity !== undefined
                          ? Math.round(cell.structuralSimilarity * 100)
                          : '–'}
                    </button>
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[0.85rem] text-ink-soft">
        “=” is a byte-for-byte exact match. Numbers are structural similarity (%). Click a cell for details.
      </p>
    </div>
  )
}
