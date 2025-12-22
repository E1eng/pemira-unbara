import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Layout from '../components/Layout.jsx'
import Toast from '../components/Toast.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { BarChart3, RefreshCw, Trophy, Users } from 'lucide-react'

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
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [toast, setToast] = useState({ open: false, message: '' })
  const rowsRef = useRef([])

  const fetchRecap = useCallback(async () => {
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
          name: r.candidate_name,
          total: Number(r.total_votes ?? 0),
        }))
        .sort((a, b) => b.total - a.total)

      rowsRef.current = mapped
      setRows(mapped)
      setLoading(false)
      setRefreshing(false)
      return
    }

    const rel = await supabase.from('candidates').select('id, name, votes(count)')

    if (!rel.error && Array.isArray(rel.data)) {
      const mapped = rel.data
        .map((c) => ({
          name: c.name,
          total: Number(c?.votes?.[0]?.count ?? 0),
        }))
        .sort((a, b) => b.total - a.total)

      rowsRef.current = mapped
      setRows(mapped)
      setLoading(false)
      setRefreshing(false)
      return
    }

    const msg = rpc.error?.message || rel.error?.message || 'Tidak dapat memuat hasil.'
    rowsRef.current = []
    setRows([])
    setLoading(false)
    setRefreshing(false)
    setToast({
      open: true,
      message: msg,
    })
  }, [])

  useEffect(() => {
    fetchRecap()
    const interval = setInterval(fetchRecap, 10000) // Real-time update every 10 seconds

    return () => {
      clearInterval(interval)
    }
  }, [fetchRecap])

  const totalVotes = useMemo(() => rows.reduce((sum, r) => sum + r.total, 0), [rows])
  const leader = rows[0]

  const refreshData = () => {
    fetchRecap()
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
        {/* Header Section - Mobile Optimized */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-1.5">
              <div className="text-sm text-zinc-500">Rekapitulasi</div>
              <h1 className="text-xl font-bold tracking-tight text-gov-blue sm:text-2xl">Hasil Suara</h1>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <span
                  className={`h-2 w-2 rounded-full ${refreshing ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`}
                />
                <span>{refreshing ? 'Memperbarui data...' : 'Pembaruan otomatis setiap 10 detik'}</span>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <div className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-right shadow-sm">
                <div className="flex items-center gap-2 text-xs text-zinc-500">
                  <Users className="h-3 w-3" />
                  Total Suara
                </div>
                <div className="text-lg font-bold text-gov-blue">{totalVotes}</div>
              </div>
              
              <button
                onClick={refreshData}
                disabled={loading || refreshing}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 sm:hidden"
              >
                <RefreshCw className={`h-4 w-4 ${(loading || refreshing) ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Leader Card - Mobile Optimized */}
        {leader ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-medium text-zinc-500">Sementara Teratas</div>
                <div className="text-base font-semibold text-gov-blue">{leader.name}</div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gov-blue">{leader.total}</div>
                <div className="text-xs text-zinc-500">suara</div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Results List - Mobile Optimized */}
        <div
          className={`space-y-3 transition-opacity duration-300 ${
            refreshing ? 'opacity-80' : 'opacity-100'
          }`}
        >
          {loading ? (
            <>
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </>
          ) : rows.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center shadow-sm">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100">
                <BarChart3 className="h-6 w-6 text-zinc-400" />
              </div>
              <div className="mt-4 text-sm font-medium text-zinc-900">Hasil belum tersedia</div>
              <div className="mt-1 text-xs text-zinc-600">Data suara belum masuk atau akses dibatasi</div>
            </div>
          ) : (
            rows.map((r, index) => {
              const pct = totalVotes > 0 ? Math.round((r.total / totalVotes) * 100) : 0
              const isLeader = index === 0
              
              return (
                <div 
                  key={r.name} 
                  className={`rounded-2xl border bg-white p-4 shadow-sm transition-all ${
                    isLeader ? 'border-amber-200 bg-amber-50/30' : 'border-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold ${
                      isLeader 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-zinc-100 text-zinc-600'
                    }`}>
                      {index + 1}
                    </div>

                    {/* Candidate Name */}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-gov-blue">{r.name}</div>
                      
                      {/* Progress Bar */}
                      <div className="mt-2">
                        <div className="h-2 w-full rounded-full bg-zinc-200">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ${
                              isLeader ? 'bg-amber-400' : 'bg-gov-accent'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="mt-1 flex items-center justify-between text-xs text-zinc-500">
                          <span>{pct}%</span>
                          <span>{r.total} suara</span>
                        </div>
                      </div>
                    </div>

                    {/* Vote Count - Desktop */}
                    <div className="hidden text-right sm:block">
                      <div className="text-lg font-bold text-gov-blue">{r.total}</div>
                      <div className="text-xs text-zinc-500">suara</div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Summary Stats - Mobile Optimized */}
        {rows.length > 0 && (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-gov-blue">{rows.length}</div>
                <div className="text-xs text-zinc-500">Kandidat</div>
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
