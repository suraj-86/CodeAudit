import { describe, expect, it } from 'vitest'
import { isSha256Hex, printTiles, shortHash, PRINT_TILE_COUNT, colorForNodeType } from './print'

const HASH_A = 'a52a165a297d54aa3a93149f7ba66f00b6a200b599da12ca9b8cfc8a8954bdbf'.slice(0, 64)
const HASH_B = '9f7b12aebcf0a3b504fc2912261643af1e3238760b98c1c6018ac45b791284ab'.slice(0, 64)

describe('isSha256Hex', () => {
  it('accepts 64-char hex and rejects everything else', () => {
    expect(isSha256Hex(HASH_A)).toBe(true)
    expect(isSha256Hex(HASH_A.toUpperCase())).toBe(true)
    expect(isSha256Hex(HASH_A.slice(0, 63))).toBe(false)
    expect(isSha256Hex('not-hex-'.repeat(8))).toBe(false)
  })
})

describe('printTiles', () => {
  it('produces 16 tiles', () => {
    expect(printTiles(HASH_A)).toHaveLength(PRINT_TILE_COUNT)
  })

  it('is deterministic: same hash, same tiles', () => {
    expect(printTiles(HASH_A)).toEqual(printTiles(HASH_A))
  })

  it('differs for different hashes', () => {
    expect(printTiles(HASH_A)).not.toEqual(printTiles(HASH_B))
  })

  it('never gives a tile the same foreground and background colour', () => {
    for (const tile of printTiles(HASH_A)) {
      expect(tile.color).not.toBe(tile.background)
    }
  })

  it('throws on a non-digest string', () => {
    expect(() => printTiles('not a digest')).toThrow()
  })
})

describe('shortHash', () => {
  it('shortens a long digest and leaves short strings alone', () => {
    expect(shortHash(HASH_A)).toBe(`${HASH_A.slice(0, 8)}…${HASH_A.slice(-4)}`)
    expect(shortHash('short')).toBe('short')
  })
})

describe('colorForNodeType', () => {
  it('is deterministic per node type', () => {
    expect(colorForNodeType('identifier')).toBe(colorForNodeType('identifier'))
  })

  it('gives every operator the same colour, distinct from a structural node', () => {
    expect(colorForNodeType('OPERATOR:+')).toBe(colorForNodeType('OPERATOR:-'))
    expect(colorForNodeType('OPERATOR:+')).not.toBe(colorForNodeType('identifier'))
  })
})
