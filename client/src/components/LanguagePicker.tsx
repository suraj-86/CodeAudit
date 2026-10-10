import { useId } from 'react'
import type { LanguageInfo } from '../api'

interface LanguagePickerProps {
  languages: LanguageInfo[]
  value: string
  onChange: (id: string) => void
  legend?: string
  disabled?: boolean
}

export function LanguagePicker({ languages, value, onChange, legend = 'Language', disabled }: LanguagePickerProps) {
  const name = useId()
  return (
    <fieldset disabled={disabled}>
      <legend className="mb-2 font-semibold">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {languages.map((language) => (
          <label
            key={language.id}
            className="cursor-pointer rounded-full border-2 border-ink bg-white px-3.5 py-1.5 font-semibold transition-colors duration-100 hover:bg-marigold/50 has-checked:bg-ink has-checked:text-white has-checked:shadow-block-sm has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-violet has-disabled:opacity-45"
          >
            <input
              type="radio"
              name={name}
              value={language.id}
              checked={language.id === value}
              onChange={() => onChange(language.id)}
              className="sr-only"
            />
            {language.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
