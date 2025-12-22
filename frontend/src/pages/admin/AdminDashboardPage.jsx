import { useEffect, useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Activity, CheckCircle2, ShieldAlert, Users } from 'lucide-react'
import Modal from '../../components/Modal.jsx'
import Toast from '../../components/Toast.jsx'
import { supabase } from '../../lib/supabaseClient.js'
import { friendlyError } from '../../lib/friendlyError.js'

function StatCard({ icon: Icon, label, value, sub, tone = 'default' }) {
  const iconStyle =
    tone === 'success'
      ? 'bg-emerald-50 text-emerald-700'
      : tone === 'danger'
        ? 'bg-red-50 text-red-700'
        : 'bg-gov-accent/10 text-gov-accent'

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-medium text-zinc-500">{label}</div>
          <div className="mt-1 text-2xl font-bold tracking-tight text-gov-blue">{value}</div>
        </div>
        <div className={["flex h-10 w-10 items-center justify-center rounded-2xl", iconStyle].join(' ')}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {sub ? <div className="mt-1 text-xs text-zinc-500">{sub}</div> : null}
    </div>
  )
}

export default function AdminDashboardPage() {
  const [toast, setToast] = useState({ open: false, message: '', variant: 'error', title: '' })
  const [initialLoading, setInitialLoading] = useState(true)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [isVotingOpen, setIsVotingOpen] = useState(false)
  const [showLiveResult, setShowLiveResult] = useState(false)
  const [updatingField, setUpdatingField] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [pendingToggle, setPendingToggle] = useState(null)
  const [dptCount, setDptCount] = useState(null)
  const [voteCount, setVoteCount] = useState(null)
  const [votedCount, setVotedCount] = useState(null)
  const [recap, setRecap] = useState([])

  const totalFromRecap = useMemo(() => recap.reduce((sum, r) => sum + r.total, 0), [recap])

  const effectiveVoteCount = useMemo(() => {
    if (voteCount == null) return null
    if (voteCount === 0 && totalFromRecap > 0) return totalFromRecap
    return voteCount
  }, [totalFromRecap, voteCount])

  const participation = useMemo(() => {
    if (!dptCount || dptCount <= 0 || effectiveVoteCount == null) return null
    return Math.round((effectiveVoteCount / dptCount) * 100)
  }, [dptCount, effectiveVoteCount])

  const updateSettings = async (patch) => {
    setToast({ open: false, message: '', variant: 'error', title: '' })
    const key = Object.keys(patch)[0]
    setUpdatingField(key)

    const { data, error } = await supabase
      .from('election_settings')
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select('is_voting_open, show_live_result')
      .single()

    if (error || !data) {
      setToast({
        open: true,
        variant: 'error',
        title: 'Gagal menyimpan',
        message: friendlyError(error, 'Update ditolak atau tidak ada baris yang terubah. Pastikan akun kamu terdaftar di admin_users.'),
      })
      setUpdatingField(null)
      return null
    }

    setUpdatingField(null)
    return data
  }

  useEffect(() => {
    let cancelled = false

    const fetchAll = async ({ background } = {}) => {
      const bg = Boolean(background)

      if (!bg) {
        setToast({ open: false, message: '', variant: 'error', title: '' })
      }

      if (!bg) {
        setInitialLoading(true)
        setSettingsLoading(true)
      }

      try {
        const recapRes = await supabase.rpc('get_vote_recap')
        const recapMapped =
          !recapRes.error && Array.isArray(recapRes.data)
            ? recapRes.data
                .map((r) => ({ name: r.candidate_name, total: Number(r.total_votes ?? 0) }))
                .sort((a, b) => b.total - a.total)
            : []
        const recapTotal = recapMapped.reduce((sum, r) => sum + r.total, 0)

        if (!cancelled && !recapRes.error) setRecap(recapMapped)

        const dptRes = await supabase.from('voters').select('*', { count: 'exact', head: true })
        if (!cancelled) {
          if (dptRes.error) {
            if (!bg) setDptCount(null)
          } else {
            setDptCount(dptRes.count ?? 0)
          }
        }

        const votedRes = await supabase.from('voters').select('*', { count: 'exact', head: true }).eq('has_voted', true)
        if (!cancelled) {
          if (votedRes.error) {
            if (!bg) setVotedCount(null)
          } else {
            setVotedCount(votedRes.count ?? 0)
          }
        }

        const votesRes = await supabase.from('votes').select('*', { count: 'exact', head: true })
        if (!cancelled) {
          if (votesRes.error) {
            setVoteCount(recapRes.error ? null : recapTotal)
          } else {
            const rawCount = votesRes.count ?? 0
            setVoteCount(rawCount === 0 && recapTotal > 0 ? recapTotal : rawCount)
          }
        }

        const settingsRes = await supabase
          .from('election_settings')
          .select('is_voting_open, show_live_result')
          .eq('id', 1)
          .single()

        if (!cancelled) {
          if (!settingsRes.error) {
            setIsVotingOpen(Boolean(settingsRes.data?.is_voting_open))
            setShowLiveResult(Boolean(settingsRes.data?.show_live_result))
          }
          if (!bg) setSettingsLoading(false)
        }

        if (!cancelled) {
          const msg = recapRes.error?.message || votesRes.error?.message || dptRes.error?.message || settingsRes.error?.message
          if (msg) {
            if (!bg) {
              const e = recapRes.error || votesRes.error || dptRes.error || settingsRes.error
              setToast({ open: true, variant: 'error', title: 'Tidak dapat memuat', message: friendlyError(e, msg) })
            }
          }
        }
      } finally {
        if (!cancelled) {
          setInitialLoading(false)
        }
      }
    }

    fetchAll({ background: false })
    const interval = setInterval(() => fetchAll({ background: true }), 5000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const totalVotesForBars = useMemo(() => {
    if (effectiveVoteCount != null) return effectiveVoteCount
    return totalFromRecap
  }, [effectiveVoteCount, totalFromRecap])

  const chartData = useMemo(() => {
    return recap.map((r) => ({ name: r.name, votes: r.total }))
  }, [recap])

  const pieData = useMemo(() => {
    if (dptCount == null) return []
    const voted = votedCount ?? 0
    const notVoted = Math.max(0, dptCount - voted)
    return [
      { name: 'Sudah Memilih', value: voted, color: '#10b981' },
      { name: 'Belum Memilih', value: notVoted, color: '#f59e0b' },
    ]
  }, [dptCount, votedCount])

  const statusTone = isVotingOpen ? 'success' : 'danger'

  const openConfirm = (field, nextValue, label) => {
    setPendingToggle({ field, nextValue, label })
    setConfirmOpen(true)
  }

  const confirmToggle = async () => {
    if (!pendingToggle) return
    const { field, nextValue } = pendingToggle

    if (field === 'is_voting_open') setIsVotingOpen(nextValue)
    if (field === 'show_live_result') setShowLiveResult(nextValue)

    const updated = await updateSettings({ [field]: nextValue })
    if (updated) {
      setIsVotingOpen(Boolean(updated.is_voting_open))
      setShowLiveResult(Boolean(updated.show_live_result))
      setToast({
        open: true,
        variant: 'success',
        title: 'Tersimpan',
        message: 'Pengaturan berhasil diperbarui.',
      })
    } else {
      setIsVotingOpen((prev) => prev)
      setShowLiveResult((prev) => prev)
    }
    setConfirmOpen(false)
    setPendingToggle(null)
  }

  return (
    <>
      <Toast
        open={toast.open}
        variant={toast.variant}
        title={toast.title}
        message={toast.message}
        autoCloseMs={toast.variant === 'success' ? 2500 : undefined}
        onClose={() => setToast({ open: false, message: '', variant: 'error', title: '' })}
      />

      <div>
        <div className="text-sm text-zinc-500">Overview</div>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-gov-blue sm:text-2xl">Dashboard</h1>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-4">
        <StatCard icon={Users} label="Total DPT" value={initialLoading && dptCount == null ? '…' : dptCount ?? '—'} sub="Jumlah pemilih terdaftar" />
        <StatCard
          icon={CheckCircle2}
          label="Suara Masuk"
          value={initialLoading && effectiveVoteCount == null ? '…' : effectiveVoteCount ?? totalFromRecap ?? '—'}
          sub="Jumlah suara tercatat"
          tone="success"
        />
        <StatCard
          icon={Activity}
          label="Partisipasi"
          value={initialLoading && participation == null ? '…' : participation != null ? `${participation}%` : '—'}
          sub="Suara / DPT"
        />
        <StatCard
          icon={ShieldAlert}
          label="Status Voting"
          value={settingsLoading ? '…' : isVotingOpen ? 'OPEN' : 'CLOSED'}
          sub="Akses pemilih"
          tone={statusTone}
        />
      </div>

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-gov-blue">Control Room</div>
            <div className="mt-1 text-sm text-zinc-600">Perubahan akan berpengaruh langsung ke sistem publik.</div>
          </div>
          <div className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">Hati-hati</div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-sm font-semibold text-gov-blue">Buka/Tutup Pendaftaran Suara</div>
            <div className="mt-1 text-xs text-zinc-600">Buka/tutup akses voting untuk pemilih.</div>
            <button
              type="button"
              disabled={settingsLoading || updatingField === 'is_voting_open'}
              onClick={async () => {
                const next = !isVotingOpen
                openConfirm('is_voting_open', next, 'Buka/Tutup Pendaftaran Suara')
              }}
              className={[
                'mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors',
                isVotingOpen
                  ? 'bg-emerald-600 text-white hover:bg-emerald-600/95'
                  : 'bg-zinc-900 text-white hover:bg-zinc-900/95',
                (settingsLoading || updatingField === 'is_voting_open') ? 'opacity-50' : '',
              ].join(' ')}
            >
              {settingsLoading ? 'Memuat...' : updatingField === 'is_voting_open' ? 'Menyimpan...' : isVotingOpen ? 'OPEN' : 'CLOSED'}
            </button>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="text-sm font-semibold text-gov-blue">Publikasikan Hasil (Rekap Publik)</div>
            <div className="mt-1 text-xs text-zinc-600">Kontrol penayangan rekap pada halaman publik.</div>
            <button
              type="button"
              disabled={settingsLoading || updatingField === 'show_live_result'}
              onClick={async () => {
                const next = !showLiveResult
                openConfirm('show_live_result', next, 'Publikasikan Hasil (Rekap Publik)')
              }}
              className={[
                'mt-3 inline-flex h-11 w-full items-center justify-center rounded-xl px-4 text-sm font-semibold transition-colors',
                showLiveResult
                  ? 'bg-gov-accent text-white hover:bg-gov-accent/95'
                  : 'bg-white text-zinc-700 border border-zinc-200 hover:bg-zinc-100',
                (settingsLoading || updatingField === 'show_live_result') ? 'opacity-50' : '',
              ].join(' ')}
            >
              {settingsLoading ? 'Memuat...' : updatingField === 'show_live_result' ? 'Menyimpan...' : showLiveResult ? 'SEMBUNYIKAN' : 'TAYANGKAN'}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm lg:col-span-2">
          <div className="text-sm font-semibold text-gov-blue">Votes per Kandidat</div>
          <div className="mt-1 text-sm text-zinc-600">Bar Chart (Realtime)</div>

          <div className="mt-4 h-72">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">Belum ada data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} interval={0} angle={0} height={60} />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="votes" fill="#2563eb" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="text-sm font-semibold text-gov-blue">Partisipasi</div>
          <div className="mt-1 text-sm text-zinc-600">Sudah vs Belum memilih</div>

          <div className="mt-4 h-72">
            {pieData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-zinc-500">Belum ada data.</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip />
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="mt-3 space-y-2">
            {pieData.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-zinc-700">{p.name}</span>
                </div>
                <div className="font-semibold text-gov-blue">{p.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Security Notice moved to AdminVotersPage */}

      <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold text-gov-blue">Realtime Vote Recap</div>
        <div className="mt-1 text-sm text-zinc-600">Diurutkan berdasarkan suara tertinggi.</div>

        <div className="mt-4 space-y-3">
          {initialLoading && recap.length === 0 ? (
            <div className="text-sm text-zinc-500">Memuat...</div>
          ) : recap.length === 0 ? (
            <div className="text-sm text-zinc-600">Data rekap belum tersedia.</div>
          ) : (
            recap.map((r) => {
              const pct = totalVotesForBars > 0 ? Math.round((r.total / totalVotesForBars) * 100) : 0
              return (
                <div key={r.name} className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-36 truncate text-sm font-semibold text-gov-blue">{r.name}</div>
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

     <Modal
       open={confirmOpen}
       title="Konfirmasi Perubahan"
       onClose={() => (updatingField ? null : setConfirmOpen(false))}
       footer={
         <>
           <button
             type="button"
             onClick={() => setConfirmOpen(false)}
             disabled={Boolean(updatingField)}
             className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
           >
             Batal
           </button>
           <button
             type="button"
             onClick={confirmToggle}
             disabled={Boolean(updatingField)}
             className="inline-flex h-11 items-center justify-center rounded-xl bg-gov-accent px-4 text-sm font-semibold text-white shadow-sm hover:bg-gov-accent/95 disabled:opacity-50"
           >
             {updatingField ? 'Menyimpan...' : 'Ya, Lanjutkan'}
           </button>
         </>
       }
     >
       <div className="text-sm text-zinc-700">
         Anda yakin ingin mengubah:
       </div>
       <div className="mt-2 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-800">
         <div className="font-semibold">{pendingToggle?.label}</div>
         <div className="mt-1 text-xs text-zinc-600">
           Nilai baru: <span className="font-mono">{String(pendingToggle?.nextValue)}</span>
         </div>
       </div>
       <div className="mt-3 text-xs text-zinc-500">
         Tindakan ini dapat memengaruhi pengalaman pemilih dan tampilan publik.
       </div>
     </Modal>
    </>
  )
}
