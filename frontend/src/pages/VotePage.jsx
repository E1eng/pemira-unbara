import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout.jsx'
import Modal from '../components/Modal.jsx'
import Toast from '../components/Toast.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { supabase } from '../lib/supabaseClient.js'
import { friendlyError } from '../lib/friendlyError.js'
import { RefreshCw, LogOut, User, CheckCircle, AlertCircle, X, Info } from 'lucide-react'

// --- Components ---

function TicketCard({ candidate, onDetail, onSelect, isVotingOpen, disabled }) {
  const hasPhoto = Boolean(candidate.photo_url)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden hover:shadow-lg transition-all hover:-translate-y-1"
    >
      {/* Top: Photo 1:1 */}
      <div className="relative aspect-square w-full bg-zinc-100 overflow-hidden border-b border-zinc-100">
        {hasPhoto ? (
          <img
            src={candidate.photo_url}
            alt={candidate.chairman_name}
            className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-zinc-300">
            <User className="w-16 h-16" />
          </div>
        )}

        {/* Number Badge */}
        <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md border border-white/50 shadow-sm px-3 py-1.5 rounded-xl">
          <span className="text-sm font-bold text-zinc-900">#{candidate.candidate_number}</span>
        </div>
      </div>

      {/* Bottom: Info & Actions */}
      <div className="p-5">
        <div className="mb-4">
          <h3 className="text-lg font-bold text-zinc-900 leading-tight">
            {candidate.chairman_name}
          </h3>
          <p className="text-sm font-semibold text-zinc-500 mt-1">
            & {candidate.vice_chairman_name}
          </p>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-3">
          <button
            onClick={() => onDetail(candidate)}
            className="w-full py-2.5 rounded-xl bg-zinc-50 text-zinc-600 text-xs font-bold border border-zinc-100 hover:bg-zinc-100 transition-colors"
          >
            Detail
          </button>
          <button
            onClick={() => onSelect(candidate)}
            disabled={disabled}
            className="w-full py-2.5 rounded-xl bg-gov-accent text-white text-xs font-bold shadow-lg shadow-gov-accent/20 hover:bg-gov-accent/90 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
          >
            Pilih
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function VoteSkeleton() {
  return (
    <div className="h-40 rounded-3xl bg-white border border-zinc-200 animate-pulse" />
  )
}

// --- Main Page ---

export default function VotePage() {
  const navigate = useNavigate()
  const { nim, accessCode, logout } = useAuth()

  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [isVotingOpen, setIsVotingOpen] = useState(null)

  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const [detailCandidate, setDetailCandidate] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [refreshNonce, setRefreshNonce] = useState(0)
  const [toast, setToast] = useState({ open: false, variant: 'info', title: '', message: '' })

  const isAuthed = Boolean(nim && accessCode)

  useEffect(() => {
    if (!isAuthed) navigate('/login', { replace: true })
  }, [isAuthed, navigate])

  useEffect(() => {
    let cancelled = false
    const fetchData = async () => {
      if (refreshNonce === 0) setLoading(true)

      const [settingsRes, candidatesRes] = await Promise.all([
        supabase.from('election_settings').select('is_voting_open').eq('id', 1).single(),
        supabase.from('candidates').select('*').order('candidate_number', { ascending: true })
      ])

      if (cancelled) return

      if (!settingsRes.error) setIsVotingOpen(Boolean(settingsRes.data?.is_voting_open))
      else setIsVotingOpen(null)

      if (!candidatesRes.error) setCandidates(candidatesRes.data || [])
      else {
        setToast({ open: true, variant: 'error', title: 'Gagal', message: 'Gagal memuat data kandidat.' })
        setCandidates([])
      }
      setLoading(false)
    }
    fetchData()
    return () => { cancelled = true }
  }, [refreshNonce])

  const submitVote = async () => {
    if (!selectedCandidate || submitting) return

    // Safety check
    const { data: settings } = await supabase.from('election_settings').select('is_voting_open').eq('id', 1).single()
    if (!settings?.is_voting_open) {
      setToast({ open: true, variant: 'error', title: 'Tutup', message: 'Voting sudah ditutup.' })
      setConfirmOpen(false)
      setIsVotingOpen(false)
      return
    }

    setSubmitting(true)

    // Fetch IP for audit logs
    let clientIp = 'unknown'
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json', { signal: AbortSignal.timeout(3000) })
      if (ipRes.ok) {
        const ipData = await ipRes.json()
        clientIp = ipData.ip || 'unknown'
      }
    } catch (e) {
      console.warn('Failed to fetch IP:', e)
    }

    await new Promise(r => setTimeout(r, 800)) // UX delay

    const { data, error } = await supabase.rpc('submit_vote', {
      p_nim: nim,
      p_access_code_plain: accessCode,
      p_candidate_id: selectedCandidate.id,
      p_client_info: { userAgent: navigator.userAgent, ip: clientIp },
    })

    setSubmitting(false)
    setConfirmOpen(false)

    if (error || data?.status !== 'success') {
      setToast({ open: true, variant: 'error', title: 'Gagal', message: friendlyError(error, data?.message || 'Gagal merekam suara.') })
    } else {
      navigate('/thank-you', { replace: true })
    }
  }

  const statusBadge = useMemo(() => {
    if (isVotingOpen === false) return { label: 'Tutup', color: 'bg-red-50 text-red-600 border-red-100', icon: X }
    if (isVotingOpen === true) return { label: 'Buka', color: 'bg-emerald-50 text-emerald-600 border-emerald-100', icon: CheckCircle }
    return { label: '...', color: 'bg-zinc-50 text-zinc-500 border-zinc-100', icon: RefreshCw }
  }, [isVotingOpen])

  return (
    <Layout>
      {/* 
         Removed wrapper div with manual padding (px-4 etc). 
         Now using Layout's padding directly. 
         Just a vertical stack for content.
      */}
      <div className="w-full max-w-2xl mx-auto space-y-6">
        <Toast
          open={toast.open}
          variant={toast.variant}
          title={toast.title}
          message={toast.message}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        />

        {/* Header */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Bilik Suara</h1>
              <p className="text-sm text-zinc-500">Tentukan pilihan masa depan kampus.</p>
            </div>
            <div className={`px-3 py-1.5 rounded-full border flex items-center gap-1.5 ${statusBadge.color}`}>
              <statusBadge.icon className="w-3.5 h-3.5" />
              <span className="text-xs font-bold uppercase tracking-wider">{statusBadge.label}</span>
            </div>
          </div>

          {/* User Info Bar */}
          <div className="bg-white p-3 rounded-2xl border border-zinc-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">Login Sebagai</span>
                <span className="text-sm font-bold text-zinc-700 leading-none">{nim}</span>
              </div>
            </div>
            <button onClick={logout} className="p-2 rounded-xl text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Cards List */}
        <div className="space-y-4">
          {loading && candidates.length === 0 ? (
            <>
              <VoteSkeleton />
              <VoteSkeleton />
            </>
          ) : (
            candidates.map((c) => (
              <TicketCard
                key={c.id}
                candidate={c}
                onDetail={setDetailCandidate}
                onSelect={(cand) => { setSelectedCandidate(cand); setConfirmOpen(true); }}
                isVotingOpen={isVotingOpen}
                disabled={!isVotingOpen}
              />
            ))
          )}

          {candidates.length === 0 && !loading && (
            <div className="text-center py-12 text-zinc-400">Belum ada kandidat.</div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
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

      {/* Confirmation Modal */}
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
