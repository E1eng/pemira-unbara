import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function ThankYouPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  useEffect(() => {
    logout()
    const t = setTimeout(() => {
      navigate('/', { replace: true })
    }, 5000)

    return () => clearTimeout(t)
  }, [logout, navigate])

  return (
    <Layout>
      <div className="flex min-h-[70vh] items-center justify-center py-4">
        <div className="w-full max-w-md">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg sm:p-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <div className="text-lg font-bold tracking-tight text-gov-blue sm:text-xl">Terima kasih</div>
                <div className="text-sm text-zinc-600">Suara Anda Telah Direkam. Terima Kasih telah berpartisipasi.</div>
              </div>
            </div>

            <div className="mt-6 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
              Demi keamanan, sesi Anda telah diakhiri. Anda akan diarahkan kembali ke Beranda dalam 5 detik.
            </div>

            <button
              type="button"
              onClick={() => {
                logout()
                navigate('/', { replace: true })
              }}
              className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-xl bg-gov-accent px-4 text-sm font-semibold text-white shadow-sm hover:bg-gov-accent/95 focus:outline-none focus:ring-4 focus:ring-gov-accent/20"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </div>
    </Layout>
  )
}
