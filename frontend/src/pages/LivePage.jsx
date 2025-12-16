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

export default function LivePage() {
  const [toast, setToast] = useState({ open: false, message: '' })

  const [settingsLoading, setSettingsLoading] = useState(true)
  const [showLiveResult, setShowLiveResult] = useState(false)

  const [loadingRecap, setLoadingRecap] = useState(false)
  const [recap, setRecap] = useState([])

  const totalVotes = useMemo(() => recap.reduce((sum, r) => sum + r.total, 0), [recap])

  useEffect(() => {
    let cancelled = false

    const fetchSettings = async () => {
      setSettingsLoading(true)

      const { data, error } = await supabase
        .from('election_settings')
        .select('show_live_result')
        .eq('id', 1)
        .single()

      if (cancelled) return

      if (error) {
        setShowLiveResult(false)
      } else {
        setShowLiveResult(Boolean(data?.show_live_result))
      }

      setSettingsLoading(false)
    }

    fetchSettings()
    const interval = setInterval(fetchSettings, 10000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const fetchRecap = async () => {
      setLoadingRecap(true)

      const { data, error } = await supabase.rpc('get_vote_recap')

      if (cancelled) return

      if (error) {
        setRecap([])
        setToast({ open: true, message: error.message })
      } else {
        const mapped = Array.isArray(data)
          ? data
              .map((r) => ({ name: r.candidate_name, total: Number(r.total_votes ?? 0) }))
              .sort((a, b) => b.total - a.total)
          : []
        setRecap(mapped)
      }

      setLoadingRecap(false)
    }

    if (!showLiveResult) {
      setRecap([])
      setLoadingRecap(false)
      return () => {
        cancelled = true
      }
    }

    fetchRecap()
    const interval = setInterval(fetchRecap, 10000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [showLiveResult])

  if (settingsLoading) {
    return (
      <Layout>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="rounded-2xl border border-zinc-200 bg-white px-5 py-4 shadow-sm">
            <div className="text-sm font-medium text-zinc-700">Memuat status quick count...</div>
          </div>
        </div>
      </Layout>
    )
  }

  if (!showLiveResult) {
    return (
      <Layout>
        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-200 bg-white p-8 shadow-lg">
            <div className="text-center">
              <div className="mx-auto inline-flex rounded-full bg-gov-accent/10 px-4 py-2 text-xs font-semibold text-gov-accent">
                LIVE QUICK COUNT
              </div>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-gov-blue sm:text-4xl">WAITING FOR RESULTS</h1>
              <p className="mt-3 text-sm text-zinc-600 sm:text-base">
                Perhitungan suara akan ditampilkan setelah pemungutan suara ditutup.
              </p>
              <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-sm text-zinc-700">
                Mohon menunggu pengumuman resmi dari panitia.
              </div>
            </div>
          </div>
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

      <div className="mx-auto w-full max-w-3xl">
        <div className="text-center">
          <div className="mx-auto inline-flex rounded-full bg-gov-accent px-4 py-2 text-xs font-semibold text-white shadow-sm">
            LIVE QUICK COUNT
          </div>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight text-gov-blue sm:text-3xl">Rekap Suara Sementara</h1>
          <div className="mt-2 text-sm text-zinc-600">Pembaruan otomatis setiap 10 detik.</div>
        </div>

        <div className="mt-6 rounded-2xl border border-zinc-200 bg-white px-5 py-4 text-center shadow-sm">
          <div className="text-xs text-zinc-500">Total Suara Masuk</div>
          <div className="mt-1 text-3xl font-bold tracking-tight text-gov-blue">{totalVotes}</div>
        </div>

        <div className="mt-6 space-y-3">
          {loadingRecap ? (
            <>
              <RowSkeleton />
              <RowSkeleton />
              <RowSkeleton />
            </>
          ) : recap.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600 shadow-sm">
              Data rekap belum tersedia.
            </div>
          ) : (
            recap.map((r) => {
              const pct = totalVotes > 0 ? Math.round((r.total / totalVotes) * 100) : 0
              return (
                <div key={r.name} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-28 truncate text-sm font-semibold text-gov-blue sm:w-44">{r.name}</div>

                    <div className="flex-1">
                      <div className="h-3 w-full rounded-full bg-zinc-200">
                        <div className="h-3 rounded-full bg-gov-accent" style={{ width: `${pct}%` }} />
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
      </div>
    </Layout>
  )
}
