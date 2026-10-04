export const TILE_COLORS = [
  '#5a3cf0', // violet
  '#ffc02e', // marigold
  '#ff5a6e', // coral
  '#1fcf9b', // mint
  '#57c7ff', // sky
  '#14163a', // ink
  '#ff9bd2', // pink
  '#c8f169', // lime
] as const

export type TileShape = 'square' | 'circle' | 'corner-tl' | 'corner-tr' | 'corner-br' | 'corner-bl'

const SHAPES: TileShape[] = ['square', 'circle', 'corner-tl', 'corner-tr', 'corner-br', 'corner-bl']

export interface PrintTile {
  shape: TileShape
  color: string
  background: string
}

export const PRINT_TILE_COUNT = 16

const HEX_64 = /^[0-9a-f]{64}$/i

export function isSha256Hex(value: string): boolean {
  return HEX_64.test(value)
}

export function printTiles(sha256: string): PrintTile[] {
  if (!isSha256Hex(sha256)) {
    throw new Error('printTiles expects a 64-character SHA-256 hex digest.')
  }

  const tiles: PrintTile[] = []
  for (let i = 0; i < PRINT_TILE_COUNT; i++) {
    const first = parseInt(sha256.slice(i * 4, i * 4 + 2), 16)
    const second = parseInt(sha256.slice(i * 4 + 2, i * 4 + 4), 16)
    const colorIndex = first & 7
    const backgroundIndex = (colorIndex + 1 + ((first >> 3) % 7)) % TILE_COLORS.length
    tiles.push({
      shape: SHAPES[second % SHAPES.length]!,
      color: TILE_COLORS[colorIndex]!,
      background: TILE_COLORS[backgroundIndex]!,
    })
  }
  return tiles
}

export function shortHash(sha256: string): string {
  return sha256.length > 12 ? `${sha256.slice(0, 8)}…${sha256.slice(-4)}` : sha256
}

export function colorForNodeType(type: string): string {
  if (type.startsWith('OPERATOR:')) return TILE_COLORS[1]!
  let hash = 5381
  for (let i = 0; i < type.length; i++) hash = ((hash << 5) + hash + type.charCodeAt(i)) >>> 0
  const usable = [0, 2, 3, 4, 5, 6, 7]
  return TILE_COLORS[usable[hash % usable.length]!]!
}
