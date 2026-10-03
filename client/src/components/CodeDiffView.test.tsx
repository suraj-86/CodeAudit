import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

const createModel = vi.fn((value: string) => ({ value, dispose: vi.fn() }))
const setModel = vi.fn()
const dispose = vi.fn()
const createDiffEditor = vi.fn(() => ({ setModel, dispose }))
const defineTheme = vi.fn()

vi.mock('../lib/monaco-setup', () => ({
  monaco: {
    editor: {
      createDiffEditor,
      createModel,
      defineTheme,
    },
  },
  monacoLanguageFor: (id: string) => (id === 'cpp' ? 'cpp' : 'plaintext'),
}))

const { CodeDiffView: CodeDiffViewImpl } = await import('./CodeDiffViewImpl')
const { CodeDiffView } = await import('./CodeDiffView')

afterEach(() => {
  vi.clearAllMocks()
})

describe('CodeDiffViewImpl (the real Monaco wiring)', () => {
  it('renders both file labels', () => {
    render(
      <CodeDiffViewImpl
        leftLabel="submission.cpp"
        rightLabel="reference.cpp"
        leftText="int a;"
        rightText="int b;"
        language="cpp"
      />,
    )
    expect(screen.getByText('submission.cpp')).toBeInTheDocument()
    expect(screen.getByText('reference.cpp')).toBeInTheDocument()
  })

  it('creates a diff editor once and sets a model with the mapped language', () => {
    render(
      <CodeDiffViewImpl
        leftLabel="a"
        rightLabel="b"
        leftText="int a;"
        rightText="int b;"
        language="cpp"
      />,
    )
    expect(createDiffEditor).toHaveBeenCalledOnce()
    expect(createModel).toHaveBeenCalledWith('int a;', 'cpp')
    expect(createModel).toHaveBeenCalledWith('int b;', 'cpp')
    expect(setModel).toHaveBeenCalledOnce()
  })

  it('disposes the editor on unmount', () => {
    const { unmount } = render(
      <CodeDiffViewImpl leftLabel="a" rightLabel="b" leftText="x" rightText="y" language="python" />,
    )
    unmount()
    expect(dispose).toHaveBeenCalledOnce()
  })
})

describe('CodeDiffView (the lazy-loaded wrapper)', () => {
  it('shows a loading fallback, then the real diff view once Monaco has loaded', async () => {
    render(
      <CodeDiffView
        leftLabel="submission.cpp"
        rightLabel="reference.cpp"
        leftText="int a;"
        rightText="int b;"
        language="cpp"
      />,
    )
    // The real component resolves asynchronously (dynamic import), so the
    // fallback is what's there synchronously, and the label is awaited.
    expect(screen.getByText('Loading the code viewer…')).toBeInTheDocument()
    expect(await screen.findByText('submission.cpp')).toBeInTheDocument()
  })
})
