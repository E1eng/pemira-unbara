import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Modal from '../components/Modal.jsx'
import Toast from '../components/Toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { friendlyError } from '../lib/friendlyError.js'
import { ArrowLeft, RefreshCw, LogOut, User, CheckCircle, AlertCircle, X, Eye } from 'lucide-react'
import { GridBackground } from '../components/ui/grid-background.jsx'


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
      const res = await supabase.from('election_settings').select('is_voting_open').eq('id', 1).single()
      if (cancelled) return
      if (res.error) setIsVotingOpen(null)
      else setIsVotingOpen(Boolean(res.data?.is_voting_open))
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
          message: friendlyError(error, 'Gagal memuat data kandidat.'),
        })
      } else {
        setCandidates(Array.isArray(data) ? data : [])
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
    return () => { cancelled = true }
  }, [refreshNonce])

  const nimMasked = useMemo(() => {
    if (!nim) return ''
    return String(nim)
  }, [nim])

  const statusBadge = useMemo(() => {
    if (settingsLoading) return { label: 'Memeriksa...', className: 'border-zinc-200 bg-white text-zinc-700', icon: RefreshCw }
    if (isVotingOpen === false) return { label: 'Ditutup', className: 'border-red-200 bg-red-50 text-red-800', icon: X }
    if (isVotingOpen === true) return { label: 'Dibuka', className: 'border-emerald-200 bg-emerald-50 text-emerald-800', icon: CheckCircle }
    return { label: 'Tidak tersedia', className: 'border-amber-200 bg-amber-50 text-amber-900', icon: AlertCircle }
  }, [isVotingOpen, settingsLoading])

  const goBack = () => navigate('/')

  const grid = useMemo(() => {
    if (loading && candidates.length === 0) {
      return Array.from({ length: 3 }).map((_, idx) => <CandidateSkeleton key={idx} />)
    }

    return candidates.map((c, idx) => {
      const taglineRaw = c.vision || c.mission || ''
      const tagline = taglineRaw ? String(taglineRaw).replace(/\s+/g, ' ').trim() : ''
      const showPhoto = Boolean(c.photo_url) && !brokenPhotoIds.has(c.id)
      const displayNo = idx + 1

      return (
        <div key={c.id} className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md hover:border-gov-accent/50">
          <div className="relative aspect-square w-full bg-zinc-100">
            {showPhoto ? (
              <img
                src={c.photo_url}
                alt="Kandidat"
                className="h-full w-full object-cover"
                loading="lazy"
                onError={() => setBrokenPhotoIds(prev => new Set(prev).add(c.id))}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-zinc-500">
                <User className="h-12 w-12 text-zinc-400" />
              </div>
            )}
            <div className="absolute top-2 left-2 rounded-full bg-white/90 px-3 py-1 text-sm font-bold text-gov-blue backdrop-blur shadow-sm border border-zinc-100">
              #{displayNo}
            </div>
          </div>

          <div className="flex flex-1 flex-col gap-3 p-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gov-blue truncate flex-1">
                  {c.chairman_name}
                </h3>
              </div>
              <div className="text-sm font-semibold text-zinc-600 truncate">
                & {c.vice_chairman_name}
              </div>
              <p className="text-zinc-500 text-xs mt-2 line-clamp-2 min-h-[2.5em]">
                {tagline || 'Visi & Misi Paslon'}
              </p>
            </div>

            <div className="mt-auto flex gap-3 pt-2">
              <button
                onClick={() => setDetailCandidate({ ...c, displayNo })}
                className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 active:scale-95 active:bg-zinc-100 transition-all duration-200"
              >
                Detail
              </button>
              <button
                onClick={() => { setSelectedCandidate({ ...c, displayNo }); setConfirmOpen(true); }}
                disabled={!isVotingOpen || settingsLoading}
                className="flex-1 rounded-xl bg-gov-accent px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-gov-accent/90 active:scale-95 active:shadow-inner transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100"
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
    if (!selectedCandidate || !nim || !accessCode) return

    // Check settings again... (omitted for brevity, same logic as before but cleaner)
    // Actually full logic needed for safety
    const settingsRes = await supabase.from('election_settings').select('is_voting_open').eq('id', 1).single()
    if (!settingsRes.error && !settingsRes.data?.is_voting_open) {
      setIsVotingOpen(false); setConfirmOpen(false);
      setToast({ open: true, variant: 'warning', title: 'Voting ditutup', message: 'Pemungutan suara ditutup.' })
      return
    }

    setSubmitting(true)

    // Artificial delay for better UX (so the loader is seen)
    await new Promise(resolve => setTimeout(resolve, 800))

    const { data, error } = await supabase.rpc('submit_vote', {
      p_nim: nim,
      p_access_code_plain: accessCode,
      p_candidate_id: selectedCandidate.id,
      p_client_info: { userAgent: navigator.userAgent },
    })

    setSubmitting(false)
    setConfirmOpen(false)

    if (error) {
      setToast({ open: true, variant: 'error', title: 'Gagal', message: friendlyError(error, 'Gagal merekam suara.') })
    } else if (data?.status !== 'success') {
      setToast({ open: true, variant: 'warning', title: 'Ditolak', message: data?.message || 'Aksi ditolak.' })
    } else {
      navigate('/thank-you', { replace: true })
    }
  }

  return (
    <Layout>
      <GridBackground className="w-full h-full pb-20" containerClassName="min-h-screen items-start h-auto">
        <div className="w-full relative z-10">
          <Toast
            open={toast.open}
            variant={toast.variant}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          />

          {/* Header content */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-white/50 backdrop-blur-md p-4 rounded-2xl border border-white/20 shadow-sm sticky top-0 z-20">
            <div>
              <h1 className="text-2xl font-bold text-gov-blue">Pilih Kandidat</h1>
              <div className="flex items-center gap-2 mt-1">
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${statusBadge.className}`}>
                  <statusBadge.icon className="w-3 h-3" /> {statusBadge.label}
                </div>
                <div className="text-xs text-zinc-500 font-mono bg-zinc-100 px-2 py-0.5 rounded-full">
                  {nimMasked}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setRefreshNonce(n => n + 1)} className="p-2 rounded-xl bg-white border border-zinc-200 hover:bg-zinc-50 shadow-sm">
                <RefreshCw className={`w-4 h-4 text-zinc-700 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={logout} className="p-2 rounded-xl bg-red-50 border border-red-100 hover:bg-red-100 shadow-sm">
                <LogOut className="w-4 h-4 text-red-600" />
              </button>
            </div>
          </div>

          {/* Candidates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {grid}
          </div>

          {candidates.length === 0 && !loading && (
            <div className="text-center py-20">
              <p className="text-zinc-400">Belum ada kandidat.</p>
            </div>
          )}
        </div>
      </GridBackground>

      {/* Modals reused with minimal changes or cleaner styling */}
      <Modal
        open={Boolean(detailCandidate)}
        title="Detail Kandidat"
        onClose={() => setDetailCandidate(null)}
        footer={
          <div className="flex gap-2 w-full">
            <button onClick={() => setDetailCandidate(null)} className="flex-1 py-2.5 bg-zinc-100 font-semibold text-zinc-700 rounded-xl hover:bg-zinc-200">Tutup</button>
            <button
              onClick={() => { setSelectedCandidate(detailCandidate); setConfirmOpen(true); setDetailCandidate(null); }}
              disabled={!isVotingOpen}
              className="flex-1 py-2.5 bg-gov-accent font-semibold text-white rounded-xl shadow-lg shadow-gov-accent/20 hover:bg-gov-accent/90 disabled:opacity-50"
            >
              Pilih
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden bg-zinc-100 aspect-video relative">
            <img src={detailCandidate?.photo_url} className="w-full h-full object-cover" onError={(e) => e.target.style.display = 'none'} />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gov-blue">{detailCandidate?.chairman_name} & {detailCandidate?.vice_chairman_name}</h3>
            <p className="text-sm text-zinc-500">No. Urut {detailCandidate?.candidate_number}</p>
          </div>
          <div className="bg-zinc-50 p-4 rounded-xl text-sm space-y-2">
            <p><strong>Visi:</strong> {detailCandidate?.vision || '-'}</p>
            <p><strong>Misi:</strong> {detailCandidate?.mission || '-'}</p>
          </div>
        </div>
      </Modal>

      <Modal
        open={confirmOpen}
        title="Konfirmasi Pilihan"
        onClose={() => !submitting && setConfirmOpen(false)}
        footer={
          <div className="flex gap-2 w-full">
            <button
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
              className="flex-1 py-2.5 bg-zinc-100 font-semibold text-zinc-700 rounded-xl hover:bg-zinc-200"
            >Batal</button>
            <button
              onClick={submitVote}
              disabled={submitting}
              className="flex-1 py-2.5 bg-gov-accent font-semibold text-white rounded-xl shadow-lg shadow-gov-accent/20 hover:bg-gov-accent/90 disabled:opacity-70"
            >
              {submitting ? 'Memproses...' : 'Ya, Kirim Suara'}
            </button>
          </div>
        }
      >
        <div className="text-center p-4">
          <div className="mb-4 text-4xl">🗳️</div>
          <p className="text-zinc-600 mb-2">Anda yakin memilih:</p>
          <div className="font-bold text-xl text-gov-blue mb-6">
            {selectedCandidate?.chairman_name} & {selectedCandidate?.vice_chairman_name}
          </div>
          <div className="text-xs bg-amber-50 text-amber-700 p-3 rounded-lg border border-amber-200">
            Pilihan tidak dapat diubah setelah dikirim.
          </div>
        </div>
      </Modal>

    </Layout>
  )
}

