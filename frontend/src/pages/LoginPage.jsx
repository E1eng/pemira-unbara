import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [nim, setNim] = useState('')
  const [accessCode, setAccessCode] = useState('')
  const [error, setError] = useState(null)

  const onSubmit = (e) => {
    e.preventDefault()
    setError(null)

    if (!nim.trim() || !accessCode.trim()) {
      setError('NIM/NPM dan Kode Akses wajib diisi.')
      return
    }

    try {
      login(nim, accessCode)
      navigate('/vote', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal masuk. Silakan coba lagi.')
    }
  }

  return (
    <Layout>
      <div className="flex min-h-[70vh] items-center justify-center py-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg sm:p-8">
            <h1 className="text-xl font-bold tracking-tight text-gov-blue sm:text-2xl">Masuk ke Bilik Suara</h1>
            <p className="mt-2 text-sm text-zinc-600">
              Masukkan NIM/NPM dan Kode Akses dari panitia untuk melanjutkan.
            </p>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-700" htmlFor="nim">
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

              <div>
                <label className="block text-sm font-medium text-zinc-700" htmlFor="accessCode">
                  Kode Akses
                </label>
                <input
                  id="accessCode"
                  name="accessCode"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  type="password"
                  autoComplete="off"
                  placeholder="Masukkan kode akses"
                  className="mt-2 h-12 w-full rounded-xl border border-zinc-300 bg-white px-4 text-base text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-gov-accent focus:outline-none focus:ring-4 focus:ring-gov-accent/15"
                />
                <p className="mt-2 text-sm text-zinc-500">Kode Akses diberikan oleh panitia pemilihan.</p>
              </div>

              <button
                type="submit"
                className="mt-2 inline-flex h-12 w-full items-center justify-center rounded-xl bg-gov-accent px-4 text-sm font-semibold text-white shadow-sm hover:bg-gov-accent/95 focus:outline-none focus:ring-4 focus:ring-gov-accent/20"
              >
                Masuk
              </button>
            </form>
          </div>

          <p className="mt-4 text-center text-xs text-zinc-500">
            Demi keamanan, Kode Akses tidak disimpan di perangkat Anda.
          </p>
        </div>
      </div>
    </Layout>
  )
}
