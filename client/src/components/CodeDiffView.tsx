import { lazy, Suspense } from 'react'
import type { ComponentProps } from 'react'

/*
 * Monaco is a large dependency (the diff/editor core plus per-language
 * grammars) that's only needed once a result with a reference exists —
 * never on first load of the home page or an empty form. Loading it via
 * React.lazy keeps it out of the main bundle entirely; it's fetched only
 * when a <CodeDiffView> is actually about to render.
 */
const CodeDiffViewImpl = lazy(() =>
  import('./CodeDiffViewImpl').then((module) => ({ default: module.CodeDiffView })),
)

type CodeDiffViewProps = ComponentProps<typeof CodeDiffViewImpl>

function CodeDiffViewFallback({ height = 360 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center border-2 border-ink bg-white text-ink-soft"
      style={{ height }}
    >
      Loading the code viewer…
    </div>
  )
}

export function CodeDiffView(props: CodeDiffViewProps) {
  return (
    <Suspense fallback={<CodeDiffViewFallback height={props.height} />}>
      <CodeDiffViewImpl {...props} />
    </Suspense>
  )
}
