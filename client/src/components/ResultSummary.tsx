interface SummaryItem {
  label: string
  value: string
  tone?: 'neutral' | 'flag'
}

interface ResultSummaryProps {
  title: string
  items: SummaryItem[]
}

export function ResultSummary({ title, items }: ResultSummaryProps) {
  return (
    <div className="rounded-2xl border-2 border-ink bg-sheet px-4 py-3.5 shadow-block-sm sm:px-5">
      <p className="font-display text-sm font-bold">{title}</p>
      <dl className="mt-2.5 flex flex-wrap gap-x-7 gap-y-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-baseline gap-1.5">
            {item.tone === 'flag' && (
              <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-coral" />
            )}
            <div>
              <dt className="text-[0.75rem] tracking-wide text-ink-soft uppercase">{item.label}</dt>
              <dd
                className={`font-display text-lg font-bold ${item.tone === 'flag' ? 'text-[#c2263f]' : ''}`}
              >
                {item.value}
              </dd>
            </div>
          </div>
        ))}
      </dl>
    </div>
  )
}
