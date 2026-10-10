import { useEffect, useRef } from 'react'
import { monaco, monacoLanguageFor } from '../lib/monaco-setup'

interface CodeDiffViewProps {
  leftLabel: string
  rightLabel: string
  leftText: string
  rightText: string
  language: string
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

const SIDE_BY_SIDE_MIN_WIDTH = 640

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
      renderMarginRevertIcon: false,
      glyphMargin: false,
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
  }, [])

  useEffect(() => {
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
    <div className="overflow-hidden rounded-xl border-2 border-ink">
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
