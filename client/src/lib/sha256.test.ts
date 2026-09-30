import { describe, expect, it } from 'vitest'
import { createHash } from 'node:crypto'
import { sha256Hex, sha256HexFallback, sha256OfText } from './sha256'

function nodeSha256(text: string): string {
  return createHash('sha256').update(text, 'utf8').digest('hex')
}

describe('sha256Hex', () => {
  it('matches Node\'s crypto for known strings', async () => {
    for (const text of ['', 'hello', 'CodeAudit', 'a'.repeat(200)]) {
      const bytes = new TextEncoder().encode(text)
      expect(await sha256Hex(bytes)).toBe(nodeSha256(text))
    }
  })

  it('is deterministic and content-sensitive', async () => {
    const a = await sha256OfText('int main() {}')
    const b = await sha256OfText('int main() {}')
    const c = await sha256OfText('int main() { return 0; }')
    expect(a).toBe(b)
    expect(a).not.toBe(c)
  })
})

describe('sha256HexFallback', () => {
  it('matches the Web Crypto result and Node for a multi-block message', () => {
    const text = 'x'.repeat(130) // spans multiple 64-byte blocks
    const bytes = new TextEncoder().encode(text)
    expect(sha256HexFallback(bytes)).toBe(nodeSha256(text))
  })
})
