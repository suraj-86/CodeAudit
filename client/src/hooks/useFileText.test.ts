import { describe, expect, it } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useFileText } from './useFileText'

describe('useFileText', () => {
  it('starts null and resolves to the file contents', async () => {
    const file = new File(['int main() {}'], 'a.cpp')
    const { result } = renderHook(() => useFileText(file))

    expect(result.current).toBeNull()
    await waitFor(() => expect(result.current).toBe('int main() {}'))
  })

  it('returns null for a null or undefined file', () => {
    const { result, rerender } = renderHook(({ file }) => useFileText(file), {
      initialProps: { file: null as File | null },
    })
    expect(result.current).toBeNull()
    rerender({ file: null })
    expect(result.current).toBeNull()
  })

  it('switches to the new file\'s contents when the file prop changes', async () => {
    const fileA = new File(['AAA'], 'a.cpp')
    const fileB = new File(['BBB'], 'b.cpp')
    const { result, rerender } = renderHook(({ file }) => useFileText(file), {
      initialProps: { file: fileA },
    })
    await waitFor(() => expect(result.current).toBe('AAA'))

    rerender({ file: fileB })
    expect(result.current).toBeNull()
    await waitFor(() => expect(result.current).toBe('BBB'))
  })
})
