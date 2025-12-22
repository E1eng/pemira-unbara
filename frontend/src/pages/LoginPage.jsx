import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { ArrowLeft, Eye, EyeOff, Shield, User, Key } from 'lucide-react'
import { AuroraBackground } from '../components/ui/aurora-background.jsx'
import { cn } from '../lib/utils.js'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [nim, setNim] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState(null)
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const onSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!nim.trim() || !accessCode.trim()) {
      setError('NIM/NPM dan Kode Akses wajib diisi.')
      return
    }

    setIsSubmitting(true)

    try {
      // Server-side validate via RPC (no side-effects)
      const { data, error } = await supabase.rpc('validate_voter', {
        p_nim: String(nim).trim(),
        p_access_code_plain: String(accessCode).trim(),
      })

      if (error) {
        throw new Error(error.message || 'Gagal memvalidasi kredensial.')
      }

      if (!data?.ok) {
        throw new Error(data?.reason || 'Kredensial tidak valid.')
      }

      await login(nim, accessCode)
      navigate('/vote', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk. Silakan coba lagi.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const goBack = () => {
    navigate('/')
  }

  return (
    <AuroraBackground>
      <div className="relative z-10 flex min-h-screen w-full flex-col items-center justify-center p-4">
        {/* Navigation - Top Left */}
        <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
          <button
            onClick={goBack}
            className="flex items-center gap-2 rounded-full bg-white/50 px-4 py-2 text-sm font-medium text-gov-blue backdrop-blur-md transition-all hover:bg-white/80 border border-white/40 shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Kembali</span>
          </button>
        </div>

        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="overflow-hidden rounded-3xl border border-white/50 bg-white/30 backdrop-blur-xl shadow-2xl">
            <div className="p-8">
              {/* Header */}
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-gov-accent to-indigo-500 shadow-lg shadow-gov-accent/30">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-gov-blue mb-2">
                  Login Pemilih
                </h1>
                <p className="text-zinc-700 text-sm">
                  Masukkan NIM dan Kode Akses untuk mulai memilih di PEMIRA BEM.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={onSubmit} className="mt-8 space-y-6">
                {error && (
                  <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-600 text-center font-medium">
                    {error}
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-zinc-500 group-focus-within:text-gov-accent transition-colors" />
                      </div>
                      <input
                        id="nim"
                        name="nim"
                        value={nim}
                        onChange={(e) => setNim(e.target.value)}
                        inputMode="numeric"
                        autoComplete="off"
                        placeholder="NIM / NPM"
                        className="block w-full rounded-xl border-0 bg-white/60 py-3.5 pl-10 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-200 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-gov-accent sm:text-sm sm:leading-6 transition-all hover:bg-white/80 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Key className="h-5 w-5 text-zinc-500 group-focus-within:text-gov-accent transition-colors" />
                      </div>
                      <input
                        id="accessCode"
                        name="accessCode"
                        type={showPassword ? 'text' : 'password'}
                        value={accessCode}
                        onChange={(e) => setAccessCode(e.target.value)}
                        autoComplete="off"
                        placeholder="Kode Akses (Token)"
                        className="block w-full rounded-xl border-0 bg-white/60 py-3.5 pl-10 pr-10 text-zinc-900 shadow-sm ring-1 ring-inset ring-zinc-200 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-gov-accent sm:text-sm sm:leading-6 transition-all hover:bg-white/80 focus:bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-gov-blue transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-gov-accent to-indigo-600 px-3.5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all disabled:opacity-70 disabled:cursor-not-allowed group"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {isSubmitting ? 'Memproses...' : 'Masuk ke Bilik Suara'}
                    {!isSubmitting && <ArrowLeft className="h-4 w-4 rotate-180 group-hover:translate-x-1 transition-transform" />}
                  </span>
                </button>
              </form>
            </div>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-zinc-500">
              &copy; 2025 Panitia Pemilihan Raya BEM
            </p>
          </div>
        </div>
      </div>
    </AuroraBackground>
  )
}

