import { isSha256Hex, printTiles, type PrintTile } from '../lib/print'

interface FilePrintProps {
  hash: string | null
  size?: number
  label?: string
  className?: string
}

const CORNER_ROTATION = { 'corner-tl': 0, 'corner-tr': 90, 'corner-br': 180, 'corner-bl': 270 } as const

function Shape({ tile }: { tile: PrintTile }) {
  switch (tile.shape) {
    case 'square':
      return <rect x="0.14" y="0.14" width="0.72" height="0.72" fill={tile.color} />
    case 'circle':
      return <circle cx="0.5" cy="0.5" r="0.38" fill={tile.color} />
    default:
      return (
        <path
          d="M0 0H1A1 1 0 0 1 0 1Z"
          fill={tile.color}
          transform={`rotate(${CORNER_ROTATION[tile.shape]} 0.5 0.5)`}
        />
      )
  }
}

export function FilePrint({ hash, size = 64, label, className = '' }: FilePrintProps) {
  const tiles = hash && isSha256Hex(hash) ? printTiles(hash) : null

  return (
    <svg
      viewBox="0 0 4 4"
      width={size}
      height={size}
      role="img"
      aria-label={label ?? (tiles ? 'File fingerprint pattern' : 'Computing file fingerprint')}
      className={`block shrink-0 border-2 border-ink bg-white ${className}`}
    >
      {tiles
        ? tiles.map((tile, i) => (
            <g key={i} transform={`translate(${i % 4} ${Math.floor(i / 4)})`}>
              <rect width="1" height="1" fill={tile.background} className="transition-[fill] duration-300" />
              <Shape tile={tile} />
            </g>
          ))
        : Array.from({ length: 16 }, (_, i) => (
            <rect
              key={i}
              x={i % 4}
              y={Math.floor(i / 4)}
              width="1"
              height="1"
              fill={(i + Math.floor(i / 4)) % 2 ? '#d3deea' : '#eef3f8'}
              className="animate-blink"
              style={{ animationDelay: `${i * 60}ms` }}
            />
          ))}
    </svg>
  )
}
