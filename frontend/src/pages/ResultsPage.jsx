import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Toast from '../components/Toast.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { BarChart3, Lock, RefreshCw, Trophy, Users, Vote } from 'lucide-react'

// --- Components ---

function StatCard({ label, value, sublabel, icon: Icon, colorClass }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white/60 border border-white/40 shadow-sm backdrop-blur-sm text-center">
      <div className={`p-2 rounded-xl ${colorClass} bg-opacity-10 mb-2`}>
        <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</span>
      <span className="text-xl font-bold text-zinc-900 leading-tight mt-0.5">{value}</span>
      {sublabel && <span className="text-[10px] text-zinc-400 font-medium">{sublabel}</span>}
    </div>
  )
}

function LeaderCard({ candidate, pct, totalVotes, isVotingOpen }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative w-full overflow-hidden rounded-[2rem] bg-white border border-indigo-100 shadow-xl shadow-indigo-500/10"
    >
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-indigo-50 to-transparent pointer-events-none" />
      <div className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-xl border border-indigo-50 shadow-sm z-10">
        <Trophy className="w-6 h-6 text-amber-500 fill-amber-500" />
      </div>

      <div className="flex flex-col items-center pt-8 pb-6 px-6 relative z-10 text-center">
        {/* Photo with Ring */}
        <div className="relative mb-4">
          <div className="w-28 h-28 rounded-3xl overflow-hidden border-4 border-white shadow-lg bg-zinc-100">
            {candidate.photoUrl ? (
              <img src={candidate.photoUrl} alt={candidate.chairmanName} className="w-full h-full object-cover object-top" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-zinc-300"><Users className="w-10 h-10" /></div>
            )}
          </div>
          <div className="absolute -bottom-3 inset-x-0 flex justify-center">
            <span className="bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              #{candidate.candidateNumber}
            </span>
          </div>
        </div>

        {/* Names */}
        <h2 className="text-2xl font-bold text-zinc-900 leading-tight">
          {candidate.chairmanName}
        </h2>
        <p className="text-sm font-medium text-zinc-500 mt-1">
          & {candidate.viceChairmanName}
        </p>

        {/* Big Percentage */}
        <div className="mt-6 mb-2">
          <span className="text-5xl font-black text-indigo-600 tracking-tighter">{pct}%</span>
          <span className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mt-1">{candidate.total.toLocaleString()} Suara</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden relative mt-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-indigo-500 to-indigo-400 rounded-full"
          />
        </div>

        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 border border-indigo-100 text-[10px] font-bold text-indigo-700 uppercase tracking-wide">
          {isVotingOpen ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              Memimpin Sementara
            </>
          ) : (
            <>
              <Trophy className="w-3 h-3" />
              Pemenang Voting
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

function CandidateItem({ candidate, pct, index }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-zinc-200 shadow-sm"
    >
      <div className="w-14 h-14 shrink-0 rounded-xl bg-zinc-100 overflow-hidden border border-zinc-100">
        {candidate.photoUrl ? (
          <img src={candidate.photoUrl} alt={candidate.chairmanName} className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300"><Users className="w-6 h-6" /></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1">
          <div>
            <h3 className="text-sm font-bold text-zinc-900 truncate pr-2">{candidate.chairmanName}</h3>
            <p className="text-xs text-zinc-500 truncate">{candidate.viceChairmanName}</p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-lg font-bold text-zinc-900">{pct}%</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              className="h-full bg-zinc-400 rounded-full"
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-400 shrink-0">{candidate.total} Suara</span>
        </div>
      </div>

      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 text-xs font-bold text-zinc-500">
        {candidate.candidateNumber}
      </div>
    </motion.div>
  )
}

// --- Main Page ---

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
      setRows([]); setLoading(false); setRefreshing(false);
      return
    }
    const isInitialLoad = rowsRef.current.length === 0
    if (isInitialLoad) setLoading(true)
    else setRefreshing(true)

    const [rpc, votersRef] = await Promise.all([
      supabase.rpc('get_vote_recap'),
      supabase.from('voters').select('*', { count: 'exact', head: true })
    ])

    if (votersRef.count !== null) setTotalDpt(votersRef.count)

    if (!rpc.error && Array.isArray(rpc.data)) {
      const mapped = rpc.data.map((r) => ({
        candidateNumber: r.candidate_number,
        chairmanName: r.chairman_name,
        viceChairmanName: r.vice_chairman_name,
        photoUrl: r.photo_url,
        total: Number(r.total_votes ?? 0),
      })).sort((a, b) => b.total - a.total)

      rowsRef.current = mapped
      setRows(mapped)
    } else {
      setRows([])
      setToast({ open: true, message: rpc.error?.message || 'Gagal memuat data' })
    }
    setLoading(false)
    setRefreshing(false)
  }, [checkSettings])

  useEffect(() => {
    fetchRecap()
    const interval = setInterval(fetchRecap, 10000)
    return () => clearInterval(interval)
  }, [fetchRecap])

  const totalVotes = useMemo(() => rows.reduce((sum, r) => sum + r.total, 0), [rows])
  const [leader, ...runnersUp] = rows

  // --- Render States ---

  if (showLiveResult === false) {
    return (
      <Layout>
        <div className="flex min-h-[80vh] w-full items-center justify-center p-6">
          <div className="flex flex-col items-center text-center max-w-sm">
            <div className="w-20 h-20 bg-zinc-100 rounded-3xl flex items-center justify-center mb-6">
              <Lock className="w-8 h-8 text-zinc-400" />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900">Hasil Belum Tersedia</h2>
            <p className="text-zinc-500 mt-2 mb-8 leading-relaxed">
              Hasil pemilihan masih bersifat rahasia dan belum dibuka untuk publik.
            </p>
            <button onClick={() => navigate('/')} className="w-full py-3 bg-zinc-900 text-white rounded-xl font-semibold hover:bg-zinc-800 transition-colors">
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  if (loading && rows.length === 0) {
    return (
      <Layout>
        <div className="flex min-h-screen items-center justify-center">
          <RefreshCw className="w-6 h-6 animate-spin text-zinc-400" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="w-full max-w-md mx-auto pb-24 pt-2 px-4 space-y-6">
        <Toast open={toast.open} variant="error" message={toast.message} onClose={() => setToast({ open: false, message: '' })} />

        {/* Compact Header */}
        <div className="flex items-center justify-between pb-2">
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Real Count</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-1.5 h-1.5 rounded-full ${refreshing ? 'bg-indigo-500 animate-pulse' : 'bg-emerald-500'}`}></span>
              <span className="text-xs font-medium text-zinc-500">Live Update</span>
            </div>
          </div>
          <div className="bg-white/50 backdrop-blur px-3 py-1.5 rounded-lg border border-white/40 shadow-sm">
            <span className="text-xs font-bold text-indigo-600">{totalVotes.toLocaleString()}</span>
            <span className="text-[10px] text-zinc-400 ml-1 font-medium">Suara Masuk</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            label="Total DPT"
            value={totalDpt.toLocaleString()}
            sublabel="Mahasiswa"
            icon={Users}
            colorClass="bg-emerald-500 text-emerald-600"
          />
          <StatCard
            label="Partisipasi"
            value={`${totalDpt > 0 ? Math.round((totalVotes / totalDpt) * 100) : 0}%`}
            sublabel={`${(totalDpt - totalVotes).toLocaleString()} Belum`}
            icon={BarChart3}
            colorClass="bg-blue-500 text-blue-600"
          />
        </div>

        {/* Leader Spotlight */}
        {leader ? (
          <div className="mt-4">
            <LeaderCard
              candidate={leader}
              pct={totalVotes > 0 ? Math.round((leader.total / totalVotes) * 100) : 0}
              isVotingOpen={isVotingOpen}
            />
          </div>
        ) : (
          <div className="py-20 text-center text-zinc-400">Belum ada data suara.</div>
        )}

        {/* Runners Up List */}
        {runnersUp.length > 0 && (
          <div className="mt-8">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-3 px-1">Kandidat Lainnya</span>
            <div className="space-y-3">
              {runnersUp.map((r, i) => (
                <CandidateItem
                  key={r.candidateNumber}
                  candidate={r}
                  index={i}
                  pct={totalVotes > 0 ? Math.round((r.total / totalVotes) * 100) : 0}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
