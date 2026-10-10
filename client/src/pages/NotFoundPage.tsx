import { Link } from 'react-router'
import { buttonClasses } from '../components/ui/button-styles'

export function NotFoundPage() {
  return (
    <div className="rounded-2xl border-2 border-ink bg-sheet p-8 text-center shadow-block">
      <p className="font-display text-5xl font-bold">404</p>
      <p className="mt-2 text-ink-soft">There's no page here — not even a fingerprint match.</p>
      <Link to="/" className={`${buttonClasses('primary')} mt-5 inline-flex`}>
        Back home
      </Link>
    </div>
  )
}
