import { useEffect, useRef } from 'react'
import { monaco, monacoLanguageFor } from '../lib/monaco-setup'

interface CodeDiffViewProps {
  leftLabel: string
  rightLabel: string
  leftText: string
  rightText: string
  language: string
  /** Roughly matches the content; grows a little for long files. */
  height?: number
}

const LIGHT_THEME_COLORS: monaco.editor.IStandaloneThemeData = {
  base: 'vs',
  inherit: true,
  rules: [],
  colors: {
    'editor.background': '#ffffff',
    'diffEditor.insertedTextBackground': '#1fcf9b33',
    'diffEditor.removedTextBackground': '#ff5a6e33',
    'diffEditor.insertedLineBackground': '#1fcf9b1a',
    'diffEditor.removedLineBackground': '#ff5a6e1a',
  },
}

let themeRegistered = false

/** Below this container width, side-by-side panes get too narrow to read. */
const SIDE_BY_SIDE_MIN_WIDTH = 640

/**
 * A read-only, side-by-side Monaco diff view. Nothing here is analysis —
 * it renders exactly the two texts it's given and highlights where they
 * differ character-by-character; the similarity verdict itself always
 * comes from the backend (see WorkflowResultView / BatchPage).
 */
export function CodeDiffView({
  leftLabel,
  rightLabel,
  leftText,
  rightText,
  language,
  height = 360,
}: CodeDiffViewProps) {
  const container = useRef<HTMLDivElement>(null)
  const editor = useRef<monaco.editor.IStandaloneDiffEditor | null>(null)

  useEffect(() => {
    if (!container.current) return

    if (!themeRegistered) {
      monaco.editor.defineTheme('codeaudit-diff', LIGHT_THEME_COLORS)
      themeRegistered = true
    }

    const instance = monaco.editor.createDiffEditor(container.current, {
      theme: 'codeaudit-diff',
      readOnly: true,
      // This is a viewer, not an editor: there's nothing to revert, so the
      // gutter's revert-arrow icons are both meaningless here and (since
      // the icon font isn't bundled — see Decision in docs) invisible
      // tofu boxes. Turning them off is correct for this use case either way.
      renderMarginRevertIcon: false,
      glyphMargin: false,
      // Side-by-side needs real width for each pane to be legible; below
      // that, Monaco's own inline ("unified") diff mode reads better. Set
      // from the container's actual size below, not the viewport's, since
      // this component can sit in a narrower column even on a wide screen.
      renderSideBySide: container.current.clientWidth >= SIDE_BY_SIDE_MIN_WIDTH,
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      fontSize: 13,
      fontFamily:
        '"Spline Sans Mono Variable", ui-monospace, "SF Mono", Menlo, Consolas, monospace',
      renderOverviewRuler: false,
      folding: false,
      wordWrap: 'on',
    })
    editor.current = instance

    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width
      if (width === undefined) return
      instance.updateOptions({ renderSideBySide: width >= SIDE_BY_SIDE_MIN_WIDTH })
    })
    resizeObserver.observe(container.current)

    return () => {
      resizeObserver.disconnect()
      instance.dispose()
      editor.current = null
    }
    // Only the mount/unmount lifecycle; text/language updates are handled
    // by the effect below via setModel, not by recreating the editor.
  }, [])

  useEffect(() => {
    // Effects within one component run in declaration order within the
    // same commit, so on the very first render the effect above has
    // already created `editor.current` by the time this one runs — no
    // extra "is it ready yet" state is needed to sequence the two.
    if (!editor.current) return
    const monacoLanguage = monacoLanguageFor(language)
    const originalModel = monaco.editor.createModel(leftText, monacoLanguage)
    const modifiedModel = monaco.editor.createModel(rightText, monacoLanguage)
    editor.current.setModel({ original: originalModel, modified: modifiedModel })

    return () => {
      originalModel.dispose()
      modifiedModel.dispose()
    }
  }, [leftText, rightText, language])

  return (
    <div className="border-2 border-ink">
      <div className="grid grid-cols-2 border-b-2 border-ink text-[0.85rem] font-semibold">
        <span className="truncate border-r-2 border-ink bg-coral/20 px-3 py-1.5" title={leftLabel}>
          {leftLabel}
        </span>
        <span className="truncate bg-mint/25 px-3 py-1.5" title={rightLabel}>
          {rightLabel}
        </span>
      </div>
      <div ref={container} style={{ height }} />
    </div>
  )
}
