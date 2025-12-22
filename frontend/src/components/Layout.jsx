import { Link, useLocation } from 'react-router-dom'
import { Landmark } from 'lucide-react'

export default function Layout({ children }) {
  const location = useLocation()
  const path = location.pathname

  const linkClass = (href) => {
    const isActive =
      (href === '/' && path === '/') ||
      (href !== '/' && path === href)

    return `inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-medium transition-colors ${
      isActive ? 'bg-gov-accent text-white' : 'text-zinc-700 hover:bg-zinc-100'
    }`
  }

  return (
    <div className="min-h-screen bg-gov-bg text-gov-blue flex flex-col">
      {/* Mobile App Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90">
        <div className="px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gov-accent text-white">
                <Landmark className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-bold leading-tight text-gov-blue">E-Voting BEM</div>
                <div className="text-xs text-zinc-500">Sistem Pemilihan</div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 sm:flex sm:justify-end sm:flex-1">
              <Link to="/" className={linkClass('/')}>Beranda</Link>
              <Link to="/results" className={linkClass('/results')}>Hasil</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content with Mobile Padding */}
      <main className="flex-1 pb-20 sm:pb-6">
        <div className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-6 sm:py-6">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation (App-like) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/90 sm:hidden">
        <div className="grid grid-cols-2 gap-1 px-2 py-2">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center rounded-xl py-2 text-xs transition-colors ${
              path === '/' ? 'text-gov-accent' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <div className="mb-1 text-lg">🏠</div>
            <span>Beranda</span>
          </Link>
          <Link
            to="/results"
            className={`flex flex-col items-center justify-center rounded-xl py-2 text-xs transition-colors ${
              path === '/results' ? 'text-gov-accent' : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            <div className="mb-1 text-lg">📈</div>
            <span>Hasil</span>
          </Link>
        </div>
      </nav>

      {/* Desktop Footer */}
      <footer className="hidden border-t border-zinc-200 bg-white sm:block">
        <div className="mx-auto w-full max-w-4xl px-4 py-4 text-xs text-zinc-500 sm:px-6">
          © 2025 Panitia Pemilihan - Secured System
        </div>
      </footer>
    </div>
  )
}
