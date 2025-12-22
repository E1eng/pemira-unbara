import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Toast from '../components/Toast.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { BarChart3, Lock, RefreshCw, Trophy, Users } from 'lucide-react'

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
    const { data, error } = await supabase
      .from('election_settings')
      .select('show_live_result')
      .eq('id', 1)
      .single()

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

    const msg = rpc.error?.message || 'Tidak dapat memuat hasil.'
    rowsRef.current = []
    setRows([])
    setLoading(false)
    setRefreshing(false)
    setToast({ open: true, message: msg })
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
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm max-w-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50">
              <Lock className="h-8 w-8 text-amber-600" />
            </div>
            <h1 className="mt-6 text-xl font-bold text-gov-blue">Hasil Belum Dipublikasikan</h1>
            <p className="mt-3 text-sm text-zinc-600">
              Hasil rekapitulasi suara belum dibuka untuk publik oleh panitia.
            </p>
            <button
              onClick={() => navigate('/')}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-gov-accent px-6 text-sm font-semibold text-white shadow-sm hover:bg-gov-accent/95"
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
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-sm text-zinc-500">Memuat...</div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <Toast
        open={toast.open}
        variant="error"
        title="Tidak dapat memuat"
        message={toast.message}
        onClose={() => setToast({ open: false, message: '' })}
      />

      <div className="space-y-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              <div className="text-sm text-zinc-500">Rekapitulasi PEMIRA</div>
              <h1 className="text-xl font-bold tracking-tight text-gov-blue sm:text-2xl">Hasil Suara BEM</h1>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span className={`h-2 w-2 rounded-full ${refreshing ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
                <span>{refreshing ? 'Memperbarui...' : 'Update otomatis 10 detik'}</span>
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-right shadow-sm">
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <Users className="h-3 w-3" />
                Total Suara
              </div>
              <div className="text-lg font-bold text-gov-blue">{totalVotes}</div>
            </div>
          </div>
        </div>

        {leader && (
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Trophy className="h-6 w-6" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-amber-700">🏆 Sementara Teratas</div>
                <div className="text-base font-bold text-gov-blue truncate">
                  No. {leader.candidateNumber} - {leader.chairmanName}
                </div>
                <div className="text-xs text-zinc-500">&amp; {leader.viceChairmanName}</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gov-blue">{leader.total}</div>
                <div className="text-xs text-zinc-500">suara</div>
              </div>
            </div>
          </div>
        )}

        <div className={`space-y-3 transition-opacity duration-300 ${refreshing ? 'opacity-80' : 'opacity-100'}`}>
          {loading ? (
            <>
              <RowSkeleton />
              <RowSkeleton />
            </>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
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
                  className={`rounded-2xl border bg-white p-4 shadow-sm ${isLeader ? 'border-amber-200 bg-amber-50/30' : 'border-zinc-200'}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold ${isLeader ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-600'}`}>
                      {r.candidateNumber || index + 1}
                    </div>
                    {r.photoUrl && (
                      <div className="h-12 w-12 overflow-hidden rounded-xl bg-zinc-100 flex-shrink-0">
                        <img src={r.photoUrl} alt={r.chairmanName} className="h-full w-full object-cover" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-gov-blue">{r.chairmanName}</div>
                      <div className="text-xs text-zinc-500">&amp; {r.viceChairmanName}</div>
                      <div className="mt-2">
                        <div className="h-2 w-full rounded-full bg-zinc-200">
                          <div className={`h-2 rounded-full transition-all duration-500 ${isLeader ? 'bg-amber-400' : 'bg-gov-accent'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                          <span>{pct}%</span>
                          <span>{r.total} suara</span>
                        </div>
                      </div>
                    </div>
                    <div className="hidden text-right sm:block">
                      <div className="text-xl font-bold text-gov-blue">{r.total}</div>
                      <div className="text-xs text-zinc-500">suara</div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {rows.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gov-blue">{rows.length}</div>
                <div className="text-xs text-zinc-500">Paslon</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-gov-blue">{totalVotes}</div>
                <div className="text-xs text-zinc-500">Total Suara</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
