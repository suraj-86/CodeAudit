import { formatBytes } from '../lib/format'
import { shortHash } from '../lib/print'
import { FilePrint } from './FilePrint'

interface FileChipProps {
  file: File
  hash: string | null
  problem?: string | null
  twins?: string[]
  onRemove?: () => void
  disabled?: boolean
}

export function FileChip({ file, hash, problem, twins = [], onRemove, disabled }: FileChipProps) {
  return (
    <div
      className={`flex items-center gap-3 border-2 bg-white p-2 pr-3 ${
        problem ? 'border-coral' : 'border-ink'
      }`}
    >
      <FilePrint hash={hash} size={48} />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold" title={file.name}>
          {file.name}
        </p>
        <p className="text-[0.85rem] text-ink-soft">
          {formatBytes(file.size)}
          {hash && <span className="font-mono"> {shortHash(hash)}</span>}
        </p>
        {problem && <p className="text-[0.9rem] font-medium text-[#c2263f]">{problem}</p>}
        {twins.length > 0 && (
          <p className="mt-0.5 inline-block bg-marigold px-1.5 text-[0.85rem] font-semibold">
            Same fingerprint as {twins.join(', ')}
          </p>
        )}
      </div>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          aria-label={`Remove ${file.name}`}
          className="grid h-8 w-8 shrink-0 place-items-center border-2 border-ink bg-white text-lg leading-none not-disabled:hover:bg-coral disabled:opacity-45"
        >
          ×
        </button>
      )}
    </div>
  )
}
