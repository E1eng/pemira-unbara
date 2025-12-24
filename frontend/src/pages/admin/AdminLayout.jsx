import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { FileText, LayoutDashboard, LogOut, Shield, Users, UserSquare2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient.js'
import nprogress from 'nprogress'
import 'nprogress/nprogress.css'

function SidebarLink({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200',
          isActive
            ? 'bg-white/20 text-white shadow-sm backdrop-blur-sm shadow-black/5'
            : 'text-zinc-300 hover:bg-white/10 hover:text-white hover:translate-x-1',
        ].join(' ')
      }
    >
      <Icon className="h-4 w-4 transition-transform group-hover:scale-110" />
      <span className="truncate">{children}</span>
    </NavLink>
  )
}

function MobileNavLink({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center py-2 px-1 transition-all duration-200 active:scale-90 ${isActive
          ? 'text-indigo-600 scale-105 font-bold'
          : 'text-zinc-400 hover:text-zinc-600'
        }`
      }
    >
      <div className={`p-1 rounded-xl transition-all ${Icon === LayoutDashboard ? '' : ''}`}>
        <Icon className="h-6 w-6 mb-0.5" strokeWidth={2} />
      </div>
      <span className="text-[10px] leading-none">{label}</span>
    </NavLink>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [checking, setChecking] = useState(true)
  const [session, setSession] = useState(null)

  // Trigger NProgress on admin route change
  useEffect(() => {
    nprogress.start()
    const timer = setTimeout(() => nprogress.done(), 300)
    return () => {
      clearTimeout(timer)
      nprogress.done()
    }
  }, [location.pathname])

  useEffect(() => {
    let mounted = true

    const init = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data.session)
      setChecking(false)
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
    })

    return () => {
      mounted = false
      sub?.subscription?.unsubscribe()
    }
  }, [])

  if (checking) {
    return (
      <div className="min-h-dvh bg-zinc-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-zinc-200" />
          <div className="h-4 w-32 rounded-full bg-zinc-200" />
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="min-h-dvh bg-zinc-50 bg-dot-black/[0.1] text-zinc-900 pb-20 md:pb-0 relative font-sans selection:bg-indigo-500/30">

      {/* Background radial gradient */}
      <div className="absolute pointer-events-none inset-0 flex items-center justify-center bg-zinc-50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)] fixed"></div>

      <div className="mx-auto flex min-h-dvh w-full max-w-7xl relative z-10">

        {/* Desktop Sidebar (Glassmorphism) */}
        <aside className="hidden w-72 shrink-0 flex-col px-6 py-8 md:flex sticky top-0 h-dvh">
          <div className="bg-zinc-900/95 backdrop-blur-xl rounded-[2rem] h-full shadow-2xl shadow-zinc-900/10 border border-white/10 flex flex-col p-4 text-white ring-1 ring-white/20">

            {/* Header */}
            <div className="flex items-center gap-4 px-2 mb-8 mt-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="text-base font-bold tracking-tight text-white">PEMIRA UNBARA</div>
                <div className="text-xs text-zinc-400 font-medium tracking-wide uppercase">Admin Panel</div>
              </div>
            </div>

            {/* Nav */}
            <nav className="space-y-1.5 flex-1">
              <div className="px-3 mb-2 text-xs font-bold text-zinc-500 uppercase tracking-wider">Main Menu</div>
              <SidebarLink to="/admin/dashboard" icon={LayoutDashboard}>Dashboard</SidebarLink>
              <SidebarLink to="/admin/candidates" icon={UserSquare2}>Manajemen Paslon</SidebarLink>
              <SidebarLink to="/admin/voters" icon={Users}>Data Pemilih (DPT)</SidebarLink>

              <div className="px-3 mb-2 mt-6 text-xs font-bold text-zinc-500 uppercase tracking-wider">Security</div>
              <SidebarLink to="/admin/audit" icon={FileText}>Audit Log</SidebarLink>
            </nav>

            {/* Footer */}
            <div className="mt-auto pt-6 border-t border-white/10">
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut()
                  navigate('/admin/login', { replace: true })
                }}
                className="group flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-red-300 transition-all hover:bg-red-500/10 hover:text-red-200"
              >
                <LogOut className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                Sign Out
              </button>
              <div className="mt-4 px-2 text-[10px] text-zinc-500 font-mono text-center opacity-50">
                {session.user?.email}
              </div>
            </div>

          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Mobile Top Header (Glassmorphism) */}
          <div className="sticky top-0 z-30 flex items-center justify-between bg-white/80 backdrop-blur-md px-4 py-3 border-b border-zinc-200/50 shadow-sm md:hidden">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-900 text-white flex items-center justify-center">
                <Shield className="w-4 h-4" />
              </div>
              <span className="font-bold text-zinc-900 text-lg">Admin Panel</span>
            </div>
            <div className="text-xs font-mono bg-zinc-100 px-2 py-1 rounded text-zinc-500">
              v2.4
            </div>
          </div>

          <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar (Glassmorphism) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-lg border-t border-zinc-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] px-6 pb-safe pt-3 md:hidden rounded-t-[2rem]">
        <div className="grid grid-cols-5 gap-1 mb-3">
          <MobileNavLink to="/admin/dashboard" icon={LayoutDashboard} label="Home" />
          <MobileNavLink to="/admin/candidates" icon={UserSquare2} label="Paslon" />
          <MobileNavLink to="/admin/voters" icon={Users} label="DPT" />
          <MobileNavLink to="/admin/audit" icon={FileText} label="Audit" />

          <button
            onClick={async () => {
              if (confirm('Yakin ingin logout?')) {
                await supabase.auth.signOut()
                navigate('/admin/login', { replace: true })
              }
            }}
            className="flex flex-col items-center justify-center py-2 px-1 text-zinc-400 hover:text-red-500 transition-all active:scale-95"
          >
            <div className="p-1">
              <LogOut className="h-6 w-6 mb-0.5" strokeWidth={2} />
            </div>
            <span className="text-[10px] font-medium leading-none">Keluar</span>
          </button>
        </div>
      </div>
    </div>
  )
}
