import { Alert } from './ui/Alert'

interface WarningsListProps {
  warnings: string[]
}

export function WarningsList({ warnings }: WarningsListProps) {
  if (warnings.length === 0) return null
  return (
    <Alert tone="info" title="Some checks didn't run">
      <ul className="list-disc space-y-1 pl-5">
        {warnings.map((warning, index) => (
          <li key={index}>{warning}</li>
        ))}
      </ul>
    </Alert>
  )
}
