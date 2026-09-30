import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import App from './App'
import type { LanguagesResponse } from './api'

const LANGUAGES: LanguagesResponse = {
  languages: [
    {
      id: 'cpp',
      label: 'C++',
      extensions: ['.cpp'],
      capabilities: { exactMatch: true, structural: true, batch: true, execution: false, ai: true },
    },
    {
      id: 'python',
      label: 'Python',
      extensions: ['.py'],
      capabilities: { exactMatch: true, structural: false, batch: false, execution: true, ai: true },
    },
  ],
  limits: { maxFileSizeBytes: 1024 * 1024, maxFiles: 100, maxTotalSourceBytes: 1024 * 1024 * 10, maxBatchSubmissions: 100 },
}

function mockFetch() {
  return vi.fn(async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url.includes('/languages')) {
      return new Response(JSON.stringify(LANGUAGES), { status: 200 })
    }
    if (url.includes('/health')) {
      return new Response(JSON.stringify({ status: 'ok', service: 'CodeAudit API' }), { status: 200 })
    }
    return new Response('not found', { status: 404 })
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('App', () => {
  it('loads languages, then renders the home page', async () => {
    vi.stubGlobal('fetch', mockFetch())
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Is it really the same program?')).toBeInTheDocument()
  })

  it('shows the workflow form for the check route, once languages have loaded', async () => {
    vi.stubGlobal('fetch', mockFetch())
    render(
      <MemoryRouter initialEntries={['/check']}>
        <App />
      </MemoryRouter>,
    )
    await waitFor(() => expect(screen.getByRole('radio', { name: 'C++' })).toBeInTheDocument())
    expect(screen.getByRole('button', { name: 'Run check' })).toBeDisabled()
  })

  it('shows an error with retry when /api/languages fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'Down.' } }), { status: 500 })),
    )
    render(
      <MemoryRouter initialEntries={['/']}>
        <App />
      </MemoryRouter>,
    )
    expect(await screen.findByText('Down.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
  })

  it('renders the 404 page for an unknown route', async () => {
    vi.stubGlobal('fetch', mockFetch())
    render(
      <MemoryRouter initialEntries={['/nope']}>
        <App />
      </MemoryRouter>,
    )
    expect(await screen.findByText('404')).toBeInTheDocument()
  })
})
