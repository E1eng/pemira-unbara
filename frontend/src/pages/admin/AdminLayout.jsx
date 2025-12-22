import { useEffect, useState } from 'react'
import { NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom'
import { FileText, LayoutDashboard, LogOut, Shield, Users, UserSquare2 } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient.js'

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

export default function AdminLayout() {
  const navigate = useNavigate()
  const [checking, setChecking] = useState(true)
  const [session, setSession] = useState(null)

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
    <div className="min-h-dvh bg-gov-bg text-gov-blue">
      <div className="mx-auto flex min-h-dvh w-full max-w-6xl">
        <aside className="hidden w-64 shrink-0 flex-col bg-gov-blue px-4 py-5 sm:flex">
          <div className="flex items-center gap-3 px-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
              <Shield className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-white">PEMIRA BEM</div>
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
            <div className="mt-3 px-2 text-xs text-zinc-400">{session.user?.email}</div>
          </div>
        </aside>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">
          <div className="mb-4 flex items-center justify-between sm:hidden">
            <div className="text-sm font-semibold">PEMIRA BEM</div>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut()
                navigate('/admin/login', { replace: true })
              }}
              className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Logout
            </button>
          </div>

          <div className="sm:hidden">
            <div className="grid grid-cols-3 gap-2">
              <NavLink
                to="/admin/dashboard"
                className={({ isActive }) =>
                  [
                    'inline-flex h-10 items-center justify-center rounded-xl border text-xs font-semibold',
                    isActive
                      ? 'border-gov-accent bg-gov-accent text-white'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50',
                  ].join(' ')
                }
              >
                Dashboard
              </NavLink>
              <NavLink
                to="/admin/candidates"
                className={({ isActive }) =>
                  [
                    'inline-flex h-10 items-center justify-center rounded-xl border text-xs font-semibold',
                    isActive
                      ? 'border-gov-accent bg-gov-accent text-white'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50',
                  ].join(' ')
                }
              >
                Kandidat
              </NavLink>
              <NavLink
                to="/admin/voters"
                className={({ isActive }) =>
                  [
                    'inline-flex h-10 items-center justify-center rounded-xl border text-xs font-semibold',
                    isActive
                      ? 'border-gov-accent bg-gov-accent text-white'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50',
                  ].join(' ')
                }
              >
                DPT
              </NavLink>
              <NavLink
                to="/admin/audit"
                className={({ isActive }) =>
                  [
                    'inline-flex h-10 items-center justify-center rounded-xl border text-xs font-semibold',
                    isActive
                      ? 'border-gov-accent bg-gov-accent text-white'
                      : 'border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50',
                  ].join(' ')
                }
              >
                Audit
              </NavLink>
            </div>
          </div>

          <div className="mt-5">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
