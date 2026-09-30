interface ScanningLoaderProps {
  label: string
}

/** A loading state shaped like a document being scanned, not a spinner. */
export function ScanningLoader({ label }: ScanningLoaderProps) {
  return (
    <div role="status" className="flex items-center gap-4 border-2 border-ink bg-white px-5 py-4">
      <div className="relative h-12 w-10 shrink-0 overflow-hidden border-2 border-ink bg-paper">
        <div className="absolute inset-x-0 top-1.5 h-0.5 bg-ink/25" />
        <div className="absolute inset-x-0 top-3.5 h-0.5 bg-ink/25" />
        <div className="absolute inset-x-0 top-5.5 h-0.5 bg-ink/25" />
        <div className="absolute inset-x-0 top-7.5 h-0.5 bg-ink/25" />
        <div className="absolute inset-y-0 left-0 w-1/4 bg-violet/70 animate-scan" />
      </div>
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-[0.9rem] text-ink-soft">This usually takes a few seconds.</p>
      </div>
    </div>
  )
}
