import type { CapabilityKey, LanguageInfo } from '../api'
import { CAPABILITY_HELP, CAPABILITY_LABELS, capabilitySentence } from '../lib/capabilities'

interface CapabilityChipsProps {
  language: LanguageInfo
  keys: CapabilityKey[]
}

/** Shows, for the chosen language, which checks will run and which can't yet. */
export function CapabilityChips({ language, keys }: CapabilityChipsProps) {
  return (
    <div className="space-y-2">
      <ul className="flex flex-wrap gap-1.5" aria-label={`Checks available for ${language.label}`}>
        {keys.map((key) => {
          const on = language.capabilities[key]
          return (
            <li
              key={key}
              title={CAPABILITY_HELP[key]}
              className={`flex items-center gap-1.5 border-2 px-2 py-0.5 text-[0.88rem] font-semibold ${
                on
                  ? 'border-ink bg-mint/35'
                  : 'border-dashed border-ink/40 bg-transparent text-ink-soft'
              }`}
            >
              <span
                aria-hidden="true"
                className={`h-2.5 w-2.5 border-2 ${on ? 'border-ink bg-ink' : 'border-ink/40'}`}
              />
              {CAPABILITY_LABELS[key]}
              <span className="sr-only">{on ? ' is available' : ' is not available yet'}</span>
            </li>
          )
        })}
      </ul>
      <p className="text-[0.92rem] text-ink-soft">{capabilitySentence(language, keys)}</p>
    </div>
  )
}
