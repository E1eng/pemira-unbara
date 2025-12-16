import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout.jsx'
import Toast from '../components/Toast.jsx'
import { supabase } from '../lib/supabaseClient.js'

function RowSkeleton() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="h-4 w-28 animate-pulse rounded bg-zinc-200" />
        <div className="h-3 flex-1 animate-pulse rounded bg-zinc-200" />
        <div className="h-4 w-10 animate-pulse rounded bg-zinc-200" />
      </div>
    </div>
  )
}

export default function ResultsPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState({ open: false, message: '' })

  useEffect(() => {
    let cancelled = false

    const fetchRecap = async () => {
      setLoading(true)

      // Preferred: RPC (works even when votes table is not publicly readable)
      const rpc = await supabase.rpc('get_vote_recap')

      if (!cancelled && !rpc.error && Array.isArray(rpc.data)) {
        setRows(
          rpc.data
            .map((r) => ({
              name: r.candidate_name,
              total: Number(r.total_votes ?? 0),
            }))
            .sort((a, b) => b.total - a.total),
        )
        setLoading(false)
        return
      }

      // Fallback: try relationship count (may fail under strict RLS)
      const rel = await supabase.from('candidates').select('id, name, votes(count)')

      if (!cancelled && !rel.error && Array.isArray(rel.data)) {
        const mapped = rel.data
          .map((c) => ({
            name: c.name,
            total: Number(c?.votes?.[0]?.count ?? 0),
          }))
          .sort((a, b) => b.total - a.total)

        setRows(mapped)
        setLoading(false)
        return
      }

      if (!cancelled) {
        const msg = rpc.error?.message || rel.error?.message || 'Tidak dapat memuat hasil.'
        setRows([])
        setLoading(false)
        setToast({
          open: true,
          message: msg,
        })
      }
    }

    fetchRecap()

    const interval = setInterval(fetchRecap, 5000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const totalVotes = useMemo(() => rows.reduce((sum, r) => sum + r.total, 0), [rows])
  const leader = rows[0]

  return (
    <Layout>
      <Toast
        open={toast.open}
        variant="error"
        title="Tidak dapat memuat"
        message={toast.message}
        onClose={() => setToast({ open: false, message: '' })}
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-zinc-500">Rekapitulasi</div>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-gov-blue sm:text-2xl">Hasil Suara</h1>
          <div className="mt-2 text-sm text-zinc-600">Pembaruan otomatis setiap 5 detik.</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-2 text-right shadow-sm">
          <div className="text-xs text-zinc-500">Total Suara</div>
          <div className="text-lg font-bold text-gov-blue">{totalVotes}</div>
        </div>
      </div>

      {leader ? (
        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-zinc-500">Sementara Teratas</div>
          <div className="mt-1 text-base font-semibold text-gov-blue">{leader.name}</div>
        </div>
      ) : null}

      <div className="mt-6 space-y-3">
        {loading ? (
          <>
            <RowSkeleton />
            <RowSkeleton />
            <RowSkeleton />
          </>
        ) : rows.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
            Hasil belum tersedia atau akses dibatasi.
          </div>
        ) : (
          rows.map((r) => {
            const pct = totalVotes > 0 ? Math.round((r.total / totalVotes) * 100) : 0
            return (
              <div key={r.name} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-28 truncate text-sm font-semibold text-gov-blue sm:w-40">{r.name}</div>

                  <div className="flex-1">
                    <div className="h-3 w-full rounded-full bg-zinc-200">
                      <div
                        className="h-3 rounded-full bg-gov-accent transition-[width]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="mt-1 text-xs text-zinc-500">{pct}%</div>
                  </div>

                  <div className="w-10 text-right text-sm font-bold text-gov-blue">{r.total}</div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </Layout>
  )
}
