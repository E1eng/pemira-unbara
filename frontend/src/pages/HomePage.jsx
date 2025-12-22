import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { BarChart3, LockKeyhole, UserCog, Vote, ChevronRight, Shield, Clock } from 'lucide-react'
import Layout from '../components/Layout.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { SparklesCore } from '../components/ui/sparkles.jsx'
import { TextGenerateEffect } from '../components/ui/text-generate-effect.jsx'

import { BackgroundGradient } from '../components/ui/background-gradient.jsx'
import { cn } from '../lib/utils.js'

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
      <div className="space-y-8 pb-10">
        {/* Welcome Section - Mobile First with Sparkles */}
        <div className="relative overflow-hidden rounded-3xl bg-gov-blue shadow-xl">
          <div className="absolute inset-0 h-full w-full">
            <SparklesCore
              id="tsparticlesfullpage"
              background="transparent"
              minSize={0.6}
              maxSize={1.4}
              particleDensity={100}
              className="h-full w-full"
              particleColor="#FFFFFF"
            />
          </div>

          <div className="relative z-20 p-6 sm:p-10 text-center sm:text-left">
            <div className="flex flex-col gap-6">
              <div>
                <div className="inline-block rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-semibold text-indigo-200 backdrop-blur-md border border-indigo-500/30">
                  PEMIRA BEM 2025
                </div>
                <div className="mt-2 text-white">
                  <TextGenerateEffect
                    words="E-Voting Mahasiswa BEM"
                    className="text-3xl font-bold tracking-tight sm:text-4xl text-white"
                  />
                  <p className="mt-2 text-zinc-300 max-w-lg mx-auto sm:mx-0">
                    Suara Anda menentukan masa depan. Pilih pemimpin terbaik untuk BEM yang lebih baik.
                  </p>
                </div>
              </div>

              {/* Status Cards - with BackgroundGradient */}
              <div className="grid gap-6 sm:grid-cols-2">
                <BackgroundGradient className="rounded-[22px] bg-white dark:bg-zinc-900 p-4 h-full">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 dark:bg-emerald-900/30">
                      <Vote className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Status Voting</div>
                      <div className={cn("text-base font-bold", settings?.is_voting_open ? 'text-emerald-600 dark:text-emerald-400' : 'text-zinc-500')}>
                        {settings ? (settings.is_voting_open ? 'Sedang Dibuka' : 'Ditutup') : '—'}
                      </div>
                    </div>
                  </div>
                </BackgroundGradient>

                <BackgroundGradient className="rounded-[22px] bg-white dark:bg-zinc-900 p-4 h-full">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
                      <BarChart3 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <div className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Live Result</div>
                      <div className={cn("text-base font-bold", settings?.show_live_result ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-500')}>
                        {settings ? (settings.show_live_result ? 'Ditayangkan' : 'Rahasia') : '—'}
                      </div>
                    </div>
                  </div>
                </BackgroundGradient>
              </div>

              {/* User Status */}
              {isAuthenticated && (
                <div className="mt-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 backdrop-blur-sm">
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center gap-3">
                      <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                        <Shield className="h-4 w-4 text-emerald-400" />
                      </div>
                      <div>
                        <div className="text-xs text-zinc-400">Login sebagai</div>
                        <div className="font-mono text-sm font-semibold tracking-wider">{nim}</div>
                      </div>
                    </div>
                    <button
                      onClick={logout}
                      className="text-xs font-medium text-red-300 hover:text-red-200 bg-red-500/10 hover:bg-red-500/20 px-3 py-1.5 rounded-lg transition-colors border border-red-500/20"
                    >
                      Keluar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions - 3D Cards */}
        <div className="grid gap-6 sm:grid-cols-2">
          <Link to={isAuthenticated ? '/vote' : '/login'} className="block h-full group">
            <div className="h-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-gov-accent/50 flex flex-col">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-zinc-800">
                  Bilik Suara Digital
                </h3>
                <p className="text-zinc-500 text-sm mt-2 max-w-sm">
                  {isAuthenticated ? 'Lanjutkan untuk memilih kandidat.' : 'Login untuk mulai voting.'}
                </p>
              </div>

              <div className="mt-auto">
                <div className="flex items-center justify-between rounded-xl bg-gov-accent px-4 py-3 text-white shadow-sm group-hover:shadow-md transition-all">
                  <span className="font-semibold">Mulai Voting</span>
                  <Vote className="h-5 w-5" />
                </div>
              </div>
            </div>
          </Link>

          <Link to="/results" className="block h-full group">
            <div className="h-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-sky-500/50 flex flex-col">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-zinc-800">
                  Rekapitulasi Suara
                </h3>
                <p className="text-zinc-500 text-sm mt-2 max-w-sm">
                  Pantau hasil pemilihan secara realtime & transparan.
                </p>
              </div>

              <div className="mt-auto">
                <div className="flex items-center justify-between rounded-xl bg-sky-600 px-4 py-3 text-white shadow-sm group-hover:shadow-md transition-all">
                  <span className="font-semibold">Lihat Hasil</span>
                  <BarChart3 className="h-5 w-5" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Instructions - Clean Design */}
        <div className="rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gov-blue text-white shadow-md shadow-gov-blue/20">
              <span className="text-lg font-bold">?</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gov-blue">Cara Memilih</h2>
              <p className="text-xs text-zinc-500">Panduan singkat e-voting</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { id: 1, title: 'Login', desc: 'Masuk dengan NIM & Kode Akses.' },
              { id: 2, title: 'Pilih', desc: 'Tentukan pilihan kandidat Anda.' },
              { id: 3, title: 'Selesai', desc: 'Logout otomatis demi keamanan.' }
            ].map((step) => (
              <div key={step.id} className="flex items-start gap-4 p-3 rounded-2xl hover:bg-zinc-50 transition-colors">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-zinc-100 text-sm font-bold text-zinc-600 border border-zinc-200">
                  {step.id}
                </div>
                <div>
                  <div className="font-semibold text-zinc-900">{step.title}</div>
                  <div className="text-sm text-zinc-600">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}

