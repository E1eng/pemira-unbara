import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Shield } from 'lucide-react'
import { supabase } from '../../lib/supabaseClient.js'

export default function AdminLoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const stateError = location.state?.error
    if (stateError) setError(stateError)
  }, [location.state])

  useEffect(() => {
    let mounted = true

    const check = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return
      if (data.session) navigate('/admin/dashboard', { replace: true })
    }

    check()

    return () => {
      mounted = false
    }
  }, [navigate])

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password.trim()) {
      setError('Email dan password wajib diisi.')
      return
    }

    setSubmitting(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    })

    if (signInError) {
      setSubmitting(false)
      setError(signInError.message)
      return
    }

    setSubmitting(false)
    navigate('/admin/dashboard', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-gov-bg text-gov-blue">
      <div className="mx-auto flex min-h-dvh max-w-5xl items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gov-blue text-white">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight">Admin Login</div>
                <div className="text-sm text-zinc-600">Panitia pemilihan (Supabase Auth)</div>
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700" htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="admin@desa.id"
                  className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-gov-accent focus:outline-none focus:ring-4 focus:ring-gov-accent/15"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-700" htmlFor="password">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  placeholder="Masukkan password"
                  className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-gov-accent focus:outline-none focus:ring-4 focus:ring-gov-accent/15"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-gov-accent px-4 text-sm font-semibold text-white shadow-sm hover:bg-gov-accent/95 focus:outline-none focus:ring-4 focus:ring-gov-accent/20 disabled:opacity-50"
              >
                {submitting ? 'Memproses...' : 'Masuk'}
              </button>
            </form>
          </div>

          <p className="mt-4 text-center text-xs text-zinc-500">© 2025 Panitia Pemilihan - Secured System</p>
        </div>
      </div>
    </div>
  )
}
