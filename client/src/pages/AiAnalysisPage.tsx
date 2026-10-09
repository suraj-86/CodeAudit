import { useRef, useState } from 'react'
import { runAiAnalysis, ApiError, isAbortError, type AIAnalysisResult } from '../api'
import { useLanguages } from '../hooks/useLanguages'
import { allExtensions, keyForFile, languageForExtension, type AiBatchItem } from '../lib/ai-batch'
import { extractFilesFromZip, extensionOf } from '../lib/zip'
import { formatBytes } from '../lib/format'
import { Section } from '../components/Section'
import { DropZone } from '../components/DropZone'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { AIResultView } from '../components/AIResultView'

const AI_CAPABLE = 'ai'

export function AiAnalysisPage() {
  const { state: languagesState } = useLanguages()
  const allLanguages = languagesState.status === 'ready' ? languagesState.data.languages : []
  const languages = allLanguages.filter((l) => l.capabilities[AI_CAPABLE])
  const limits = languagesState.status === 'ready' ? languagesState.data.limits : null
  const extensions = allExtensions(languages)

  const [items, setItems] = useState<AiBatchItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [skipped, setSkipped] = useState<string[]>([])
  const [extracting, setExtracting] = useState(false)
  const [running, setRunning] = useState(false)
  const cancelled = useRef(false)

  const addFiles = async (incoming: File[]) => {
    setSkipped([])
    setExtracting(true)

    const toAdd: File[] = []
    const newlySkipped: string[] = []

    try {
      for (const file of incoming) {
        if (file.name.toLowerCase().endsWith('.zip')) {
          const extracted = await extractFilesFromZip(file, (path) =>
            extensions.includes(extensionOf(path)),
          )
          if (extracted.length === 0) {
            newlySkipped.push(`${file.name} (no supported source files found inside)`)
          } else {
            toAdd.push(...extracted)
          }
        } else if (extensions.includes(extensionOf(file.name))) {
          toAdd.push(file)
        } else {
          newlySkipped.push(file.name)
        }
      }
    } finally {
      setExtracting(false)
    }

    setSkipped(newlySkipped)

    setItems((current) => {
      const existingKeys = new Set(current.map((item) => keyForFile(item.file)))
      const fresh = toAdd
        .filter((file) => !existingKeys.has(keyForFile(file)))
        .map((file): AiBatchItem | null => {
          const language = languageForExtension(languages, extensionOf(file.name))
          if (!language) return null
          return {
            id: crypto.randomUUID(),
            file,
            language: language.id,
            status: 'pending',
          }
        })
        .filter((item): item is AiBatchItem => item !== null)
      return [...current, ...fresh]
    })
  }

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const run = async () => {
    cancelled.current = false
    setRunning(true)

    for (const item of items) {
      if (cancelled.current) break
      if (item.status === 'done') continue

      setItems((current) =>
        current.map((it) => (it.id === item.id ? { ...it, status: 'running' } : it)),
      )

      try {
        const source = await item.file.text()
        const result: AIAnalysisResult = await runAiAnalysis({ language: item.language, source })
        setItems((current) =>
          current.map((it) => (it.id === item.id ? { ...it, status: 'done', result } : it)),
        )
      } catch (error) {
        if (isAbortError(error)) break
        setItems((current) =>
          current.map((it) => (it.id === item.id ? { ...it, status: 'error', error } : it)),
        )
        // A rate limit means every remaining file will fail the same way; stop here
        // instead of burning through them one by one.
        if (error instanceof ApiError && error.code === 'RATE_LIMITED') break
      }
    }

    setRunning(false)
  }

  const startOver = () => {
    cancelled.current = true
    setItems([])
    setSelectedId(null)
    setSkipped([])
  }

  const selected = items.find((item) => item.id === selectedId) ?? null
  const doneCount = items.filter((item) => item.status === 'done').length
  const errorCount = items.filter((item) => item.status === 'error').length
  const canRun = items.length > 0 && !running && !extracting

  if (!limits) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold">AI analysis</h1>
        <p className="mt-1 max-w-prose text-ink-soft">
          Upload one or more source files, or a zip of a whole project, and CodeAudit runs
          AI-assisted analysis on every file inside. This is an independent signal, not a verdict.
        </p>
      </div>

      <Section title="Files">
        <div className="space-y-4">
          <DropZone
            id="ai-files"
            label="Drop source files or a project .zip here, or click to choose"
            hint={`Supported: ${languages.map((l) => l.label).join(', ')} — or a .zip containing them`}
            accept={[...extensions, '.zip']}
            multiple
            disabled={running || extracting}
            onFiles={(files) => void addFiles(files)}
          />

          {extracting && <p className="text-[0.9rem] text-ink-soft">Reading archive…</p>}

          {skipped.length > 0 && (
            <Alert tone="warning" title="Some files were skipped">
              {skipped.join(', ')}
            </Alert>
          )}

          {items.length > 0 && (
            <ul className="space-y-1.5">
              {items.map((item) => (
                <li key={item.id}>
                  <AiFileRow
                    item={item}
                    selected={item.id === selectedId}
                    onSelect={() => setSelectedId(item.id)}
                    onRemove={running ? undefined : () => removeItem(item.id)}
                  />
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void run()} disabled={!canRun}>
              {running
                ? `Analyzing… (${doneCount + errorCount}/${items.length})`
                : `Run AI analysis on ${items.length || 0} file${items.length === 1 ? '' : 's'}`}
            </Button>
            {items.length > 0 && !running && (
              <Button variant="secondary" onClick={startOver}>
                Start over
              </Button>
            )}
            {!running && items.length > 0 && (doneCount > 0 || errorCount > 0) && (
              <span className="text-[0.9rem] text-ink-soft">
                {doneCount} analyzed{errorCount > 0 ? `, ${errorCount} failed` : ''}
              </span>
            )}
          </div>
        </div>
      </Section>

      {selected && (
        <Section title={selected.file.name}>
          {selected.status === 'done' && selected.result ? (
            <AIResultView result={selected.result} />
          ) : selected.status === 'error' ? (
            <Alert tone="error" title="This file couldn't be analyzed">
              {selected.error instanceof Error ? selected.error.message : 'An unexpected error occurred.'}
            </Alert>
          ) : (
            <p className="text-ink-soft">Not analyzed yet.</p>
          )}
        </Section>
      )}
    </div>
  )
}

const STATUS_COPY: Record<AiBatchItem['status'], string> = {
  pending: 'Not analyzed yet',
  running: 'Analyzing…',
  done: 'Done',
  error: 'Failed',
}

const STATUS_DOT: Record<AiBatchItem['status'], string> = {
  pending: 'bg-ink-soft',
  running: 'bg-sky animate-blink',
  done: 'bg-mint',
  error: 'bg-coral',
}

function AiFileRow({
  item,
  selected,
  onSelect,
  onRemove,
}: {
  item: AiBatchItem
  selected: boolean
  onSelect: () => void
  onRemove?: () => void
}) {
  return (
    <div
      className={`flex items-center gap-3 border-2 bg-white p-2 pr-3 ${
        selected ? 'border-violet' : 'border-ink'
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
      >
        <span aria-hidden="true" className={`h-2.5 w-2.5 shrink-0 rounded-full ${STATUS_DOT[item.status]}`} />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold" title={item.file.name}>
            {item.file.name}
          </span>
          <span className="block text-[0.85rem] text-ink-soft">
            {formatBytes(item.file.size)} · {item.language} ·{' '}
            {item.status === 'done' && item.result?.available
              ? `${item.result.label} risk`
              : STATUS_COPY[item.status]}
          </span>
        </span>
      </button>
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove ${item.file.name}`}
          className="grid h-8 w-8 shrink-0 place-items-center border-2 border-ink bg-white text-lg leading-none hover:bg-coral"
        >
          ×
        </button>
      )}
    </div>
  )
}
