import { useMemo, useRef, useState } from 'react'
import { runAiAnalysis, ApiError, isAbortError, type AIAnalysisResult } from '../api'
import { useLanguages } from '../hooks/useLanguages'
import {
  allExtensions,
  computeProjectOverview,
  groupItemsBySource,
  groupStatusSummary,
  keyForFile,
  languageForExtension,
  type AiBatchItem,
  type AiZipGroup,
} from '../lib/ai-batch'
import { extractFilesFromZip, extensionOf, MAX_ZIP_FILES } from '../lib/zip'
import { formatBytes } from '../lib/format'
import { Section } from '../components/Section'
import { DropZone } from '../components/DropZone'
import { Button } from '../components/ui/Button'
import { Alert } from '../components/ui/Alert'
import { AIResultView } from '../components/AIResultView'
import { AiProjectOverviewCard } from '../components/AiProjectOverviewCard'

const AI_CAPABLE = 'ai'
// The AI route allows 10 requests/minute server-side (see server/src/config/rate-limit.ts).
// A project with more files than that will hit a 429 partway through; rather than
// giving up, the run loop waits out the window and resumes automatically.
const AI_REQUESTS_PER_MINUTE = 10
const MAX_RATE_LIMIT_RETRIES = 30

export function AiAnalysisPage() {
  const { state: languagesState } = useLanguages()
  const allLanguages = languagesState.status === 'ready' ? languagesState.data.languages : []
  const languages = allLanguages.filter((l) => l.capabilities[AI_CAPABLE])
  const limits = languagesState.status === 'ready' ? languagesState.data.limits : null
  const extensions = allExtensions(languages)

  const [items, setItems] = useState<AiBatchItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [expandedZips, setExpandedZips] = useState<Set<string>>(new Set())
  const [notices, setNotices] = useState<string[]>([])
  const [extracting, setExtracting] = useState(false)
  const [running, setRunning] = useState(false)
  const [cooldown, setCooldown] = useState<{ seconds: number; fileName: string } | null>(null)
  const cancelled = useRef(false)

  const addFiles = async (incoming: File[]) => {
    setNotices([])
    setExtracting(true)

    const toAdd: Array<{ file: File; source: AiBatchItem['source'] }> = []
    const newNotices: string[] = []

    try {
      for (const file of incoming) {
        if (file.name.toLowerCase().endsWith('.zip')) {
          const zipId = crypto.randomUUID()
          const extracted = await extractFilesFromZip(file, (path) =>
            extensions.includes(extensionOf(path)),
          )
          if (extracted.matchedEntries === 0) {
            newNotices.push(
              `No supported source files were found inside "${file.name}".`,
            )
          } else {
            if (extracted.truncated) {
              newNotices.push(
                `"${file.name}" contains ${extracted.matchedEntries} matching files; only the first ${MAX_ZIP_FILES} were loaded.`,
              )
            }
            for (const extractedFile of extracted.files) {
              toAdd.push({ file: extractedFile, source: { kind: 'zip', zipId, zipName: file.name } })
            }
            // A freshly-added zip starts expanded only if it's small enough to skim at a glance.
            if (extracted.files.length <= 8) {
              setExpandedZips((current) => new Set(current).add(zipId))
            }
          }
        } else if (extensions.includes(extensionOf(file.name))) {
          toAdd.push({ file, source: { kind: 'file' } })
        } else {
          newNotices.push(`${file.name} (unsupported file type)`)
        }
      }
    } finally {
      setExtracting(false)
    }

    setItems((current) => {
      const existingKeys = new Set(current.map((item) => keyForFile(item.file)))
      const fresh = toAdd
        .filter(({ file }) => !existingKeys.has(keyForFile(file)))
        .map(({ file, source }): AiBatchItem | null => {
          if (limits && file.size > limits.maxFileSizeBytes) {
            newNotices.push(`${file.name} (too large — ${formatBytes(file.size)})`)
            return null
          }
          const language = languageForExtension(languages, extensionOf(file.name))
          if (!language) return null
          return {
            id: crypto.randomUUID(),
            file,
            language: language.id,
            status: 'pending',
            source,
          }
        })
        .filter((item): item is AiBatchItem => item !== null)
      return [...current, ...fresh]
    })

    setNotices(newNotices)
  }

  const removeItem = (id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
    if (selectedId === id) setSelectedId(null)
  }

  const removeGroup = (zipId: string) => {
    setItems((current) => current.filter((item) => item.source.kind !== 'zip' || item.source.zipId !== zipId))
    setExpandedZips((current) => {
      const next = new Set(current)
      next.delete(zipId)
      return next
    })
  }

  const toggleZip = (zipId: string) => {
    setExpandedZips((current) => {
      const next = new Set(current)
      if (next.has(zipId)) next.delete(zipId)
      else next.add(zipId)
      return next
    })
  }

  const selectFile = (id: string) => {
    setSelectedId(id)
    const item = items.find((it) => it.id === id)
    if (item && item.source.kind === 'zip') {
      const zipId = item.source.zipId
      setExpandedZips((current) => new Set(current).add(zipId))
    }
  }

  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

  const waitOutCooldown = async (seconds: number, fileName: string) => {
    for (let remaining = seconds; remaining > 0; remaining -= 1) {
      if (cancelled.current) return
      setCooldown({ seconds: remaining, fileName })
      await sleep(1000)
    }
    setCooldown(null)
  }

  const run = async () => {
    cancelled.current = false
    setRunning(true)
    setCooldown(null)

    const queue = items.filter((item) => item.status !== 'done')

    for (const queuedItem of queue) {
      if (cancelled.current) break

      let attempt = 0
      let succeeded = false

      while (!succeeded && !cancelled.current) {
        attempt += 1
        setItems((current) =>
          current.map((it) => (it.id === queuedItem.id ? { ...it, status: 'running' } : it)),
        )

        try {
          const source = await queuedItem.file.text()
          const result: AIAnalysisResult = await runAiAnalysis({
            language: queuedItem.language,
            source,
          })
          setItems((current) =>
            current.map((it) => (it.id === queuedItem.id ? { ...it, status: 'done', result } : it)),
          )
          succeeded = true
        } catch (error) {
          if (isAbortError(error)) {
            cancelled.current = true
            break
          }

          const isRateLimited = error instanceof ApiError && error.code === 'RATE_LIMITED'
          if (isRateLimited && attempt <= MAX_RATE_LIMIT_RETRIES) {
            const wait = (error as ApiError).retryAfterSeconds ?? 60
            await waitOutCooldown(wait, queuedItem.file.name)
            continue
          }

          setItems((current) =>
            current.map((it) => (it.id === queuedItem.id ? { ...it, status: 'error', error } : it)),
          )
          break
        }
      }
    }

    setCooldown(null)
    setRunning(false)
  }

  const cancelRun = () => {
    cancelled.current = true
    setCooldown(null)
  }

  const startOver = () => {
    cancelled.current = true
    setItems([])
    setSelectedId(null)
    setExpandedZips(new Set())
    setNotices([])
  }

  const selected = items.find((item) => item.id === selectedId) ?? null
  const doneCount = items.filter((item) => item.status === 'done').length
  const errorCount = items.filter((item) => item.status === 'error').length
  const canRun = items.length > 0 && !running && !extracting

  const overview = useMemo(() => computeProjectOverview(items), [items])
  const { zipGroups, looseItems } = useMemo(() => groupItemsBySource(items), [items])
  const showOverview = items.length > 1 && doneCount + errorCount > 0

  const estimatedMinutes = Math.ceil(items.length / AI_REQUESTS_PER_MINUTE)

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

      {showOverview && <AiProjectOverviewCard overview={overview} onSelectFile={selectFile} />}

      <Section title="Files">
        <div className="space-y-4">
          <DropZone
            id="ai-files"
            label="Drop source files or a project .zip here, or click to choose"
            hint={`Supported: ${languages.map((l) => l.label).join(', ')} — or a .zip containing them (up to ${MAX_ZIP_FILES} files per zip)`}
            accept={[...extensions, '.zip']}
            multiple
            disabled={running || extracting}
            onFiles={(files) => void addFiles(files)}
          />

          {extracting && <p className="text-[0.9rem] text-ink-soft">Reading archive…</p>}

          {notices.length > 0 && (
            <Alert tone="warning" title="Heads up">
              <ul className="space-y-0.5">
                {notices.map((notice, index) => (
                  <li key={index}>{notice}</li>
                ))}
              </ul>
            </Alert>
          )}

          {(zipGroups.length > 0 || looseItems.length > 0) && (
            <div className="space-y-2">
              {zipGroups.map((group) => (
                <AiZipGroupRow
                  key={group.zipId}
                  group={group}
                  expanded={expandedZips.has(group.zipId)}
                  onToggle={() => toggleZip(group.zipId)}
                  onRemoveGroup={running ? undefined : () => removeGroup(group.zipId)}
                  selectedId={selectedId}
                  onSelectFile={selectFile}
                  onRemoveFile={running ? undefined : removeItem}
                />
              ))}

              {looseItems.length > 0 && (
                <ul className="space-y-1.5">
                  {looseItems.map((item) => (
                    <li key={item.id}>
                      <AiFileRow
                        item={item}
                        selected={item.id === selectedId}
                        onSelect={() => selectFile(item.id)}
                        onRemove={running ? undefined : () => removeItem(item.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!running && items.length > AI_REQUESTS_PER_MINUTE && (
            <p className="text-[0.85rem] text-ink-soft">
              The server allows {AI_REQUESTS_PER_MINUTE} AI requests per minute, so {items.length} files will take
              roughly {estimatedMinutes} minute{estimatedMinutes === 1 ? '' : 's'} — CodeAudit waits out the limit
              and resumes automatically rather than giving up partway through.
            </p>
          )}

          {cooldown && (
            <Alert tone="warning" title="Pausing for the server's rate limit">
              Resuming in{' '}
              <span className="font-mono font-semibold tabular-nums">{cooldown.seconds}s</span> — next up:{' '}
              {cooldown.fileName}
            </Alert>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void run()} disabled={!canRun}>
              {running
                ? `Analyzing… (${doneCount + errorCount}/${items.length})`
                : `Run AI analysis on ${items.length || 0} file${items.length === 1 ? '' : 's'}`}
            </Button>
            {running && (
              <Button variant="secondary" onClick={cancelRun}>
                Stop
              </Button>
            )}
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

function AiZipGroupRow({
  group,
  expanded,
  onToggle,
  onRemoveGroup,
  selectedId,
  onSelectFile,
  onRemoveFile,
}: {
  group: AiZipGroup
  expanded: boolean
  onToggle: () => void
  onRemoveGroup?: () => void
  selectedId: string | null
  onSelectFile: (id: string) => void
  onRemoveFile?: (id: string) => void
}) {
  const summary = groupStatusSummary(group.items)
  const finished = summary.done + summary.error >= summary.total

  return (
    <div className="border-2 border-ink bg-white">
      <div className="flex items-center gap-3 p-2 pr-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-3 text-left"
        >
          <span
            aria-hidden="true"
            className={`shrink-0 font-mono text-sm transition-transform duration-150 ${expanded ? 'rotate-90' : ''}`}
          >
            ▸
          </span>
          <span aria-hidden="true" className="shrink-0 border-2 border-ink bg-marigold/40 px-1.5 py-0.5 text-[0.75rem] font-bold">
            ZIP
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold" title={group.zipName}>
              {group.zipName}
            </span>
            <span className="block text-[0.85rem] text-ink-soft">
              {group.items.length} file{group.items.length === 1 ? '' : 's'}
              {summary.done + summary.error > 0 &&
                ` · ${summary.done + summary.error}/${summary.total} ${finished ? 'analyzed' : 'processed'}`}
              {summary.error > 0 && `, ${summary.error} failed`}
            </span>
          </span>
        </button>
        {onRemoveGroup && (
          <button
            type="button"
            onClick={onRemoveGroup}
            aria-label={`Remove all files from ${group.zipName}`}
            className="grid h-8 w-8 shrink-0 place-items-center border-2 border-ink bg-white text-lg leading-none hover:bg-coral"
          >
            ×
          </button>
        )}
      </div>

      {expanded && (
        <ul className="space-y-1.5 border-t-2 border-ink/20 bg-paper/50 p-2">
          {group.items.map((item) => (
            <li key={item.id}>
              <AiFileRow
                item={item}
                selected={item.id === selectedId}
                onSelect={() => onSelectFile(item.id)}
                onRemove={onRemoveFile ? () => onRemoveFile(item.id) : undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
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
