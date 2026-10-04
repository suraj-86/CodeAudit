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
