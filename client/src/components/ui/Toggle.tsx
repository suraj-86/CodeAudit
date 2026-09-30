import { useId } from 'react'

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: string
  disabled?: boolean
}

export function Toggle({ checked, onChange, label, description, disabled }: ToggleProps) {
  const id = useId()
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-describedby={description ? `${id}-d` : undefined}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-7 w-12 shrink-0 rounded-full border-2 border-ink transition-colors duration-150 disabled:opacity-45 ${
          checked ? 'bg-mint' : 'bg-white'
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full border-2 border-ink bg-ink transition-transform duration-150 ${
            checked ? 'translate-x-5' : ''
          }`}
        />
      </button>
      <label htmlFor={id} className="cursor-pointer">
        <span className="block font-semibold">{label}</span>
        {description && (
          <span id={`${id}-d`} className="block text-[0.92rem] text-ink-soft">
            {description}
          </span>
        )}
      </label>
    </div>
  )
}
