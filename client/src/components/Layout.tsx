import { NavLink, Outlet } from 'react-router'
import { ServerStatusBadge } from './ServerStatusBadge'

const links = [
  { to: '/', label: 'About', end: true },
  { to: '/check', label: 'Check two files' },
  { to: '/batch', label: 'Check a class set' },
]

export function Layout() {
  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:border-2 focus:border-ink focus:bg-white focus:px-3 focus:py-1.5"
      >
        Skip to content
      </a>
      <header className="border-b-2 border-ink bg-sheet/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 font-display text-lg font-bold">
            <svg viewBox="0 0 32 32" width="28" height="28" aria-hidden="true">
              <rect width="32" height="32" rx="7" fill="#14163A" />
              <rect x="5" y="5" width="10" height="10" fill="#5A3CF0" />
              <circle cx="22" cy="10" r="5" fill="#FFC02E" />
              <path d="M5 27V17h10a0 0 0 0 1 0 0v10z" fill="#FF5A6E" />
              <path d="M17 17h10v10H17z" fill="#1FCF9B" />
              <path d="M17 27V17a10 10 0 0 1 10 10z" fill="#57C7FF" />
            </svg>
            CodeAudit
          </NavLink>
          <nav className="flex flex-wrap items-center gap-1.5">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `border-2 border-ink px-3 py-1 text-[0.92rem] font-semibold transition-colors duration-100 ${
                    isActive ? 'bg-ink text-white' : 'bg-white hover:bg-marigold/50'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
            <ServerStatusBadge />
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <footer className="border-t-2 border-ink px-4 py-4 text-center text-[0.85rem] text-ink-soft">
        CodeAudit gives independent signals, not a verdict. A human still decides.
      </footer>
    </div>
  )
}
