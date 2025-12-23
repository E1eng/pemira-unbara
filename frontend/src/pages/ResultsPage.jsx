import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Toast from '../components/Toast.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { BarChart3, Lock, RefreshCw, Trophy, Users } from 'lucide-react'
import { MovingBorderButton } from '../components/ui/moving-border.jsx'

function RowSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-4 w-24 animate-pulse rounded bg-zinc-200" />
        <div className="h-3 flex-1 animate-pulse rounded bg-zinc-200" />
        <div className="h-4 w-8 animate-pulse rounded bg-zinc-200" />
      </div>
    </div>
  )
}

export default function ResultsPage() {
  const navigate = useNavigate()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showLiveResult, setShowLiveResult] = useState(null)
  const [isVotingOpen, setIsVotingOpen] = useState(true)
  const [totalDpt, setTotalDpt] = useState(0)
  const rowsRef = useRef([])
  const [toast, setToast] = useState({ open: false, message: '' })

  const checkSettings = useCallback(async () => {
    const { data, error } = await supabase.from('election_settings').select('show_live_result, is_voting_open').eq('id', 1).single()

    if (error || !data) {
      setShowLiveResult(false)
      return false
    }

    setIsVotingOpen(data.is_voting_open)
    setShowLiveResult(data.show_live_result === true)
    return data.show_live_result === true
  }, [])

  const fetchRecap = useCallback(async () => {
    const allowed = await checkSettings()
    if (!allowed) {
      setRows([])
      setLoading(false)
      setRefreshing(false)
      return
    }

    const isInitialLoad = rowsRef.current.length === 0
    if (isInitialLoad) {
      setLoading(true)
    } else {
      setRefreshing(true)
    }

    // Parallel fetching for performance
    const [rpc, votersRef] = await Promise.all([
      supabase.rpc('get_vote_recap'),
      supabase.from('voters').select('*', { count: 'exact', head: true })
    ])

    if (votersRef.count !== null) {
      setTotalDpt(votersRef.count)
    }

    if (!rpc.error && Array.isArray(rpc.data)) {
      const mapped = rpc.data
        .map((r) => ({
          candidateNumber: r.candidate_number,
          chairmanName: r.chairman_name,
          viceChairmanName: r.vice_chairman_name,
          photoUrl: r.photo_url,
          total: Number(r.total_votes ?? 0),
        }))
        .sort((a, b) => b.total - a.total)

      rowsRef.current = mapped
      setRows(mapped)
      setLoading(false)
      setRefreshing(false)
      return
    }

    rowsRef.current = []
    setRows([])
    setLoading(false)
    setRefreshing(false)
    setToast({ open: true, message: rpc.error?.message || 'Tidak dapat memuat hasil.' })
  }, [checkSettings])

  useEffect(() => {
    fetchRecap()
    const interval = setInterval(fetchRecap, 10000)
    return () => clearInterval(interval)
  }, [fetchRecap])

  const totalVotes = useMemo(() => rows.reduce((sum, r) => sum + r.total, 0), [rows])
  const leader = rows[0]

  if (showLiveResult === false) {
    return (
      <Layout>
        <div className="flex min-h-[calc(100vh-64px)] w-full items-center justify-center p-4">
          <div className="rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur-md p-8 text-center shadow-xl max-w-md w-full">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 shadow-inner">
              <Lock className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="mt-6 text-xl font-bold text-gov-blue">Hasil Belum Dipublikasikan</h1>
            <p className="mt-3 text-sm text-zinc-600">
              Hasil rekapitulasi suara belum dibuka untuk publik oleh panitia.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-gov-accent px-6 text-sm font-semibold text-white shadow-lg shadow-gov-accent/20 hover:bg-gov-accent/95 hover:shadow-gov-accent/30 transition-all"
            >
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  if (showLiveResult === null) {
    return (
      <Layout>
        <div className="flex min-h-[calc(100vh-64px)] w-full items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
            <div className="text-sm text-zinc-500">Memuat data...</div>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="w-full space-y-8 pt-0 pb-20">
        <Toast
          open={toast.open}
          variant="error"
          title="Gagal memuat"
          message={toast.message}
          onClose={() => setToast({ open: false, message: '' })}
        />

        {/* Sticky Header with Glassmorphism */}
        {/* Header Block */}
        <div className="relative rounded-2xl px-5 py-4 bg-white/90 backdrop-blur-xl border border-zinc-200/50 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Hasil Suara BEM</h1>
            <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-medium text-zinc-500 mt-1">
              <span className={`h-2 w-2 rounded-full ${refreshing ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`} />
              <span>{refreshing ? 'Sinkronisasi data...' : 'Data Realtime'}</span>
              <span className="text-zinc-300">•</span>
              <span>Update tiap 10 detik</span>
            </div>
          </div>

          <div className="flex w-full sm:w-auto items-center gap-3">
            {/* Total DPT Card */}
            <div className="flex-1 sm:flex-initial flex items-center justify-between sm:justify-start gap-3 px-4 py-3 rounded-xl border border-zinc-100 bg-white/50">
              <div className="text-right sm:text-left">
                <p className="text-[10px] uppercase font-bold text-zinc-400 tracking-wider">Total DPT</p>
                <p className="text-lg font-bold text-zinc-900 leading-none">{totalDpt.toLocaleString()}</p>
              </div>
            </div>

            {/* Total Votes Card */}
            <div className="flex-1 sm:flex-initial flex items-center justify-between sm:justify-start gap-3 px-4 py-3 rounded-xl border border-indigo-100 bg-indigo-50/30">
              <div className="order-last sm:order-first bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
                <Users className="h-4 w-4" />
              </div>
              <div className="text-left sm:text-right">
                <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-wider">Suara Masuk</p>
                <p className="text-lg font-bold text-indigo-900 leading-none">{totalVotes.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Leader Card */}
        {leader && (
          <div className="flex justify-center w-full">
            <MovingBorderButton
              borderRadius="1.5rem"
              as="div"
              containerClassName="h-auto w-full max-w-2xl bg-white shadow-xl"
              className="bg-white text-zinc-900 border-zinc-100"
              duration={3000}
            >
              <div className="flex flex-col sm:flex-row w-full items-center gap-6 p-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Trophy className="w-24 h-24 text-indigo-500 rotate-12" />
                </div>

                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl shadow-lg border-2 ${isVotingOpen ? 'bg-amber-50 border-amber-100 text-amber-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                  <Trophy className="h-8 w-8" />
                </div>

                <div className="flex-1 min-w-0 text-center sm:text-left relative z-10">
                  <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2 ${isVotingOpen ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                    {isVotingOpen ? 'Memimpin Sementara' : 'Pemenang'}
                    {isVotingOpen && <span className="animate-pulse">●</span>}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 truncate tracking-tight">
                    {leader.chairmanName}
                  </h2>
                  <p className="text-base text-zinc-500 font-medium mt-0.5">
                    & {leader.viceChairmanName}
                  </p>
                  <p className="text-sm3 Suara text-zinc-400 mt-1.5 font-mono">Paslon No. {leader.candidateNumber}</p>
                </div>

                <div className="text-center sm:text-right relative z-10 bg-zinc-50 px-5 py-2.5 rounded-2xl border border-zinc-100">
                  <div className="text-3xl font-bold text-indigo-600 tracking-tighter">
                    {totalVotes > 0 ? Math.round((leader.total / totalVotes) * 100) : 0}%
                  </div>
                  <div className="text-xs text-zinc-500 font-medium">{leader.total} Suara</div>
                </div>
              </div>
            </MovingBorderButton>
          </div>
        )}

        {/* Results List */}
        <div className={`space-y-4 transition-all duration-500 max-w-3xl mx-auto ${refreshing ? 'opacity-50 grayscale' : 'opacity-100'}`}>
          {loading ? (
            <>
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center rounded-3xl border border-dashed border-zinc-300 bg-zinc-50/50">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <BarChart3 className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-semibold text-zinc-900">Belum ada suara masuk</h3>
              <p className="text-sm text-zinc-500 max-w-xs mx-auto mt-1">Data akan muncul secara otomatis saat voting dimulai.</p>
            </div>
          ) : (
            rows.map((r, index) => {
              const pct = totalVotes > 0 ? Math.round((r.total / totalVotes) * 100) : 0
              const isLeader = index === 0

              return (
                <div
                  key={r.candidateNumber || index}
                  className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${isLeader ? 'bg-white border-indigo-200 shadow-lg shadow-indigo-500/10 ring-1 ring-indigo-500/20' : 'bg-white border-zinc-200 shadow-sm hover:shadow-md'}`}
                >
                  {/* Decorative Gradient for Leader */}
                  {isLeader && <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-bl-full -mr-8 -mt-8 pointer-events-none" />}

                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 relative z-10">
                    {/* Header / Avatar Section */}
                    <div className="flex items-center gap-4">
                      {/* Rank/Number Badge */}
                      <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-lg font-bold shadow-sm border ${isLeader ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-zinc-100 text-zinc-500 border-zinc-200'}`}>
                        {r.candidateNumber || index + 1}
                      </div>

                      {/* Candidate Avatar */}
                      <div className="h-14 w-14 sm:h-16 sm:w-16 shrink-0 rounded-full bg-zinc-100 overflow-hidden border-2 border-white shadow-sm ring-1 ring-zinc-100">
                        {r.photoUrl ? (
                          <img
                            src={r.photoUrl}
                            alt={r.chairmanName}
                            className="h-full w-full object-cover object-top"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none'; // Hide if broken
                              e.currentTarget.nextSibling.style.display = 'flex'; // Show fallback
                            }}
                          />
                        ) : null}
                        <div className="hidden h-full w-full items-center justify-center bg-zinc-100 text-zinc-300" style={{ display: r.photoUrl ? 'none' : 'flex' }}>
                          <Users className="h-6 w-6" />
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="flex-1 min-w-0 pt-2 sm:pt-0">
                      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-1 mb-3">
                        <div className="min-w-0 pr-2">
                          <h3 className={`text-lg sm:text-lg font-bold truncate tracking-tight ${isLeader ? 'text-zinc-900' : 'text-zinc-700'}`}>
                            {r.chairmanName}
                          </h3>
                          <p className="text-sm text-zinc-500 font-medium truncate">
                            & {r.viceChairmanName}
                          </p>
                        </div>

                        <div className="flex items-center justify-between sm:block mt-2 sm:mt-0 sm:text-right">
                          <span className="text-2xl font-bold text-zinc-900 tracking-tight">{pct}%</span>
                          <span className="block text-[10px] sm:hidden text-zinc-400 font-medium">dari total suara</span>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-3 w-full rounded-full bg-zinc-100 overflow-hidden ring-1 ring-black/5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1.2, ease: "circOut" }}
                          className={`h-full rounded-full relative ${isLeader ? 'bg-gradient-to-r from-indigo-500 to-indigo-400' : 'bg-zinc-400'}`}
                        >
                          <div className="absolute inset-0 w-full h-full opacity-30" style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.2) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.2) 50%,rgba(255,255,255,.2) 75%,transparent 75%,transparent)', backgroundSize: '8px 8px' }} />
                        </motion.div>
                      </div>

                      <div className="mt-2.5 flex justify-between items-center text-xs">
                        <div className="flex items-center gap-1.5">
                          {isLeader && <Trophy className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />}
                          <span className={isLeader ? 'text-indigo-600 font-medium' : 'text-zinc-400'}>
                            {isLeader ? 'Suara Terbanyak' : 'Perolehan Suara'}
                          </span>
                        </div>
                        <div className="font-mono font-bold text-zinc-600 bg-zinc-100 px-2 py-0.5 rounded text-[10px]">
                          {r.total.toLocaleString()} Suara
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </Layout>
  )
}
