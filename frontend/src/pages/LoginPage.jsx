import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { ArrowLeft, Eye, EyeOff, Shield, User, Key } from 'lucide-react'

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
    navigate(-1)
  }

  return (
    <Layout>
      <div className="min-h-screen py-4">
        {/* Mobile Header */}
        <div className="mb-6 flex items-center gap-3 sm:hidden">
          <button
            onClick={goBack}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-lg font-semibold text-gov-blue">Masuk Voting</h1>
        </div>

        <div className="flex min-h-[70vh] items-center justify-center py-4">
          <div className="w-full max-w-md">
            {/* Login Card */}
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg sm:p-8">
              {/* Header */}
              <div className="text-center sm:text-left">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gov-accent/10 text-gov-accent sm:mx-0">
                  <Shield className="h-6 w-6" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-gov-blue sm:text-2xl">
                  Masuk ke Bilik Suara PEMIRA
                </h1>
                <p className="mt-2 text-sm text-zinc-600">
                  Masukkan NIM dan Kode Akses untuk memilih Ketua & Wakil BEM
                </p>
              </div>

              {/* Error Message */}
              {error ? (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              {/* Login Form */}
              <form onSubmit={onSubmit} className="mt-6 space-y-5">
                {/* NIM/NPM Input */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-700" htmlFor="nim">
                    <User className="h-4 w-4 text-zinc-400" />
                    NIM/NPM
                  </label>
                  <input
                    id="nim"
                    name="nim"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Contoh: 2235xxxx..."
                    className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-gov-accent focus:outline-none focus:ring-4 focus:ring-gov-accent/15"
                  />
                </div>

                {/* Kode Akses Input */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-zinc-700" htmlFor="accessCode">
                    <Key className="h-4 w-4 text-zinc-400" />
                    Kode Akses
                  </label>
                  <div className="relative">
                    <input
                      id="accessCode"
                      name="accessCode"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value)}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="off"
                      placeholder="Masukkan kode akses"
                      className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 pr-12 text-base text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-gov-accent focus:outline-none focus:ring-4 focus:ring-gov-accent/15"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center text-zinc-400 hover:text-zinc-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-zinc-500">Kode Akses diberikan oleh panitia pemilihan</p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-gov-accent px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gov-accent/95 focus:outline-none focus:ring-4 focus:ring-gov-accent/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Masuk...</span>
                    </div>
                  ) : (
                    'Masuk ke Bilik Suara'
                  )}
                </button>
              </form>
            </div>

            {/* Help Section - Mobile Optimized */}
            <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4">
              <div className="text-center">
                <div className="text-sm font-medium text-zinc-900">Butuh bantuan?</div>
                <div className="mt-2 text-xs text-zinc-600">
                  Hubungi panitia pemilihan jika Anda tidak memiliki Kode Akses
                </div>
                <button
                  onClick={() => navigate('/')}
                  className="mt-3 text-xs text-gov-accent hover:text-gov-accent/80"
                >
                  ← Kembali ke Beranda
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
