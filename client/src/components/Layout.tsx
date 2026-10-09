import { NavLink, Outlet } from 'react-router'

const links = [
  { to: '/', label: 'About', end: true },
  { to: '/check', label: 'Check two files' },
  { to: '/batch', label: 'Check a class set' },
  { to: '/ai-analysis', label: 'AI analysis' },
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
          </nav>
        </div>
      </header>
      <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
        <Outlet />
      </main>
      <SiteFooter />
    </div>
  )
}

const SOCIAL_LINKS = [
  {
    label: 'GitHub',
    href: 'https://github.com/suraj-86',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.1 3.29 9.42 7.86 10.95.58.1.79-.25.79-.56 0-.27-.01-1.17-.02-2.12-3.2.7-3.88-1.36-3.88-1.36-.52-1.33-1.28-1.68-1.28-1.68-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.09-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.18 1.18a11 11 0 0 1 5.79 0c2.2-1.49 3.17-1.18 3.17-1.18.64 1.59.24 2.77.12 3.06.74.8 1.19 1.83 1.19 3.09 0 4.42-2.69 5.39-5.25 5.68.41.36.78 1.07.78 2.15 0 1.55-.01 2.81-.01 3.19 0 .31.21.67.8.56A10.52 10.52 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/suraj-k-6a2b60227/',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
        <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.95v5.66H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.61 0 4.27 2.38 4.27 5.47v6.27ZM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45ZM22.22 0H1.77C.8 0 0 .78 0 1.75v20.5C0 23.22.8 24 1.77 24h20.45c.98 0 1.78-.78 1.78-1.75V1.75C24 .78 23.2 0 22.22 0Z" />
      </svg>
    ),
  },
  {
    label: 'Email',
    href: 'mailto:harshsuraj8676@gmail.com',
    icon: (
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="2" y="4" width="20" height="16" rx="2" />
        <path d="m22 6-10 7L2 6" />
      </svg>
    ),
  },
]

function SiteFooter() {
  return (
    <footer className="border-t-2 border-ink bg-ink text-white">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-4 py-10 text-center">
        <p className="font-display text-lg font-bold">© {new Date().getFullYear()} Suraj.</p>
        <div className="flex items-center gap-3">
          {SOCIAL_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith('mailto:') ? undefined : '_blank'}
              rel={link.href.startsWith('mailto:') ? undefined : 'noreferrer'}
              aria-label={link.label}
              title={link.label}
              className="grid h-10 w-10 place-items-center rounded-full border-2 border-white/25 text-white/80 transition-colors duration-150 hover:border-white hover:text-white"
            >
              {link.icon}
            </a>
          ))}
        </div>
        <p className="text-[0.75rem] font-semibold tracking-[0.2em] text-white/50 uppercase">
          CodeAudit · AST-Powered Code Analysis
        </p>
      </div>
    </footer>
  )
}
