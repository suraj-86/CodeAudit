import { useRef, useState, type DragEvent, type KeyboardEvent, type ReactNode } from 'react'

interface DropZoneProps {
  id: string
  label: string
  hint?: ReactNode
  accept: string[]
  multiple?: boolean
  disabled?: boolean
  onFiles: (files: File[]) => void
}

export function DropZone({ id, label, hint, accept, multiple = false, disabled = false, onFiles }: DropZoneProps) {
  const input = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  const open = () => {
    if (!disabled) input.current?.click()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      open()
    }
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setDragging(false)
    if (disabled) return
    const files = Array.from(event.dataTransfer.files)
    if (files.length > 0) onFiles(multiple ? files : files.slice(0, 1))
  }

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-disabled={disabled}
      aria-label={label}
      data-dragging={dragging}
      onClick={open}
      onKeyDown={onKeyDown}
      onDragEnter={(e) => {
        e.preventDefault()
        if (!disabled) setDragging(true)
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      className="group relative flex min-h-36 cursor-pointer flex-col justify-center gap-1 border-2 border-dashed border-ink/50 bg-white/70 px-8 py-6 transition-colors duration-150 hover:bg-white data-[dragging=true]:border-solid data-[dragging=true]:border-ink data-[dragging=true]:bg-marigold/25 aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
    >
      <span aria-hidden="true" className="pointer-events-none absolute top-2 left-2 h-4 w-4 border-t-2 border-l-2 border-ink transition-all duration-150 group-data-[dragging=true]:top-4 group-data-[dragging=true]:left-4" />
      <span aria-hidden="true" className="pointer-events-none absolute top-2 right-2 h-4 w-4 border-t-2 border-r-2 border-ink transition-all duration-150 group-data-[dragging=true]:top-4 group-data-[dragging=true]:right-4" />
      <span aria-hidden="true" className="pointer-events-none absolute bottom-2 left-2 h-4 w-4 border-b-2 border-l-2 border-ink transition-all duration-150 group-data-[dragging=true]:bottom-4 group-data-[dragging=true]:left-4" />
      <span aria-hidden="true" className="pointer-events-none absolute right-2 bottom-2 h-4 w-4 border-r-2 border-b-2 border-ink transition-all duration-150 group-data-[dragging=true]:right-4 group-data-[dragging=true]:bottom-4" />

      <span className="font-semibold">{dragging ? 'Let go to add it' : label}</span>
      {hint && <span className="text-[0.92rem] text-ink-soft">{hint}</span>}

      <input
        ref={input}
        id={id}
        type="file"
        tabIndex={-1}
        hidden
        multiple={multiple}
        accept={accept.join(',')}
        disabled={disabled}
        onChange={(event) => {
          const files = Array.from(event.target.files ?? [])
          event.target.value = ''
          if (files.length > 0) onFiles(files)
        }}
      />
    </div>
  )
}
