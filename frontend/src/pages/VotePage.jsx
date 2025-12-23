import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
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
      const { data, error } = await supabase.from('candidates').select('*').order('candidate_number', { ascending: true })
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
      const displayNo = c.candidate_number

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
      <GridBackground className="w-full h-full pb-20" containerClassName="min-h-screen items-start h-auto bg-zinc-50/50">
        <div className="w-full relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
          <Toast
            open={toast.open}
            variant={toast.variant}
            title={toast.title}
            message={toast.message}
            onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          />

          {/* Header content */}
          <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 mb-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider border border-indigo-100"
              >
                {statusBadge.icon && <statusBadge.icon className="w-3 h-3" />}
                {statusBadge.label}
              </motion.div>
              <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 tracking-tight">Pilih Kandidat</h1>
              <p className="text-zinc-500 mt-2 max-w-lg">
                Gunakan hak suara Anda dengan bijak. Pilihan Anda bersifat rahasia dan menentukan masa depan organisasi.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-zinc-200/60 backdrop-blur-sm">
              <div className="px-4 py-2 bg-zinc-50 rounded-xl border border-zinc-100">
                <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Login Sebagai</div>
                <div className="font-mono text-sm font-bold text-zinc-700">{nimMasked}</div>
              </div>
              <div className="h-8 w-px bg-zinc-200 mx-1"></div>
              <button onClick={() => setRefreshNonce(n => n + 1)} className="p-3 rounded-xl hover:bg-zinc-50 text-zinc-500 hover:text-indigo-600 transition-colors">
                <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <button onClick={logout} className="p-3 rounded-xl hover:bg-red-50 text-zinc-500 hover:text-red-600 transition-colors">
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Candidates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading && candidates.length === 0 ? (
              Array.from({ length: 3 }).map((_, idx) => <CandidateSkeleton key={idx} />)
            ) : (
              candidates.map((c, idx) => {
                const taglineRaw = c.vision || c.mission || ''
                const tagline = taglineRaw ? String(taglineRaw).replace(/\s+/g, ' ').trim() : ''
                const displayNo = c.candidate_number
                const showPhoto = Boolean(c.photo_url) && !brokenPhotoIds.has(c.id)

                return (
                  <motion.div
                    key={c.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative flex flex-col bg-white rounded-[2rem] border border-zinc-200 shadow-sm transition-all duration-300 hover:border-indigo-300 hover:shadow-xl hover:shadow-indigo-500/10 hover:-translate-y-1 overflow-hidden h-full"
                  >
                    {/* Photo Area */}
                    <div className="relative aspect-square sm:aspect-[4/5] w-full overflow-hidden bg-zinc-100">
                      {showPhoto ? (
                        <img
                          src={c.photo_url}
                          alt="Kandidat"
                          className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                          onError={() => setBrokenPhotoIds(prev => new Set(prev).add(c.id))}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center bg-zinc-50 text-zinc-300">
                          <User className="h-24 w-24" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent pointer-events-none"></div>

                      <div className="absolute top-4 left-4">
                        <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-white/90 backdrop-blur-md shadow-sm font-bold text-lg text-zinc-900 border border-white/50">
                          {displayNo}
                        </div>
                      </div>
                    </div>

                    {/* Content Area */}
                    <div className="flex flex-1 flex-col p-6 pt-5">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-zinc-900 leading-tight group-hover:text-indigo-600 transition-colors">
                          {c.chairman_name}
                        </h3>
                        <div className="mt-1 text-sm font-medium text-zinc-500">
                          & {c.vice_chairman_name}
                        </div>
                      </div>

                      <div className="py-3 px-4 rounded-xl bg-zinc-50 border border-zinc-100 mb-6 flex-1">
                        <p className="text-xs text-zinc-600 line-clamp-3 leading-relaxed font-medium">
                          {tagline || 'Menuju perubahan yang lebih baik.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-3 mt-auto">
                        <button
                          onClick={() => setDetailCandidate({ ...c, displayNo })}
                          className="w-full rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 transition-all"
                        >
                          Detail
                        </button>
                        <button
                          onClick={() => { setSelectedCandidate({ ...c, displayNo }); setConfirmOpen(true); }}
                          disabled={!isVotingOpen || settingsLoading}
                          className="w-full rounded-xl bg-zinc-900 py-3 text-sm font-semibold text-white shadow-lg shadow-zinc-900/20 hover:bg-indigo-600 hover:shadow-indigo-500/30 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Pilih
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })
            )}
          </div>

          {candidates.length === 0 && !loading && (
            <div className="text-center py-32 rounded-[2.5rem] bg-white border border-dashed border-zinc-300 mt-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-zinc-50 mb-4">
                <User className="h-8 w-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold text-zinc-900">Belum Ada Kandidat</h3>
              <p className="text-zinc-500 max-w-sm mx-auto mt-2">Daftar kandidat belum tersedia saat ini. Silakan kembali lagi nanti.</p>
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
          <div className="rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100 flex items-center justify-center h-64 sm:h-80 relative">
            {detailCandidate?.photo_url ? (
              <img src={detailCandidate.photo_url} className="h-full w-full object-contain" alt="Kandidat" onError={(e) => e.target.style.display = 'none'} />
            ) : (
              <User className="w-20 h-20 text-zinc-300" />
            )}
          </div>
          <div className="text-center">
            <div className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-gov-blue text-white font-bold text-sm mb-3 shadow-md border-2 border-white ring-2 ring-zinc-100">
              {detailCandidate?.displayNo || detailCandidate?.candidate_number}
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="flex flex-col items-center">
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Calon Ketua</span>
                <h3 className="text-base font-bold text-zinc-900 leading-tight">
                  {detailCandidate?.chairman_name}
                </h3>
              </div>
              <div className="flex flex-col items-center relative">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 -ml-2 w-px h-8 bg-zinc-200 hidden sm:block"></div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-1">Calon Wakil</span>
                <h3 className="text-base font-bold text-zinc-900 leading-tight">
                  {detailCandidate?.vice_chairman_name}
                </h3>
              </div>
            </div>
          </div>
          <div className="bg-zinc-50 p-5 rounded-xl text-sm space-y-4 border border-zinc-100">
            <div>
              <strong className="block mb-1.5 text-zinc-900 font-bold">Visi</strong>
              <p className="whitespace-pre-wrap leading-relaxed text-zinc-600 text-justify break-words">
                {detailCandidate?.vision || '-'}
              </p>
            </div>
            {detailCandidate?.mission && (
              <div>
                <strong className="block mb-1.5 text-zinc-900 font-bold">Misi</strong>
                <p className="whitespace-pre-wrap leading-relaxed text-zinc-600 text-justify break-words">
                  {detailCandidate?.mission}
                </p>
              </div>
            )}
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

