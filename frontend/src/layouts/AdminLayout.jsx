import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useNavigate, useLocation } from 'react-router-dom'
import { FileText, LayoutDashboard, LogOut, Shield, Users, UserSquare2 } from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'
import nprogress from 'nprogress'
import 'nprogress/nprogress.css'
import logo from '../assets/logo-bem.png'

function SidebarLink({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
          isActive ? 'bg-white/10 text-white' : 'text-zinc-200 hover:bg-white/10 hover:text-white',
        ].join(' ')
      }
    >
      <Icon className="h-4 w-4" />
      <span className="truncate">{children}</span>
    </NavLink>
  )
}

function MobileNavLink({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex flex-col items-center justify-center h-full w-full active:scale-95 active:bg-zinc-50 transition-all ${isActive ? 'text-gov-accent bg-indigo-50/50' : 'text-zinc-400 hover:text-zinc-600'
        }`
      }
    >
      <Icon className="h-5 w-5 mb-1" strokeWidth={2} />
      <span className="text-[10px] font-medium leading-none">{label}</span>
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
      <div className="min-h-dvh bg-gov-bg text-gov-blue">
        <div className="mx-auto flex min-h-dvh max-w-5xl items-center justify-center px-4">
          <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
            <div className="text-sm font-medium text-zinc-700">Memeriksa sesi admin...</div>
          </div>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/admin/login" replace />
  }

  return (
    <div className="min-h-dvh bg-gov-bg text-gov-blue pb-20 sm:pb-0">
      <div className="flex min-h-dvh w-full relative">
        {/* Desktop Sidebar - Sticky */}
        {/* Changed to sticky so it stays in view, and restoring sm:flex to match original behavior */}
        <aside className="hidden w-64 shrink-0 flex-col bg-gov-blue px-4 py-5 sm:flex sticky top-0 h-dvh overflow-y-auto self-start">
          <div className="flex items-center gap-3 px-2">
            <img src={logo} alt="Logo" className="h-10 w-auto object-contain bg-white/10 rounded-lg p-1" />
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">PEMIRA UNBARA</div>
              <div className="text-xs text-zinc-300">Panel Panitia Pemilihan</div>
            </div>
          </div>

          <nav className="mt-6 space-y-1">
            <SidebarLink to="/admin/dashboard" icon={LayoutDashboard}>
              Dashboard
            </SidebarLink>
            <SidebarLink to="/admin/candidates" icon={UserSquare2}>
              Paslon
            </SidebarLink>
            <SidebarLink to="/admin/voters" icon={Users}>
              DPT Mahasiswa
            </SidebarLink>
            <SidebarLink to="/admin/audit" icon={FileText}>
              Audit Log
            </SidebarLink>
          </nav>

          <div className="mt-auto pt-5">
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut()
                navigate('/admin/login', { replace: true })
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-white/10 hover:text-white"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
            <div className="mt-3 px-2 text-xs text-zinc-400 truncate">{session.user?.email}</div>
          </div>
        </aside>

        {/* Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile Top Header */}
          <div className="sticky top-0 z-30 flex items-center justify-center bg-white/90 backdrop-blur-md px-4 py-3 border-b border-zinc-200 shadow-sm sm:hidden">
            <img src={logo} alt="Logo" className="h-8 w-auto object-contain mr-2" />
            <div className="font-bold text-gov-blue">Panel Admin</div>
          </div>

          <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
            <Outlet />
          </main>
        </div>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-zinc-200 sm:hidden">
        <div className="grid grid-cols-5 h-16">
          <MobileNavLink to="/admin/dashboard" icon={LayoutDashboard} label="Dash" />
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
            className="flex flex-col items-center justify-center text-zinc-400 hover:text-red-500 active:scale-95 active:bg-zinc-50 transition-all"
          >
            <LogOut className="h-5 w-5 mb-1" strokeWidth={2} />
            <span className="text-[10px] font-medium leading-none">Keluar</span>
          </button>
        </div>
      </div>
    </div>
  )
}
