import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Toast from '../components/Toast.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { BarChart3, Clock, Lock, RefreshCw, Trophy, Users, Vote } from 'lucide-react'

// --- Helpers ---

/**
 * Largest-remainder method: hitung persentase integer yang totalnya selalu 100.
 * Mencegah anomali "33% + 33% + 33% = 99%".
 */
function computeIntegerPercentages(values) {
  const sum = values.reduce((a, b) => a + b, 0)
  if (sum <= 0) return values.map(() => 0)
  const raws = values.map(v => (v / sum) * 100)
  const floors = raws.map(r => Math.floor(r))
  const remainder = 100 - floors.reduce((a, b) => a + b, 0)
  const order = raws
    .map((r, i) => ({ i, frac: r - Math.floor(r) }))
    .sort((a, b) => b.frac - a.frac)
  const result = floors.slice()
  for (let k = 0; k < remainder && k < order.length; k++) {
    result[order[k].i] += 1
  }
  return result
}

function formatRelative(date, now) {
  if (!date) return '—'
  const diff = Math.max(0, Math.floor((now - date.getTime()) / 1000))
  if (diff < 5) return 'baru saja'
  if (diff < 60) return `${diff} detik lalu`
  if (diff < 3600) return `${Math.floor(diff / 60)} menit lalu`
  return `${Math.floor(diff / 3600)} jam lalu`
}

const fmt = (n) => Number(n || 0).toLocaleString('id-ID')

// --- Components ---

function StatCard({ label, value, sublabel, icon: Icon, colorClass }) {
  return (
    <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-white border border-zinc-200 shadow-sm text-center transition-all hover:shadow-md">
      <div className={`p-2 rounded-xl ${colorClass} bg-opacity-10 mb-2`}>
        <Icon className={`w-5 h-5 ${colorClass.replace('bg-', 'text-')}`} />
      </div>
      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">{label}</span>
      <span className="text-xl font-bold text-zinc-900 leading-tight mt-0.5">{value}</span>
      {sublabel && <span className="text-[10px] text-zinc-400 font-medium">{sublabel}</span>}
    </div>
  )
}

