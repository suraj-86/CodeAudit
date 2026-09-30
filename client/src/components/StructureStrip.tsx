import { colorForNodeType } from '../lib/print'

interface StructureStripProps {
  sequence: readonly string[]
  /** When given, nodes that differ from this sequence are lifted and outlined. */
  against?: readonly string[]
  label: string
}

const OPERATOR_GLYPH = /^OPERATOR:(.+)$/

/** One tile per syntax node, coloured by node type. Operators show their symbol. */
export function StructureStrip({ sequence, against, label }: StructureStripProps) {
  const differing = against
    ? sequence.filter((type, i) => type !== against[i]).length + Math.max(0, against.length - sequence.length)
    : 0

  return (
    <div
      role="img"
      aria-label={`${label}: ${sequence.length} nodes${against ? `, ${differing} differ` : ''}`}
      className="flex flex-wrap gap-1"
    >
      {sequence.map((type, i) => {
        const glyph = OPERATOR_GLYPH.exec(type)?.[1]
        const differs = against ? type !== against[i] : false
        return (
          <span
            key={i}
            title={type.replace('OPERATOR:', 'operator ')}
            className={`grid h-6 w-6 place-items-center border-2 border-ink font-mono text-[12px] leading-none font-bold text-ink transition-transform duration-200 ${
              differs ? '-translate-y-1.5 ring-2 ring-coral ring-offset-1' : ''
            }`}
            style={{ backgroundColor: colorForNodeType(type) }}
          >
            {glyph}
          </span>
        )
      })}
    </div>
  )
}
