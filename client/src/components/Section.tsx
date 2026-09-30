import type { ReactNode } from 'react'

interface SectionProps {
  title: string
  description?: ReactNode
  children: ReactNode
  className?: string
}

export function Section({ title, description, children, className = '' }: SectionProps) {
  return (
    <section className={`border-2 border-ink bg-sheet p-5 shadow-block ${className}`}>
      <h2 className="font-display text-xl font-bold">{title}</h2>
      {description && <p className="mt-1 max-w-prose text-ink-soft">{description}</p>}
      <div className="mt-4">{children}</div>
    </section>
  )
}
