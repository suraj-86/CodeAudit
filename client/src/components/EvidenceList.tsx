interface EvidenceListProps {
  evidence: Array<{ category: string; description: string }>
}

export function EvidenceList({ evidence }: EvidenceListProps) {
  if (evidence.length === 0) return null
  return (
    <ul className="space-y-1.5">
      {evidence.map((item, index) => (
        <li key={index} className="flex gap-2 text-[0.92rem]">
          <span className="mt-0.5 shrink-0 border border-ink bg-marigold px-1.5 text-[0.78rem] font-bold">
            {item.category}
          </span>
          <span>{item.description}</span>
        </li>
      ))}
    </ul>
  )
}
