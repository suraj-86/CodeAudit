/*
 * Self-hosted Monaco: no CDN, so the diff viewer works offline and never
 * sends source code anywhere but the browser's own worker threads. This
 * imports only the editor core plus syntax highlighting for the
 * languages CodeAudit actually supports — not monaco-editor's full
 * "every language" barrel, which would otherwise pull in dozens of
 * unused grammars.
 *
 * Diagnostics/IntelliSense are intentionally not wired up: this is a
 * read-only diff *viewer*, not an editor, so only the base editor
 * worker (tokenising/layout) is needed — no per-language worker
 * (TypeScript, JSON, CSS...) is required for that.
 */
import * as monaco from 'monaco-editor/editor/editor.api'
import EditorWorker from 'monaco-editor/editor/editor.worker?worker'

import 'monaco-editor/languages/definitions/python/register'
import 'monaco-editor/languages/definitions/cpp/register'
import 'monaco-editor/languages/definitions/java/register'
import 'monaco-editor/languages/definitions/javascript/register'
import 'monaco-editor/languages/definitions/typescript/register'

declare global {
  interface Window {
    MonacoEnvironment?: monaco.Environment
  }
}

if (!window.MonacoEnvironment) {
  window.MonacoEnvironment = {
    getWorker: () => new EditorWorker(),
  }
}

/**
 * CodeAudit language id -> Monaco language id. Monaco doesn't bundle a
 * standalone C grammar, so C source is highlighted with the C++
 * tokenizer; close enough for a read-only diff view; not used for
 * anything that depends on C-specific semantics.
 */
const MONACO_LANGUAGE: Record<string, string> = {
  python: 'python',
  c: 'cpp',
  cpp: 'cpp',
  java: 'java',
  javascript: 'javascript',
  typescript: 'typescript',
}

export function monacoLanguageFor(languageId: string): string {
  return MONACO_LANGUAGE[languageId] ?? 'plaintext'
}

export { monaco }
