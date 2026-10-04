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
    <div className="border-2 border-ink bg-sheet px-4 py-3 shadow-block-sm sm:px-5">
      <p className="font-display text-sm font-bold">{title}</p>
      <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
        {items.map((item) => (
          <div key={item.label}>
            <dt className="text-[0.78rem] text-ink-soft uppercase">{item.label}</dt>
            <dd
              className={`font-semibold ${item.tone === 'flag' ? 'text-[#c2263f]' : ''}`}
            >
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}