function LeaderCard({ candidate, pct, isVotingOpen, isTie }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`relative w-full overflow-hidden rounded-2xl bg-white border shadow-lg ${isTie ? 'border-amber-100 shadow-amber-500/10' : 'border-indigo-100 shadow-indigo-500/10'}`}
    >
      <div className={`absolute top-0 inset-x-0 h-24 bg-gradient-to-b to-transparent pointer-events-none ${isTie ? 'from-amber-50' : 'from-indigo-50'}`} />
      <div className="absolute top-4 right-4 p-2 bg-white/80 backdrop-blur rounded-xl border border-zinc-100 shadow-sm z-10">
        <Trophy className={`w-6 h-6 ${isTie ? 'text-zinc-400 fill-zinc-300' : 'text-amber-500 fill-amber-500'}`} />
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
            <span className={`text-xs font-bold px-3 py-1 rounded-full shadow-sm border ${isTie ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-indigo-100 text-indigo-700 border-indigo-200'}`}>
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
          <span className={`text-5xl font-black tracking-tighter ${isTie ? 'text-amber-600' : 'text-indigo-600'}`}>{pct}%</span>
          <span className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mt-1">{fmt(candidate.total)} Suara</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-3 bg-zinc-100 rounded-full overflow-hidden relative mt-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, delay: 0.2 }}
            className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${isTie ? 'from-amber-500 to-amber-400' : 'from-indigo-500 to-indigo-400'}`}
          />
        </div>

        <div className={`mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wide ${isTie ? 'bg-amber-50 border-amber-100 text-amber-700' : 'bg-indigo-50 border-indigo-100 text-indigo-700'}`}>
          {isTie ? (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Hasil Seri
            </>
          ) : isVotingOpen ? (
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
      transition={{ delay: Math.min(index * 0.05, 0.4) }}
      className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-zinc-200 shadow-sm hover:shadow-md transition-shadow"
    >
      <div className="w-14 h-14 shrink-0 rounded-xl bg-zinc-100 overflow-hidden border border-zinc-100">
        {candidate.photoUrl ? (
          <img src={candidate.photoUrl} alt={candidate.chairmanName} className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300"><Users className="w-6 h-6" /></div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-1 gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-bold text-zinc-900 truncate">{candidate.chairmanName}</h3>
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
              className="h-full bg-indigo-400 rounded-full"
            />
          </div>
          <span className="text-[10px] font-mono text-zinc-400 shrink-0">{fmt(candidate.total)} Suara</span>
        </div>
      </div>

      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-zinc-100 text-xs font-bold text-zinc-500">
        {candidate.candidateNumber}
      </div>
    </motion.div>
  )
}

function ResultsSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-3 gap-3">
        <div className="h-24 rounded-2xl bg-white border border-zinc-200" />
        <div className="h-24 rounded-2xl bg-white border border-zinc-200" />
        <div className="h-24 rounded-2xl bg-white border border-zinc-200" />
      </div>
      <div className="h-96 rounded-2xl bg-white border border-zinc-200" />
      <div className="h-20 rounded-2xl bg-white border border-zinc-200" />
      <div className="h-20 rounded-2xl bg-white border border-zinc-200" />
    </div>
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
  const [lastUpdated, setLastUpdated] = useState(null)
  const [now, setNow] = useState(Date.now())
  const rowsRef = useRef([])
  const [toast, setToast] = useState({ open: false, message: '' })

  // Ticker untuk relative time "X detik lalu"
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const checkSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from('election_settings')
      .select('show_live_result, is_voting_open')
      .eq('id', 1)
      .single()
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
    if (isInitialLoad) setLoading(true)
    else setRefreshing(true)

    const [rpc, dptCountRes] = await Promise.all([
      supabase.rpc('get_vote_recap'),
      supabase.rpc('get_dpt_count'),
    ])

    if (!dptCountRes.error && dptCountRes.data !== null) {
      setTotalDpt(Number(dptCountRes.data))
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
        // Urutkan: suara terbanyak dulu, tie-breaker pakai nomor urut menaik
        .sort((a, b) => b.total - a.total || a.candidateNumber - b.candidateNumber)

      rowsRef.current = mapped
      setRows(mapped)
      setLastUpdated(new Date())
    } else {
      setRows([])
      setToast({ open: true, message: rpc.error?.message || 'Gagal memuat data' })
    }
    setLoading(false)
    setRefreshing(false)
  }, [checkSettings])

  // Initial fetch
  useEffect(() => {
    fetchRecap()
  }, [fetchRecap])

  // Polling hanya saat hasil diizinkan dipublikasi
  useEffect(() => {
    if (showLiveResult !== true) return undefined
    const interval = setInterval(fetchRecap, 10000)
    return () => clearInterval(interval)
  }, [showLiveResult, fetchRecap])

  const totalVotes = useMemo(() => rows.reduce((s, r) => s + r.total, 0), [rows])

  // Persentase presisi: largest-remainder → total selalu 100%
  const percentages = useMemo(
    () => computeIntegerPercentages(rows.map((r) => r.total)),
    [rows]
  )

  // Deteksi seri di posisi puncak
  const { leaders, others, isTie } = useMemo(() => {
    if (rows.length === 0 || rows[0].total === 0) {
      return { leaders: [], others: rows.map((r, i) => [r, i]), isTie: false }
    }
    const topVotes = rows[0].total
    const leadersArr = []
    const othersArr = []
    rows.forEach((r, i) => {
      if (r.total === topVotes) leadersArr.push([r, i])
      else othersArr.push([r, i])
    })
    return { leaders: leadersArr, others: othersArr, isTie: leadersArr.length > 1 }
  }, [rows])

  const participationPct = totalDpt > 0
    ? Math.min(100, Math.round((totalVotes / totalDpt) * 100))
    : 0
  const remainingDpt = Math.max(0, totalDpt - totalVotes)

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
            <button onClick={() => navigate('/')} className="w-full py-3 bg-gov-accent text-white rounded-xl font-semibold shadow-md shadow-gov-accent/20 hover:brightness-110 transition-all active:scale-[0.98]">
              Kembali ke Beranda
            </button>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="w-full max-w-md sm:max-w-2xl lg:max-w-3xl mx-auto pb-24 pt-2 space-y-6">
        <Toast open={toast.open} variant="error" message={toast.message} onClose={() => setToast({ open: false, message: '' })} />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 pb-2">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 tracking-tight">Hasil Suara</h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-zinc-500">
              <span className="inline-flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                <span className="font-medium">Diperbarui {formatRelative(lastUpdated, now)}</span>
              </span>
              {refreshing && (
                <span className="inline-flex items-center gap-1 text-indigo-600">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span className="font-semibold">memperbarui…</span>
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => fetchRecap()}
            disabled={refreshing}
            className="inline-flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-zinc-200 shadow-sm hover:shadow-md transition-all active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
            aria-label="Perbarui sekarang"
            title="Perbarui sekarang"
          >
            <RefreshCw className={`w-4 h-4 text-zinc-600 ${refreshing ? 'animate-spin' : ''}`} />
            <span className="text-xs font-bold text-zinc-700 hidden sm:inline">Perbarui</span>
          </button>
        </div>

        {loading && rows.length === 0 ? (
          <ResultsSkeleton />
        ) : (
          <>
            {/* Stats Grid (3 kolom: presisi & informatif) */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                label="Suara Masuk"
                value={fmt(totalVotes)}
                sublabel="Total"
                icon={Vote}
                colorClass="bg-indigo-500 text-indigo-600"
              />
              <StatCard
                label="Total DPT"
                value={fmt(totalDpt)}
                sublabel="Mahasiswa"
                icon={Users}
                colorClass="bg-emerald-500 text-emerald-600"
              />
              <StatCard
                label="Partisipasi"
                value={`${participationPct}%`}
                sublabel={`${fmt(remainingDpt)} belum`}
                icon={BarChart3}
                colorClass="bg-blue-500 text-blue-600"
              />
            </div>

            {/* Leader Spotlight (single atau multi saat seri) */}
            {leaders.length > 0 ? (
              <div className="mt-4 space-y-4">
                {isTie && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs sm:text-sm text-amber-800 font-semibold flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Hasil seri — {leaders.length} kandidat memimpin dengan suara sama</span>
                  </div>
                )}
                <div className={isTie ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}>
                  {leaders.map(([candidate, idx]) => (
                    <LeaderCard
                      key={candidate.candidateNumber}
                      candidate={candidate}
                      pct={percentages[idx]}
                      isVotingOpen={isVotingOpen}
                      isTie={isTie}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-16 text-center rounded-2xl bg-white border border-zinc-200">
                <Vote className="w-10 h-10 text-zinc-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-zinc-500">Belum ada suara masuk</p>
                <p className="text-xs text-zinc-400 mt-1">Hasil akan tampil setelah voting dimulai.</p>
              </div>
            )}

            {/* Others List */}
            {others.length > 0 && (
              <div className="mt-8">
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider block mb-3 px-1">
                  {leaders.length > 0 ? 'Kandidat Lainnya' : 'Daftar Kandidat'}
                </span>
                <div className="space-y-3">
                  {others.map(([candidate, idx], i) => (
                    <CandidateItem
                      key={candidate.candidateNumber}
                      candidate={candidate}
                      index={i}
                      pct={percentages[idx]}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}
