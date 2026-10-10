import { useState } from 'react'
import {
  differingIndexes,
  specimenParts,
  specimenStructure,
  BASE_STRUCTURE,
  type SpecimenOptions,
} from '../lib/specimen'
import { Toggle } from './ui/Toggle'
import { StructureStrip } from './StructureStrip'

const TOGGLES: Array<{ key: keyof SpecimenOptions; label: string; description: string }> = [
  { key: 'rename', label: 'Rename every identifier', description: 'average → mean, a → x, b → y' },
  { key: 'comments', label: 'Add comments', description: 'Comments never enter the structure at all' },
  { key: 'literal', label: 'Change a number', description: 'Divide by 3 instead of 2' },
  { key: 'operator', label: 'Change an operator', description: '− instead of +: this is a real structural change' },
]

export function RenameTestDemo() {
  const [options, setOptions] = useState<SpecimenOptions>({
    rename: false,
    comments: false,
    literal: false,
    operator: false,
  })

  const parts = specimenParts(options)
  const structure = specimenStructure(options)
  const changedCount = differingIndexes(BASE_STRUCTURE, structure).length
  const identical = changedCount === 0

  return (
    <section className="rounded-2xl border-2 border-ink bg-sheet p-5 shadow-block sm:p-7">
      <h2 className="font-display text-xl font-bold">Try to fool the structure check</h2>
      <p className="mt-1 max-w-prose text-ink-soft">
        Flip these on. Most of them change how the code looks but not its shape — watch the tiles below
        stay put. One of them is a genuine change, and exactly one tile will lift to show it.
      </p>

      <div className="mt-5 grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          {TOGGLES.map((toggle) => (
            <Toggle
              key={toggle.key}
              label={toggle.label}
              description={toggle.description}
              checked={options[toggle.key]}
              onChange={(checked) => setOptions((current) => ({ ...current, [toggle.key]: checked }))}
            />
          ))}
        </div>

        <div className="space-y-4">
          <pre className="overflow-x-auto rounded-xl border-2 border-ink bg-ink p-3 font-mono text-[0.85rem] leading-relaxed text-white">
            {parts.map((part, index) => (
              <span key={index} className={part.changed ? 'bg-marigold text-ink' : ''}>
                {part.text}
              </span>
            ))}
          </pre>

          <div>
            <p className="mb-1.5 text-[0.85rem] font-semibold text-ink-soft">Original structure</p>
            <StructureStrip sequence={BASE_STRUCTURE} label="Original structure" />
          </div>

          <div>
            <p className="mb-1.5 text-[0.85rem] font-semibold text-ink-soft">Your version's structure</p>
            <StructureStrip sequence={structure} against={BASE_STRUCTURE} label="Modified structure" />
          </div>

          <p
            className={`rounded-xl border-2 border-ink px-3 py-2 font-semibold ${
              identical ? 'bg-mint/40' : 'bg-coral/40'
            }`}
          >
            {identical
              ? 'Same structure — every tile lines up with the original.'
              : `${changedCount} tile${changedCount === 1 ? '' : 's'} differ — this would lower the similarity score.`}
          </p>
        </div>
      </div>
    </section>
  )
}
