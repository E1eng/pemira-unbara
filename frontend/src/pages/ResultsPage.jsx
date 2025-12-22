import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Toast from '../components/Toast.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { BarChart3, Lock, RefreshCw, Trophy, Users } from 'lucide-react'
import { GridBackground } from '../components/ui/grid-background.jsx'
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
  const [toast, setToast] = useState({ open: false, message: '' })
  const rowsRef = useRef([])

  const checkSettings = useCallback(async () => {
    const { data, error } = await supabase.from('election_settings').select('show_live_result').eq('id', 1).single()

    if (error || !data) {
      setShowLiveResult(false)
      return false
    }

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

    const rpc = await supabase.rpc('get_vote_recap')

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
        <GridBackground className="w-full h-full flex items-center justify-center p-4">
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
        </GridBackground>
      </Layout>
    )
  }

  if (showLiveResult === null) {
    return (
      <Layout>
        <GridBackground className="w-full h-full flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <RefreshCw className="h-6 w-6 animate-spin text-zinc-400" />
            <div className="text-sm text-zinc-500">Memuat data...</div>
          </div>
        </GridBackground>
      </Layout>
    )
  }

  return (
    <Layout>
      <GridBackground className="w-full h-full pb-20" containerClassName="min-h-screen items-start h-auto">
        <div className="w-full relative z-10 space-y-6">
          <Toast
            open={toast.open}
            variant="error"
            title="Gagal memuat"
            message={toast.message}
            onClose={() => setToast({ open: false, message: '' })}
          />

          <div className="rounded-2xl border border-white/40 bg-white/60 backdrop-blur-md p-4 shadow-sm sm:p-6 sticky top-0 z-20">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 space-y-1.5">
                <div className="text-sm text-zinc-500 font-medium">Rekapitulasi PEMIRA</div>
                <h1 className="text-xl font-bold tracking-tight text-gov-blue sm:text-2xl">Hasil Suara BEM</h1>
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <span className={`h-2 w-2 rounded-full ${refreshing ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                  <span>{refreshing ? 'Memperbarui...' : 'Auto-update 10s'}</span>
                </div>
              </div>
              <div className="rounded-xl border border-zinc-200 bg-white/80 px-4 py-2 text-right shadow-sm backdrop-blur">
                <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium justify-end">
                  <Users className="h-3 w-3" />
                  Total Suara
                </div>
                <div className="text-lg font-bold text-gov-blue">{totalVotes}</div>
              </div>
            </div>
          </div>

          {leader && (
            <div className="flex justify-center w-full">
              <MovingBorderButton
                borderRadius="1rem"
                as="div"
                containerClassName="h-auto w-full max-w-2xl bg-white"
                className="bg-white dark:bg-slate-900 text-black dark:text-white border-neutral-200 dark:border-slate-800"
                duration={3000}
              >
                <div className="flex w-full items-center gap-4 p-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600 shadow-sm">
                    <Trophy className="h-7 w-7" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">Sementara Unggul</div>
                    <div className="text-lg font-bold text-gov-blue truncate">
                      {leader.chairmanName} <span className="text-zinc-400 font-normal">&</span> {leader.viceChairmanName}
                    </div>
                    <div className="text-xs text-zinc-500">Paslon No. {leader.candidateNumber}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-gov-blue">{leader.total}</div>
                    <div className="text-xs text-zinc-500">suara</div>
                  </div>
                </div>
              </MovingBorderButton>
            </div>
          )}

          <div className={`space-y-3 transition-opacity duration-300 max-w-4xl mx-auto ${refreshing ? 'opacity-80' : 'opacity-100'}`}>
            {loading ? (
              <>
                <RowSkeleton />
                <RowSkeleton />
              </>
            ) : rows.length === 0 ? (
              <div className="rounded-2xl border border-zinc-200 bg-white/80 backdrop-blur p-6 text-center shadow-sm">
                <BarChart3 className="mx-auto h-8 w-8 text-zinc-400" />
                <div className="mt-4 text-sm font-medium text-zinc-900">Hasil belum tersedia</div>
              </div>
            ) : (
              rows.map((r, index) => {
                const pct = totalVotes > 0 ? Math.round((r.total / totalVotes) * 100) : 0
                const isLeader = index === 0

                return (
                  <div
                    key={r.candidateNumber || index}
                    className={`rounded-2xl border p-4 shadow-sm transition-all hover:shadow-md ${isLeader ? 'bg-amber-50/50 border-amber-200' : 'bg-white/80 backdrop-blur border-zinc-200'}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold shadow-sm ${isLeader ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-600'}`}>
                        {r.candidateNumber || index + 1}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <div className="font-bold text-gov-blue truncate mr-2">{r.chairmanName} <span className="font-normal text-zinc-500 text-xs">& {r.viceChairmanName}</span></div>
                          <div className="text-xs font-semibold text-zinc-700">{pct}%</div>
                        </div>

                        <div className="h-3 w-full rounded-full bg-zinc-100 overflow-hidden shadow-inner">
                          <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${isLeader ? 'bg-amber-400' : 'bg-gov-accent'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>

                        <div className="mt-1 text-right text-xs text-zinc-500">
                          {r.total} suara
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </GridBackground>
    </Layout>
  )
}
