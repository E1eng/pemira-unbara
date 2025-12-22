import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Home, Shield, Clock, ArrowRight } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import { useAuth } from '../context/AuthContext.jsx'

export default function ThankYouPage() {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const [countdown, setCountdown] = useState(5)

  useEffect(() => {
    logout()
    
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          navigate('/', { replace: true })
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(countdownInterval)
    }
  }, [logout, navigate])

  const goHome = () => {
    navigate('/', { replace: true })
  }

  return (
    <Layout>
      <div className="flex min-h-[70vh] items-center justify-center py-4">
        <div className="w-full max-w-md">
          {/* Success Card - Mobile Optimized */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-lg sm:p-8">
            {/* Success Icon and Title */}
            <div className="text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 sm:h-20 sm:w-20">
                <CheckCircle2 className="h-8 w-8 sm:h-10 sm:w-10" />
              </div>
              
              <h1 className="mt-4 text-xl font-bold tracking-tight text-gov-blue sm:text-2xl">Terima Kasih!</h1>
              <p className="mt-2 text-sm text-zinc-600 sm:text-base">
                Suara Anda telah berhasil direkam. Terima kasih telah berpartisipasi dalam pemilihan Ketua BEM.
              </p>
            </div>

            {/* Security Notice */}
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
                <div className="text-sm text-amber-800">
                  <div className="font-semibold">Keamanan Terjamin</div>
                  <div className="mt-1">
                    Demi keamanan dan privasi, sesi voting Anda telah diakhiri secara otomatis.
                  </div>
                </div>
              </div>
            </div>

            {/* Auto-redirect Notice */}
            <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-zinc-500" />
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-900">Pengalihan Otomatis</div>
                  <div className="text-xs text-zinc-600">
                    Anda akan dialihkan ke beranda dalam {countdown} detik
                  </div>
                </div>
                <div className="text-lg font-bold text-gov-accent">
                  {countdown}
                </div>
              </div>
            </div>

            {/* Action Button */}
            <button
              type="button"
              onClick={goHome}
              className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl bg-gov-accent px-4 text-sm font-semibold text-white shadow-sm transition-all hover:bg-gov-accent/95 focus:outline-none focus:ring-4 focus:ring-gov-accent/20"
            >
              <Home className="mr-2 h-4 w-4" />
              Kembali ke Beranda
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>

            {/* Additional Info */}
            <div className="mt-4 text-center">
              <p className="text-xs text-zinc-500">
                Hasil resmi akan diumumkan oleh panitia pemilihan
              </p>
            </div>
          </div>

          {/* Quick Links - Mobile Optimized */}
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="text-center">
              <div className="text-sm font-medium text-zinc-900">Ingin melihat hasil?</div>
              <div className="mt-2 text-xs text-zinc-600">
                Cek halaman hasil untuk melihat rekapitulasi suara
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => navigate('/results')}
                  className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Hasil Akhir
                </button>
                <button
                  onClick={() => navigate('/live')}
                  className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Live Count
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
