import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Modal from '../components/Modal.jsx'
import Toast from '../components/Toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { friendlyError } from '../lib/friendlyError.js'
import { ArrowLeft, RefreshCw, LogOut, User, CheckCircle, AlertCircle, X, Eye } from 'lucide-react'

function CandidateSkeleton() {
  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="aspect-square w-full animate-pulse bg-zinc-200" />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="h-5 w-4/5 animate-pulse rounded bg-zinc-200" />
        <div className="h-4 w-3/5 animate-pulse rounded bg-zinc-200" />
        <div className="mt-auto flex gap-2 pt-1">
          <div className="h-11 flex-1 animate-pulse rounded-xl bg-zinc-200" />
          <div className="h-11 flex-1 animate-pulse rounded-xl bg-zinc-200" />
        </div>
      </div>
    </div>
  )
}

export default function VotePage() {
  const navigate = useNavigate()
  const { nim, accessCode, logout } = useAuth()

  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [settingsLoading, setSettingsLoading] = useState(true)
  const [isVotingOpen, setIsVotingOpen] = useState(null)

  const [refreshing, setRefreshing] = useState(false)
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null)

  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [detailCandidate, setDetailCandidate] = useState(null)
  const [brokenPhotoIds, setBrokenPhotoIds] = useState(() => new Set())

  const [toast, setToast] = useState({
    open: false,
    variant: 'info',
    title: '',
    message: '',
    autoCloseMs: undefined,
  })

  const isAuthed = Boolean(nim && accessCode)

  useEffect(() => {
    if (!isAuthed) {
      navigate('/login', { replace: true })
    }
  }, [isAuthed, navigate])

  useEffect(() => {
    let cancelled = false

    const isInitialLoad = refreshNonce === 0

    const fetchSettings = async () => {
      if (isInitialLoad) setSettingsLoading(true)
      const res = await supabase
        .from('election_settings')
        .select('is_voting_open')
        .eq('id', 1)
        .single()

      if (cancelled) return

      if (res.error) {
        setIsVotingOpen(null)
      } else {
        setIsVotingOpen(Boolean(res.data?.is_voting_open))
      }
      setSettingsLoading(false)
    }

    const fetchCandidates = async () => {
      if (isInitialLoad) setLoading(true)
      const { data, error } = await supabase.from('candidates').select('*').order('id', { ascending: true })

      if (cancelled) return

      if (error) {
        setCandidates((prev) => (isInitialLoad ? [] : prev))
        setToast({
          open: true,
          variant: 'error',
          title: 'Gagal memuat',
          message: friendlyError(error, 'Gagal memuat data kandidat. Silakan refresh halaman.'),
        })
      } else {
        setCandidates(Array.isArray(data) ? data : [])
        setLastUpdatedAt(new Date())
      }

      setLoading(false)
    }

    const load = async () => {
      if (!isInitialLoad) setRefreshing(true)
      setToast((prev) => ({ ...prev, open: false }))
      await Promise.all([fetchSettings(), fetchCandidates()])
      if (!cancelled) setRefreshing(false)
    }

    load()

    return () => {
      cancelled = true
    }
  }, [refreshNonce])

  const nimMasked = useMemo(() => {
    if (!nim) return ''
    return String(nim)
  }, [nim])

  const statusBadge = useMemo(() => {
    if (settingsLoading) {
      return { label: 'Memeriksa status…', className: 'border-zinc-200 bg-white text-zinc-700', icon: RefreshCw }
    }
    if (isVotingOpen === false) {
      return { label: 'Voting ditutup', className: 'border-red-200 bg-red-50 text-red-800', icon: X }
    }
    if (isVotingOpen === true) {
      return { label: 'Voting dibuka', className: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: CheckCircle }
    }
    return { label: 'Status tidak tersedia', className: 'border-amber-200 bg-amber-50 text-amber-900', icon: AlertCircle }
  }, [isVotingOpen, settingsLoading])

  const goBack = () => {
    navigate('/')
  }

  const grid = useMemo(() => {
    if (loading && candidates.length === 0) {
      return Array.from({ length: 6 }).map((_, idx) => <CandidateSkeleton key={idx} />)
    }

    return candidates.map((c, idx) => {
      const taglineRaw = c.vision || c.mission || ''
      const tagline = taglineRaw ? String(taglineRaw).replace(/\s+/g, ' ').trim() : ''
      const showPhoto = Boolean(c.photo_url) && !brokenPhotoIds.has(c.id)
      const displayNo = idx + 1

      return (
        <div
          key={c.id}
          className="group flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-gov-accent/50"
        >
          <div className="relative aspect-square w-full bg-zinc-100">
            {showPhoto ? (
              <img
                src={c.photo_url}
                alt={`${c.chairman_name} & ${c.vice_chairman_name}`}
                className="h-full w-full object-cover"
                loading="lazy"
                onError={() => {
                  setBrokenPhotoIds((prev) => {
                    const next = new Set(prev)
                    next.add(c.id)
                    return next
                  })
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-sm text-zinc-500">
                <User className="h-8 w-8 text-zinc-400" />
              </div>
            )}
            <div className="absolute left-3 top-3 inline-flex items-center rounded-full border border-white/60 bg-white/80 px-2 py-1 text-xs font-semibold text-zinc-800 backdrop-blur">
              #{displayNo}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 p-4">
            <div className="min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-gov-blue">{c.candidate_number}</span>
                <h3 className="truncate text-base font-semibold text-zinc-900">
                  {c.chairman_name} & {c.vice_chairman_name}
                </h3>
              </div>
              <div className="mt-1 truncate text-xs text-zinc-500">
                {tagline || 'Visi & Misi Paslon'}
              </div>
            </div>

            <div className="mt-auto flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => setDetailCandidate({ ...c, displayNo })}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
              >
                <Eye className="mr-1 h-3 w-3" />
                Detail
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCandidate({ ...c, displayNo })
                  setConfirmOpen(true)
                }}
                disabled={isVotingOpen === false || settingsLoading}
                className="inline-flex h-10 flex-1 items-center justify-center rounded-xl bg-gov-accent px-3 text-xs font-semibold text-white shadow-sm hover:bg-gov-accent/95 focus:outline-none focus:ring-4 focus:ring-gov-accent/20 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
              >
                Pilih
              </button>
            </div>
          </div>
        </div>
      )
    })
  }, [brokenPhotoIds, candidates, isVotingOpen, loading, settingsLoading])

  const submitVote = async () => {
    if (!selectedCandidate) return
    if (!nim || !accessCode) {
      navigate('/login', { replace: true })
      return
    }

    const settingsRes = await supabase
      .from('election_settings')
      .select('is_voting_open')
      .eq('id', 1)
      .single()

    if (!settingsRes.error) {
      const open = Boolean(settingsRes.data?.is_voting_open)
      setIsVotingOpen(open)
      if (!open) {
        setConfirmOpen(false)
        setToast({ open: true, variant: 'warning', title: 'Voting ditutup', message: 'Pemungutan suara sedang ditutup.' })
        return
      }
    }

    setSubmitting(true)
    setToast((prev) => ({ ...prev, open: false, message: '' }))

    const { data, error } = await supabase.rpc('submit_vote', {
      p_nim: nim,
      p_access_code_plain: accessCode,
      p_candidate_id: selectedCandidate.id,
      p_client_info: { userAgent: navigator.userAgent },
    })

    if (error) {
      setSubmitting(false)
      setConfirmOpen(false)
      setToast({
        open: true,
        variant: 'error',
        title: 'Gagal mengirim suara',
        message: friendlyError(error, 'Gagal merekam suara. Silakan coba lagi.'),
      })
      return
    }

    if (!data) {
      setSubmitting(false)
      setConfirmOpen(false)
      setToast({
        open: true,
        variant: 'error',
        title: 'Gagal memproses',
        message: 'Respons tidak valid dari server. Silakan coba lagi.',
      })
      return
    }

    if (data?.status && data.status !== 'success') {
      setSubmitting(false)
      setConfirmOpen(false)
      setToast({
        open: true,
        variant: 'warning',
        title: 'Aksi ditolak',
        message: data.message || 'Aksi ditolak.',
      })
      return
    }

    setSubmitting(false)
    setConfirmOpen(false)
    navigate('/thank-you', { replace: true })
  }

  return (
    <Layout>
      <Toast
        open={toast.open}
        variant={toast.variant}
        title={toast.title}
        message={toast.message}
        autoCloseMs={toast.autoCloseMs}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />

      {/* Mobile Header */}
      <div className="mb-6 flex items-center justify-between gap-3 sm:hidden">
        <button
          onClick={goBack}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold text-gov-blue">Pilih Kandidat</h1>
        <button
          onClick={() => {
            logout()
            navigate('/', { replace: true })
          }}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      <div className="space-y-6">
        {/* Header Section - Mobile Optimized */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="text-sm text-zinc-500">Bilik suara digital</div>
              <h1 className="mt-1 text-xl font-bold tracking-tight text-gov-blue sm:text-2xl">Pilih Kandidat</h1>
              <div className="mt-2 text-sm text-zinc-600">Pilih satu kandidat. Suara tidak dapat diubah.</div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <div className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-semibold ${statusBadge.className}`}
                >
                  {statusBadge.icon && <statusBadge.icon className="mr-1 h-3 w-3" />}
                  {statusBadge.label}
                </div>
                {nimMasked ? (
                  <div className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700">
                    <User className="mr-1 h-3 w-3" />
                    {nimMasked}
                  </div>
                ) : null}
                {refreshing ? <div className="text-xs font-medium text-zinc-500">Memperbarui…</div> : null}
              </div>
            </div>

            <div className="hidden items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={() => setRefreshNonce((n) => n + 1)}
                disabled={refreshing}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={() => {
                  logout()
                  navigate('/', { replace: true })
                }}
                className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Keluar
              </button>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {candidates.length === 0 && !loading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100">
              <User className="h-6 w-6 text-zinc-400" />
            </div>
            <div className="mt-4 text-base font-semibold text-gov-blue">Belum ada kandidat</div>
            <div className="mt-1 text-sm text-zinc-600">Data kandidat belum tersedia</div>
            <button
              type="button"
              onClick={() => setRefreshNonce((n) => n + 1)}
              className="mt-4 inline-flex h-11 items-center justify-center rounded-xl bg-gov-accent px-4 text-sm font-semibold text-white shadow-sm hover:bg-gov-accent/95"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">{grid}</div>
        )}

        {/* Mobile Refresh Button */}
        <div className="fixed bottom-24 right-4 z-30 sm:hidden">
          <button
            type="button"
            onClick={() => setRefreshNonce((n) => n + 1)}
            disabled={refreshing}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-gov-accent text-white shadow-lg hover:bg-gov-accent/95 disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Detail Modal - Mobile Optimized */}
      <Modal
        open={Boolean(detailCandidate)}
        title="Detail Kandidat"
        onClose={() => (submitting ? null : setDetailCandidate(null))}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDetailCandidate(null)}
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => {
                if (!detailCandidate) return
                setSelectedCandidate(detailCandidate)
                setConfirmOpen(true)
                setDetailCandidate(null)
              }}
              disabled={submitting || isVotingOpen === false || settingsLoading}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gov-accent px-4 text-sm font-semibold text-white shadow-sm hover:bg-gov-accent/95 disabled:cursor-not-allowed disabled:bg-zinc-300 disabled:shadow-none"
            >
              Pilih Kandidat Ini
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100">
            {detailCandidate?.photo_url && !brokenPhotoIds.has(detailCandidate.id) ? (
              <img
                src={detailCandidate.photo_url}
                alt={detailCandidate?.name}
                className="aspect-square w-full object-cover"
                onError={() => {
                  setBrokenPhotoIds((prev) => {
                    const next = new Set(prev)
                    next.add(detailCandidate.id)
                    return next
                  })
                }}
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center text-sm text-zinc-500">
                <User className="h-12 w-12 text-zinc-400" />
              </div>
            )}
          </div>

          <div>
            <div className="text-xs font-semibold text-zinc-500">Paslon No. Urut #{detailCandidate?.candidate_number}</div>
            <div className="mt-1 text-lg font-bold text-gov-blue">
              {detailCandidate?.chairman_name}
              <span className="mx-1 font-normal text-zinc-400">&</span>
              {detailCandidate?.vice_chairman_name}
            </div>
            <div className="mt-1 text-sm text-zinc-600 font-medium">Calon Ketua & Wakil Ketua BEM</div>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
            <div className="text-sm font-semibold text-zinc-900">Visi</div>
            <div className="mt-2 text-sm leading-relaxed text-zinc-700">
              {detailCandidate?.vision || <span className="text-zinc-500">Belum tersedia.</span>}
            </div>

            <div className="mt-4 text-sm font-semibold text-zinc-900">Misi</div>
            <div className="mt-2 text-sm leading-relaxed text-zinc-700">
              {detailCandidate?.mission || <span className="text-zinc-500">Belum tersedia.</span>}
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirm Modal - Mobile Optimized */}
      <Modal
        open={confirmOpen}
        title="Konfirmasi Pilihan"
        onClose={() => (submitting ? null : setConfirmOpen(false))}
        footer={
          <>
            <button
              type="button"
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={submitVote}
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gov-accent px-4 text-sm font-semibold text-white shadow-sm hover:bg-gov-accent/95 disabled:opacity-50"
            >
              {submitting ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                  <span>Memproses...</span>
                </div>
              ) : (
                'Kirim Suara'
              )}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gov-accent/10 text-sm font-bold text-gov-accent">
              {selectedCandidate?.displayNo ?? selectedCandidate?.id}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-zinc-500">Kandidat yang dipilih</div>
              <div className="truncate text-sm font-semibold text-zinc-900">
                {selectedCandidate?.chairman_name} & {selectedCandidate?.vice_chairman_name}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-600" />
              <div className="text-sm leading-relaxed text-amber-900">
                <strong>Perhatian:</strong> Pastikan pilihan Anda sudah benar. Setelah menekan <span className="font-semibold">Kirim Suara</span>, suara akan direkam dan tidak dapat diubah.
              </div>
            </div>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
