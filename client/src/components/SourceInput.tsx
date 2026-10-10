import type { LanguageInfo, UploadLimits } from '../api'
import type { SourceDraft } from '../lib/drafts'
import { draftProblem, draftToFile } from '../lib/drafts'
import { useFilePrints } from '../hooks/useFilePrints'
import { useTextPrint } from '../hooks/useText'
import { DropZone } from './DropZone'
import { FileChip } from './FileChip'

interface SourceInputProps {
  id: string
  label: string
  hint?: string
  draft: SourceDraft
  onChange: (draft: SourceDraft) => void
  language: LanguageInfo
  limits: UploadLimits
  optional?: boolean
  disabled?: boolean
}

export function SourceInput({
  id,
  label,
  hint,
  draft,
  onChange,
  language,
  limits,
  optional,
  disabled,
}: SourceInputProps) {
  const filePrints = useFilePrints(draft.file ? [draft.file] : [])
  const pastePrint = useTextPrint(draft.mode === 'paste' ? draft.text : '')
  const problem = draftProblem(draft, language, limits)
  const previewFile = draftToFile(draft, language)

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="font-semibold" id={`${id}-label`}>
          {label}
          {optional && <span className="ml-1 font-normal text-ink-soft">(optional)</span>}
        </span>
        <div className="flex overflow-hidden rounded-full border-2 border-ink text-[0.85rem] font-semibold">
          {(['upload', 'paste'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              disabled={disabled}
              aria-pressed={draft.mode === mode}
              onClick={() => onChange({ ...draft, mode })}
              className={`px-2.5 py-1 capitalize disabled:opacity-45 ${
                draft.mode === mode ? 'bg-ink text-white' : 'bg-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {draft.mode === 'upload' ? (
        draft.file ? (
          <FileChip
            file={draft.file}
            hash={filePrints.get(draft.file) ?? null}
            problem={problem}
            disabled={disabled}
            onRemove={() => onChange({ ...draft, file: null })}
          />
        ) : (
          <DropZone
            id={id}
            label={`Drop a ${language.label} file here, or click to choose`}
            hint={hint}
            accept={language.extensions}
            disabled={disabled}
            onFiles={(files) => onChange({ ...draft, file: files[0] ?? null })}
          />
        )
      ) : (
        <div className="space-y-1.5">
          <textarea
            aria-labelledby={`${id}-label`}
            disabled={disabled}
            spellCheck={false}
            rows={8}
            placeholder={`Paste ${language.label} code here…`}
            value={draft.text}
            onChange={(event) => onChange({ ...draft, text: event.target.value })}
            className="w-full resize-y rounded-xl border-2 border-ink bg-white p-3 font-mono text-[0.9rem] disabled:opacity-45"
          />
          <div className="flex items-center justify-between text-[0.85rem] text-ink-soft">
            <span>{previewFile ? `${previewFile.size} bytes` : 'Nothing pasted yet'}</span>
            {pastePrint && draft.text.trim() && <span className="font-mono">{pastePrint.slice(0, 8)}</span>}
          </div>
          {problem && <p className="font-medium text-[#c2263f]">{problem}</p>}
        </div>
      )}
    </div>
  )
}
