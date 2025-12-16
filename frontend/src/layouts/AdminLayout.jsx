import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, LogOut, ShieldAlert, UserSquare2, Users } from 'lucide-react'
import { supabase } from '../lib/supabaseClient.js'

function SidebarLink({ to, icon: Icon, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold transition-colors',
          isActive ? 'bg-white/10 text-white' : 'text-slate-200 hover:bg-white/10 hover:text-white',
        ].join(' ')
      }
    >
      <Icon className="h-4 w-4" />
      <span className="truncate">{children}</span>
    </NavLink>
  )
}

export default function AdminLayout() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [session, setSession] = useState(null)
  const [isAdmin, setIsAdmin] = useState(null)

  const checkAdmin = async (nextSession) => {
    if (!nextSession) {
      setIsAdmin(null)
      return
    }

    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', nextSession.user.id)
      .maybeSingle()

    setIsAdmin(Boolean(!error && data?.user_id))
  }

  useEffect(() => {
    let mounted = true

    const init = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      setSession(data.session)
      await checkAdmin(data.session)
      setChecking(false)
    }

    init()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      void checkAdmin(nextSession)
    })

    return () => {
      mounted = false
      sub?.subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!checking && session && isAdmin === false) {
      void supabase.auth.signOut().finally(() => {
        navigate('/admin/login', {
          replace: true,
          state: { error: 'Akses admin ditolak. Akun ini tidak terdaftar sebagai panitia.' },
        })
      })
    }
  }, [checking, isAdmin, navigate, session])

  if (checking || (session && isAdmin === null)) {
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

  if (isAdmin === false) {
    return (
      <div className="min-h-dvh bg-gov-bg text-gov-blue">
        <div className="mx-auto flex min-h-dvh max-w-5xl items-center justify-center px-4">
          <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
            <div className="text-sm font-medium text-zinc-700">Akses ditolak. Mengeluarkan akun...</div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-gov-bg text-gov-blue">
      <aside className="fixed inset-y-0 left-0 hidden w-72 flex-col bg-slate-900 px-4 py-5 sm:flex">
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
            <ShieldAlert className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white">Panel Panitia</div>
            <div className="text-xs text-slate-300">Command Center</div>
          </div>
        </div>

        <nav className="mt-6 space-y-1">
          <SidebarLink to="/admin/dashboard" icon={LayoutDashboard}>
            Dashboard
          </SidebarLink>
          <SidebarLink to="/admin/voters" icon={Users}>
            Data Pemilih (DPT)
          </SidebarLink>
          <SidebarLink to="/admin/candidates" icon={UserSquare2}>
            Data Kandidat
          </SidebarLink>
          <SidebarLink to="/admin/audit" icon={ShieldAlert}>
            Security Log
          </SidebarLink>
        </nav>

        <div className="mt-auto pt-5">
          <button
            type="button"
            onClick={async () => {
              await supabase.auth.signOut()
              navigate('/admin/login', { replace: true })
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Keluar
          </button>
        </div>
      </aside>

      <div className="sm:pl-72">
        <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
            <div>
              <div className="text-sm font-semibold text-gov-blue">Backoffice</div>
              <div className="text-xs text-zinc-500">Panitia Pemilihan</div>
            </div>

            <div className="flex items-center gap-4">
              <div className="hidden items-center gap-2 text-xs font-semibold text-zinc-600 sm:flex">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                System Status: Online
              </div>
              <div className="text-right">
                <div className="text-xs text-zinc-500">Admin</div>
                <div className="max-w-[220px] truncate text-sm font-semibold text-gov-blue">{session.user?.email}</div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
