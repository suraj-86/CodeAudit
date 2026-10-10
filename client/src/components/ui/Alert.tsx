import type { ReactNode } from 'react'

export type AlertTone = 'info' | 'warning' | 'error' | 'success'

const stripe: Record<AlertTone, string> = {
  info: 'bg-sky',
  warning: 'bg-marigold',
  error: 'bg-coral',
  success: 'bg-mint',
}

interface AlertProps {
  tone: AlertTone
  title?: string
  children?: ReactNode
  actions?: ReactNode
}

/** A left-striped note. Errors are announced immediately; the rest politely. */
export function Alert({ tone, title, children, actions }: AlertProps) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className="flex overflow-hidden rounded-xl border-2 border-ink bg-white"
    >
      <div className={`w-3 shrink-0 ${stripe[tone]}`} aria-hidden="true" />
      <div className="flex-1 space-y-1 px-4 py-3">
        {title && <p className="font-semibold">{title}</p>}
        {children && <div className="text-[0.95rem] text-ink-soft">{children}</div>}
        {actions && <div className="pt-2">{actions}</div>}
      </div>
    </div>
  )
}
