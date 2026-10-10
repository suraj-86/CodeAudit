import { lazy, Suspense } from 'react'
import type { ComponentProps } from 'react'

const CodeDiffViewImpl = lazy(() =>
  import('./CodeDiffViewImpl').then((module) => ({ default: module.CodeDiffView })),
)

type CodeDiffViewProps = ComponentProps<typeof CodeDiffViewImpl>

function CodeDiffViewFallback({ height = 360 }: { height?: number }) {
  return (
    <div
      className="flex items-center justify-center rounded-xl border-2 border-ink bg-white text-ink-soft"
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
