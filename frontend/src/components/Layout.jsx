import { Link, useLocation } from 'react-router-dom'
import { Landmark } from 'lucide-react'

export default function Layout({ children }) {
  const location = useLocation()
  const path = location.pathname

  const linkClass = (href) => {
    const isActive =
      (href === '/' && path === '/') ||
      (href !== '/' && path === href) ||
      (href === '/admin' && path.startsWith('/admin'))

    return `inline-flex h-10 items-center justify-center rounded-xl px-3 text-sm font-medium transition-colors ${
      isActive ? 'bg-gov-accent/10 text-gov-accent' : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
    }`
  }

  return (
    <div className="min-h-dvh bg-gov-bg text-gov-blue">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gov-accent/10 text-gov-accent">
                <Landmark className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-base font-semibold leading-tight sm:text-lg">E-Voting Ketua BEM</div>
                <div className="text-xs text-zinc-500 sm:text-sm">Sistem pemilihan Badan Eksekutif Mahasiswa</div>
              </div>
            </div>

            <nav className="hidden items-center gap-1 sm:flex">
              <Link to="/" className={linkClass('/')}>Beranda</Link>
              <Link to="/live" className={linkClass('/live')}>Live</Link>
              <Link to="/results" className={linkClass('/results')}>Rekap</Link>
              <Link to="/admin" className={linkClass('/admin')}>Admin</Link>
            </nav>
          </div>

          <nav className="mt-3 flex gap-2 overflow-x-auto pb-1 sm:hidden">
            <Link to="/" className={linkClass('/')}>Beranda</Link>
            <Link to="/live" className={linkClass('/live')}>Live</Link>
            <Link to="/results" className={linkClass('/results')}>Rekap</Link>
            <Link to="/admin" className={linkClass('/admin')}>Admin</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-10">{children}</main>

      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto w-full max-w-4xl px-4 py-4 text-xs text-zinc-500 sm:px-6">
          © 2025 Panitia Pemilihan - Secured System
        </div>
      </footer>
    </div>
  )
}
