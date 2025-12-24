import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart3, LockKeyhole, UserCog, Vote, ChevronRight, Shield, Clock, Users, Instagram } from 'lucide-react'
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
  const [dptCount, setDptCount] = useState(0)
  const [recapSummary, setRecapSummary] = useState({ total: null, leader: null })

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      // Parallel fetch settings and DPT
      const [settingsRes, votersRes] = await Promise.all([
        supabase.from('election_settings').select('is_voting_open, show_live_result').single(),
        supabase.from('voters').select('*', { count: 'exact', head: true })
      ])

      if (cancelled) return

      if (!settingsRes.error && settingsRes.data) setSettings(settingsRes.data)
      if (votersRes.count !== null) setDptCount(votersRes.count)
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
      <div className="space-y-12 pb-6">
        {/* Hero Section - Premium Dark */}
        <div className="relative overflow-hidden rounded-[2.5rem] bg-zinc-900 border border-zinc-800 shadow-2xl">
          <div className="absolute inset-0 h-full w-full opacity-60">
            <SparklesCore
              id="tsparticlesfullpage"
              background="transparent"
              minSize={0.6}
              maxSize={1.4}
              particleDensity={70}
              className="h-full w-full"
              particleColor="#FFFFFF"
            />
          </div>

          <div className="relative z-20 px-8 py-20 sm:px-16 sm:py-24 text-center sm:text-left">
            <div className="flex flex-col gap-6 max-w-2xl">
              <div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-xs font-semibold text-indigo-300 border border-indigo-500/20 backdrop-blur-md mb-6"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  PEMIRA UNABARA 2026
                </motion.div>

                <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6 leading-[1.1]">
                  Suara Anda, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                    Masa Depan Kampus.
                  </span>
                </h1>

                <p className="text-lg text-zinc-400 leading-relaxed max-w-lg">
                  Platform e-voting modern untuk pemilihan umu raya yang transparan, jujur, dan efisien.
                </p>
              </div>

              {isAuthenticated && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 flex items-center gap-4 text-sm text-zinc-400 bg-white/5 w-fit px-4 py-2 rounded-xl border border-white/10 backdrop-blur-sm"
                >
                  <UserCog className="h-4 w-4 text-zinc-300" />
                  <span>Login sebagai <span className="text-white font-mono font-semibold">{nim}</span></span>
                  <button onClick={logout} className="ml-2 text-xs text-red-400 hover:text-red-300 transition-colors">Keluar</button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* Status Grid - Clean & Minimal */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Voting Status */}
          <div className={`group relative rounded-3xl border p-6 transition-all duration-300 ${settings?.is_voting_open ? 'bg-white border-zinc-200 hover:border-emerald-200 hover:shadow-lg hover:shadow-emerald-500/5' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500 mb-1">Status Voting</p>
                <h3 className={`text-2xl font-bold ${settings?.is_voting_open ? 'text-zinc-900' : 'text-zinc-400'}`}>
                  {settings ? (settings.is_voting_open ? 'Dibuka' : 'Ditutup') : '—'}
                </h3>
              </div>
              <div className={`p-3 rounded-2xl ${settings?.is_voting_open ? 'bg-emerald-500/10 text-emerald-600' : 'bg-zinc-200 text-zinc-500'}`}>
                <Clock className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* Live Result Status */}
          <div className={`group relative rounded-3xl border p-6 transition-all duration-300 ${settings?.show_live_result ? 'bg-white border-zinc-200 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-500/5' : 'bg-zinc-50 border-zinc-200'}`}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-zinc-500 mb-1">Live Result</p>
                <h3 className={`text-2xl font-bold ${settings?.show_live_result ? 'text-zinc-900' : 'text-zinc-400'}`}>
                  {settings ? (settings.show_live_result ? 'Aktif' : 'Terkunci') : '—'}
                </h3>
              </div>
              <div className={`p-3 rounded-2xl ${settings?.show_live_result ? 'bg-blue-500/10 text-blue-600' : 'bg-zinc-200 text-zinc-500'}`}>
                <BarChart3 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Total DPT */}
          <div className="group relative rounded-3xl border border-zinc-200 bg-white p-6 transition-all duration-300 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 sm:col-span-2">
            <div className="flex items-center gap-6">
              <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-600">
                <Users className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-500 mb-1">Total Daftar Pemilih</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-4xl font-bold text-zinc-900 tracking-tight">
                    {dptCount.toLocaleString()}
                  </h3>
                  <span className="text-xl text-zinc-500 font-medium">mahasiswa</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Primary Actions */}
        <div className="grid gap-6 sm:grid-cols-2">
          <Link to={isAuthenticated ? '/vote' : '/login'} className="block group">
            <div className="relative h-full overflow-hidden rounded-3xl bg-gradient-to-br from-indigo-500 to-violet-600 p-8 text-white shadow-xl transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/20">
              <div className="relative z-10 flex flex-col h-full justify-between min-h-[180px]">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Bilik Suara</h3>
                  <p className="text-indigo-100 max-w-xs leading-relaxed">
                    Masuk ke bilik suara digital untuk menggunakan hak pilih Anda sekarang.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-semibold bg-white/10 w-fit px-4 py-2 rounded-xl backdrop-blur-md mt-6 group-hover:bg-white/20 transition-colors">
                  <span>Mulai Voting</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>

              {/* Decorative Circle */}
              <div className="absolute -bottom-12 -right-12 h-64 w-64 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-colors pointer-events-none" />
            </div>
          </Link>

          <Link to="/results" className="block group">
            <div className="relative h-full overflow-hidden rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm transition-all duration-300 hover:border-zinc-300 hover:shadow-xl hover:scale-[1.02]">
              <div className="relative z-10 flex flex-col h-full justify-between min-h-[180px]">
                <div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-2">Hasil Real Count</h3>
                  <p className="text-zinc-500 max-w-xs leading-relaxed">
                    Lihat perolehan suara sementara secara realtime dan transparan.
                  </p>
                </div>
                <div className="flex items-center gap-2 font-semibold text-zinc-900 bg-zinc-100 w-fit px-4 py-2 rounded-xl mt-6 group-hover:bg-zinc-200 transition-colors">
                  <span>Lihat Grafik</span>
                  <BarChart3 className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Footer simple mark */}
        <div className="text-center pt-0 pb-8 flex flex-col items-center gap-3">
          <div className="flex gap-3 flex-wrap justify-center">
            <a
              href="https://instagram.com/bemkmunbara"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-zinc-200 text-zinc-600 hover:text-pink-600 hover:border-pink-200 hover:bg-pink-50 transition-all duration-300 group"
            >
              <Instagram className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold">Instagram BEM</span>
            </a>
            <a
              href="https://instagram.com/dpm.unbara"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-zinc-200 text-zinc-600 hover:text-pink-600 hover:border-pink-200 hover:bg-pink-50 transition-all duration-300 group"
            >
              <Instagram className="h-4 w-4 group-hover:scale-110 transition-transform" />
              <span className="text-sm font-semibold">Instagram DPM</span>
            </a>
          </div>
          <p className="text-xs text-zinc-300 font-medium">
            Sistem terenkripsi & terverifikasi oleh KPU Kemahasiswaan
          </p>
        </div>
      </div>
    </Layout>
  )
}


