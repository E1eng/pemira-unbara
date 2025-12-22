import { Link, useLocation } from 'react-router-dom'
import { Landmark, Home, BarChart2, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'
import nprogress from 'nprogress'
import 'nprogress/nprogress.css'
import logo from '../assets/logo-bem.png'

nprogress.configure({ showSpinner: false })

export default function Layout({ children }) {
  const location = useLocation()
  const path = location.pathname

  useEffect(() => {
    nprogress.start()
    const timer = setTimeout(() => nprogress.done(), 300)
    return () => {
      clearTimeout(timer)
      nprogress.done()
    }
  }, [location.pathname])

  const linkClass = (href) => {
    const isActive = (href === '/' && path === '/') || (href !== '/' && path === href)
    return `relative inline-flex h-9 items-center justify-center rounded-full px-4 text-sm font-medium transition-all duration-200 ${isActive
      ? 'bg-gov-accent text-white shadow-sm ring-1 ring-indigo-500/20'
      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
      }`
  }

  return (
    <div className="min-h-screen bg-gov-bg selection:bg-indigo-100 selection:text-indigo-900 flex flex-col font-sans antialiased">
      {/* Mobile App Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/60">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-10">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img src={logo} alt="Logo BEM" className="h-8 w-auto object-contain transition-transform group-hover:scale-105" />
              <div>
                <div className="text-sm font-bold leading-none text-gov-blue tracking-tight group-hover:text-gov-accent transition-colors">E-Voting BEM</div>
                <div className="text-[10px] font-medium text-zinc-400 leading-none mt-0.5">Sistem Pemilihan</div>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-1 sm:flex">
              <Link to="/" className={linkClass('/')}>Beranda</Link>
              <Link to="/results" className={linkClass('/results')}>Hasil</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8 pb-24 sm:pb-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={path}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} // Custom easing for premium feel
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/90 backdrop-blur-lg supports-[backdrop-filter]:bg-white/80 pb-safe sm:hidden">
        <div className="grid grid-cols-2 gap-1 px-4 py-2">
          <Link
            to="/"
            className={`flex flex-col items-center justify-center rounded-xl py-2.5 transition-all active:scale-95 ${path === '/' ? 'text-gov-accent' : 'text-zinc-400 hover:text-zinc-600'
              }`}
          >
            <Home className={`h-6 w-6 mb-1 transition-transform ${path === '/' ? 'scale-110' : ''}`} strokeWidth={path === '/' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Beranda</span>
          </Link>
          <Link
            to="/results"
            className={`flex flex-col items-center justify-center rounded-xl py-2.5 transition-all active:scale-95 ${path === '/results' ? 'text-gov-accent' : 'text-zinc-400 hover:text-zinc-600'
              }`}
          >
            <BarChart2 className={`h-6 w-6 mb-1 transition-transform ${path === '/results' ? 'scale-110' : ''}`} strokeWidth={path === '/results' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Hasil</span>
          </Link>
        </div>
      </nav>

      {/* Desktop Footer */}
      <footer className="hidden border-t border-zinc-100 bg-white sm:block mt-auto">
        <div className="mx-auto w-full max-w-5xl px-6 py-8">
          <div className="flex items-center justify-between">
            <div className="text-xs text-zinc-400 font-medium">
              © 2025 Panitia Pemilihan Umum Raya (PEMIRA)
            </div>
            <div className="flex gap-4">
              {/* Footer links if needed */}
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
