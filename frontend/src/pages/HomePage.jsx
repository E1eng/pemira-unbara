import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, LockKeyhole, UserCog, Vote, ChevronRight, Shield, Clock } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'

export default function HomePage() {
  const { nim, isAuthenticated, logout } = useAuth()
  const [settings, setSettings] = useState(null)
  const [recapSummary, setRecapSummary] = useState({ total: null, leader: null })

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      const { data, error } = await supabase.from('election_settings').select('is_voting_open, show_live_result').single()
      if (cancelled) return
      if (!error && data) setSettings(data)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const loadRecap = async () => {
      const { data, error } = await supabase.rpc('get_vote_recap')
      if (cancelled) return
      if (!error && Array.isArray(data) && data.length > 0) {
        const sorted = [...data]
          .map((r) => ({
            name: r.chairman_name || 'Unknown',
            total: Number(r.total_votes ?? 0),
          }))
          .sort((a, b) => b.total - a.total)
        const total = sorted.reduce((sum, item) => sum + item.total, 0)
        setRecapSummary({
          total,
          leader: sorted[0]?.name ?? null,
        })
      } else {
        setRecapSummary({ total: 0, leader: null })
      }
    }

    loadRecap()
    const interval = setInterval(loadRecap, 10000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Section - Mobile First */}
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
          <div className="bg-gradient-to-br from-gov-acent/10 via-white to-white p-4 sm:p-6">
            <div className="flex flex-col gap-4">
              <div>
                <div className="text-sm font-semibold text-gov-accent">PEMIRA BEM</div>
                <h1 className="mt-1 text-xl font-bold tracking-tight text-gov-blue sm:text-2xl">
                  E-Voting Mahasiswa
                </h1>
                <p className="mt-2 text-sm text-zinc-600">
                  Pemilihan Raya Badan Eksekutif Mahasiswa
                </p>
              </div>

              {/* Status Cards - Mobile Optimized */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-zinc-200 bg-white p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50">
                        <Vote className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <div className="text-xs font-medium text-zinc-600">Voting</div>
                        <div className={`text-sm font-semibold ${settings?.is_voting_open ? 'text-emerald-600' : 'text-zinc-500'}`}>
                          {settings ? (settings.is_voting_open ? 'Dibuka' : 'Ditutup') : '—'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-zinc-200 bg-white p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50">
                      <BarChart3 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-zinc-600">Rekap</div>
                      <div
                        className={`text-sm font-semibold ${settings?.show_live_result ? 'text-blue-600' : 'text-zinc-500'
                          }`}
                      >
                        {settings
                          ? settings.show_live_result
                            ? 'Ditayangkan'
                            : 'Disembunyikan'
                          : '—'}
                      </div>
                      <div className="text-[11px] text-zinc-500">
                        {recapSummary.leader
                          ? `Unggul: ${recapSummary.leader}`
                          : settings?.show_live_result
                            ? 'Menunggu data'
                            : 'Aktifkan di dashboard'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* User Status */}
              {isAuthenticated && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-emerald-600" />
                      <div className="text-sm text-emerald-900">
                        <span className="font-medium">NIM:</span> <span className="font-mono">{nim}</span>
                      </div>
                    </div>
                    <button
                      onClick={logout}
                      className="text-xs text-emerald-700 hover:text-emerald-900"
                    >
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions - Mobile Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
          <Link
            to={isAuthenticated ? '/vote' : '/login'}
            className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-gov-accent/50"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gov-accent/10 text-gov-accent">
                  <Vote className="h-5 w-5" />
                </div>
                <div className="mt-3">
                  <div className="font-semibold text-zinc-900">Bilik Suara</div>
                  <div className="mt-1 text-sm text-zinc-600">
                    {isAuthenticated ? 'Lanjutkan voting' : 'Masuk untuk voting'}
                  </div>
                </div>
              </div>
              <ChevronRight className="mt-8 h-4 w-4 text-zinc-400 transition-colors group-hover:text-gov-accent" />
            </div>
          </Link>

          <Link
            to="/results"
            className="group rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm transition-all hover:shadow-md hover:border-sky-200"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div className="mt-3">
                  <div className="font-semibold text-zinc-900">Rekap Suara</div>
                  <div className="mt-1 text-sm text-zinc-600">Lihat hasil voting</div>
                </div>
              </div>
              <ChevronRight className="mt-8 h-4 w-4 text-zinc-400 transition-colors group-hover:text-sky-600" />
            </div>
          </Link>
        </div>

        {/* Instructions - Mobile Optimized */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-center gap-2 text-sm font-semibold text-gov-blue">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gov-accent/10 text-xs font-bold text-gov-accent">
              ?
            </div>
            Cara Memilih
          </div>

          <div className="mt-4 space-y-3">
            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-gov-accent text-xs font-bold text-white">
                1
              </div>
              <div className="text-sm text-zinc-700">
                <span className="font-medium">Masuk untuk Voting</span> - Gunakan NIM/NPM dan Kode Akses dari panitia
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-gov-accent text-xs font-bold text-white">
                2
              </div>
              <div className="text-sm text-zinc-700">
                <span className="font-medium">Pilih Kandidat</span> - Pilih salah satu kandidat dan konfirmasi pilihan
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-gov-accent text-xs font-bold text-white">
                3
              </div>
              <div className="text-sm text-zinc-700">
                <span className="font-medium">Selesai</span> - Sesi otomatis berakhir untuk keamanan data
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
