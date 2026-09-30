import { formatPercent } from '../lib/format'

interface AdvancedThresholdProps {
  value: number | undefined
  defaultValue: number
  onChange: (value: number | undefined) => void
  disabled?: boolean
}

/** A tucked-away control for the structural-suspicion threshold. Backend default when untouched. */
export function AdvancedThreshold({ value, defaultValue, onChange, disabled }: AdvancedThresholdProps) {
  return (
    <details className="group">
      <summary className="cursor-pointer text-[0.9rem] font-semibold text-ink-soft select-none group-open:text-ink">
        Advanced: suspicion threshold
      </summary>
      <div className="mt-2 flex items-center gap-3">
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          disabled={disabled}
          value={value ?? defaultValue}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-48 accent-violet"
        />
        <span className="w-12 font-mono text-[0.9rem]">{formatPercent(value ?? defaultValue)}</span>
        {value !== undefined && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(undefined)}
            className="text-[0.85rem] underline text-ink-soft"
          >
            reset
          </button>
        )}
      </div>
    </details>
  )
}
