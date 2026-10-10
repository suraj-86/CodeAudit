const POINTS = [
  'Structural similarity does not prove who wrote the code.',
  'An AI indicator does not prove AI wrote the code.',
  'Passing tests says nothing about how similar two programs are.',
  'These are independent signals — there is no combined score.',
]

export function SignalsBanner() {
  return (
    <div className="rounded-2xl border-2 border-ink bg-ink px-4 py-3.5 text-white sm:px-5">
      <p className="font-display text-sm font-bold tracking-wide text-marigold uppercase">
        Read each signal on its own
      </p>
      <ul className="mt-2 grid gap-x-6 gap-y-1 text-[0.9rem] sm:grid-cols-2">
        {POINTS.map((point) => (
          <li key={point} className="flex gap-2">
            <span aria-hidden="true" className="text-marigold">
              ▸
            </span>
            {point}
          </li>
        ))}
      </ul>
    </div>
  )
}
