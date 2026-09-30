import { useServerStatus } from '../hooks/useServerStatus'

const COPY = {
  checking: { text: 'Checking server…', dot: 'bg-ink-soft animate-blink' },
  online: { text: 'Server online', dot: 'bg-mint' },
  offline: { text: 'Server unreachable', dot: 'bg-coral' },
} as const

export function ServerStatusBadge() {
  const { status, recheck } = useServerStatus()
  const copy = COPY[status]

  return (
    <button
      type="button"
      onClick={recheck}
      title="Click to check again"
      className="flex items-center gap-1.5 border-2 border-ink bg-white px-2.5 py-1 text-[0.85rem] font-semibold"
    >
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${copy.dot}`} />
      {copy.text}
    </button>
  )
}
