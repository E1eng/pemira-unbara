import { useEffect, useMemo, useState } from 'react'
import { Pencil, Plus, Trash2 } from 'lucide-react'
import Modal from '../../components/Modal.jsx'
import Toast from '../../components/Toast.jsx'
import { supabase } from '../../lib/supabaseClient.js'
import { friendlyError } from '../../lib/friendlyError.js'

export default function AdminCandidatesPage() {
  const PHOTO_BUCKET = import.meta.env.VITE_CANDIDATE_PHOTO_BUCKET || 'candidate-photos'

  const [toast, setToast] = useState({ open: false, message: '', variant: 'error', title: '', autoCloseMs: undefined })
  const [loading, setLoading] = useState(true)
  const [candidates, setCandidates] = useState([])
  const [voteMap, setVoteMap] = useState(() => new Map())

  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteAllOpen, setDeleteAllOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  const [candidateNumber, setCandidateNumber] = useState('')
  const [chairmanName, setChairmanName] = useState('')
  const [viceChairmanName, setViceChairmanName] = useState('')
  const [vision, setVision] = useState('')
  const [mission, setMission] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoFile, setPhotoFile] = useState(null)
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState('')

  const resetForm = () => {
    setEditing(null)
    setCandidateNumber('')
    setChairmanName('')
    setViceChairmanName('')
    setVision('')
    setMission('')
    setPhotoUrl('')
    setPhotoFile(null)
    setPhotoPreviewUrl('')
  }

  useEffect(() => {
    if (!photoFile) return undefined
    const u = URL.createObjectURL(photoFile)
    setPhotoPreviewUrl(u)
    return () => URL.revokeObjectURL(u)
  }, [photoFile])

  const openCreate = () => {
    resetForm()
    setFormOpen(true)
  }

  const openEdit = (c) => {
    setEditing(c)
    setCandidateNumber(c.candidate_number ?? '')
    setChairmanName(c.chairman_name ?? '')
    setViceChairmanName(c.vice_chairman_name ?? '')
    setVision(c.vision ?? '')
    setMission(c.mission ?? '')
    setPhotoUrl(c.photo_url ?? '')
    setPhotoFile(null)
    setPhotoPreviewUrl('')
    setFormOpen(true)
  }

  const refresh = async () => {
    setLoading(true)

    // Try to fetch votes count via relationship
    const rel = await supabase
      .from('candidates')
      .select('id, candidate_number, chairman_name, vice_chairman_name, vision, mission, photo_url, votes(count)')
      .order('candidate_number', { ascending: true })

    if (!rel.error && Array.isArray(rel.data)) {
      setCandidates(rel.data)
      const m = new Map()
      rel.data.forEach((c) => {
        const count = Number(c?.votes?.[0]?.count ?? 0)
        m.set(c.id, count)
      })
      setVoteMap(m)
      setLoading(false)
      return
    }

    // Fallback: fetch candidates + recap RPC (map by id)
    const candRes = await supabase.from('candidates').select('*').order('candidate_number', { ascending: true })
    const recapRes = await supabase.rpc('get_vote_recap')

    if (!candRes.error && Array.isArray(candRes.data)) {
      setCandidates(candRes.data)
    } else {
      setCandidates([])
    }

    if (!recapRes.error && Array.isArray(recapRes.data) && Array.isArray(candRes.data)) {
      const byId = new Map(recapRes.data.map((r) => [r.candidate_id, Number(r.total_votes ?? 0)]))
      const m = new Map()
      candRes.data.forEach((c) => {
        m.set(c.id, byId.get(c.id) ?? 0)
      })
      setVoteMap(m)
    }

    if (rel.error || candRes.error) {
      setToast({ open: true, variant: 'error', title: 'Tidak dapat memuat', message: friendlyError(rel.error || candRes.error, 'Gagal memuat kandidat.') })
    }

    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const sorted = useMemo(() => {
    const copy = [...candidates]
    copy.sort((a, b) => (voteMap.get(b.id) ?? 0) - (voteMap.get(a.id) ?? 0))
    return copy
  }, [candidates, voteMap])

  const uploadCandidatePhoto = async (file) => {
    const cleanedBucket = String(PHOTO_BUCKET || '').trim()
    if (!cleanedBucket) throw new Error('Bucket foto belum dikonfigurasi.')

    const safeName = String(file?.name || 'photo').replaceAll(' ', '-').replaceAll('/', '-')
    const key = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`
    const path = `candidates/${key}-${safeName}`

    setUploadingPhoto(true)
    try {
      const { error: uploadErr } = await supabase.storage.from(cleanedBucket).upload(path, file, {
        upsert: true,
        contentType: file?.type || undefined,
      })
      if (uploadErr) throw uploadErr

      const pub = supabase.storage.from(cleanedBucket).getPublicUrl(path)
      const url = pub?.data?.publicUrl
      if (!url) throw new Error('Gagal membuat public URL foto.')
      return url
    } finally {
      setUploadingPhoto(false)
    }
  }

  const saveCandidate = async () => {
    setToast({ open: false, message: '', variant: 'error', title: '', autoCloseMs: undefined })

    if (!candidateNumber || !chairmanName.trim() || !viceChairmanName.trim() || !vision.trim() || !mission.trim()) {
      setToast({ open: true, variant: 'warning', title: 'Periksa input', message: 'Semua form wajib diisi.' })
      return
    }

    setSubmitting(true)

    let finalPhotoUrl = photoUrl.trim() || null
    if (photoFile) {
      try {
        finalPhotoUrl = await uploadCandidatePhoto(photoFile)
      } catch (e) {
        setSubmitting(false)
        setToast({ open: true, variant: 'error', title: 'Gagal upload foto', message: friendlyError(e) })
        return
      }
    }

    if (editing) {
      const { error } = await supabase
        .from('candidates')
        .update({
          name: chairmanName.trim(), // Legacy field for backward compatibility
          candidate_number: Number(candidateNumber),
          chairman_name: chairmanName.trim(),
          vice_chairman_name: viceChairmanName.trim(),
          vision: vision.trim(),
          mission: mission.trim(),
          photo_url: finalPhotoUrl
        })
        .eq('id', editing.id)

      if (error) {
        setSubmitting(false)
        setToast({ open: true, variant: 'error', title: 'Gagal menyimpan', message: friendlyError(error) })
        return
      }
    } else {
      const { error } = await supabase
        .from('candidates')
        .insert({
          name: chairmanName.trim(), // Legacy field for backward compatibility
          candidate_number: Number(candidateNumber),
          chairman_name: chairmanName.trim(),
          vice_chairman_name: viceChairmanName.trim(),
          vision: vision.trim(),
          mission: mission.trim(),
          photo_url: finalPhotoUrl
        })

      if (error) {
        setSubmitting(false)
        setToast({ open: true, variant: 'error', title: 'Gagal menambah', message: friendlyError(error) })
        return
      }
    }

    setSubmitting(false)
    setFormOpen(false)
    resetForm()
    setToast({ open: true, variant: 'success', title: 'Berhasil', message: editing ? 'Kandidat berhasil diperbarui.' : 'Kandidat berhasil ditambahkan.', autoCloseMs: 2500 })
    refresh()
  }

  const confirmDelete = async () => {
    if (!deleting) return
    setSubmitting(true)

    const { error } = await supabase.from('candidates').delete().eq('id', deleting.id)
    if (error) {
      setSubmitting(false)
      setToast({ open: true, variant: 'error', title: 'Gagal menghapus', message: friendlyError(error) })
      return
    }

    setSubmitting(false)
    setDeleteOpen(false)
    setDeleting(null)
    setToast({ open: true, variant: 'success', title: 'Berhasil', message: 'Kandidat berhasil dihapus.', autoCloseMs: 2500 })
    refresh()
  }

  const confirmDeleteAll = async () => {
    setSubmitting(true)
    // hapus semua kandidat (akan cascade delete votes)
    const { error } = await supabase.from('candidates').delete().gte('id', 0)
    if (error) {
      setSubmitting(false)
      setToast({ open: true, variant: 'error', title: 'Gagal menghapus semua', message: friendlyError(error) })
      return
    }
    setSubmitting(false)
    setDeleteAllOpen(false)
    setToast({ open: true, variant: 'success', title: 'Berhasil', message: 'Semua kandidat telah dihapus.', autoCloseMs: 2500 })
    refresh()
  }

  return (
    <>
      <Toast
        open={toast.open}
        variant={toast.variant}
        title={toast.title}
        message={toast.message}
        autoCloseMs={toast.variant === 'success' ? 2500 : undefined}
        onClose={() => setToast({ open: false, message: '', variant: 'error', title: '', autoCloseMs: undefined })}
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm text-zinc-500">Manajemen</div>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-gov-blue sm:text-2xl">Kandidat</h1>
          <div className="mt-2 text-sm text-zinc-600">Tambah, ubah, atau hapus kandidat.</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setDeleteAllOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
            Hapus Semua
          </button>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gov-accent px-4 text-sm font-semibold text-white shadow-sm hover:bg-gov-accent/95"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </button>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs font-semibold text-zinc-600">
              <tr>
                <th className="px-4 py-3 w-16">No.</th>
                <th className="px-4 py-3">Foto</th>
                <th className="px-4 py-3">Pasangan Calon</th>
                <th className="px-4 py-3">Visi</th>
                <th className="px-4 py-3">Misi</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-zinc-500" colSpan={6}>
                    Memuat...
                  </td>
                </tr>
              ) : sorted.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-zinc-500" colSpan={6}>
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                sorted.map((c) => (
                  <tr key={c.id} className="hover:bg-zinc-50">
                    <td className="px-4 py-3">
                      <div className="items-center justify-center text-black font-bold text-lg">
                        {c.candidate_number || '-'}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="h-12 w-12 overflow-hidden rounded-xl bg-zinc-100">
                        {c.photo_url ? (
                          <img src={c.photo_url} alt={c.chairman_name} className="h-full w-full object-cover" />
                        ) : null}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gov-blue">{c.chairman_name || 'Tidak ada nama'}</div>
                      <div className="text-sm text-zinc-600">&amp; {c.vice_chairman_name || '-'}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="text-xs text-zinc-700 line-clamp-3">{c.vision || '-'}</div>
                    </td>
                    <td className="px-4 py-3 max-w-[200px]">
                      <div className="text-xs text-zinc-700 line-clamp-3">{c.mission || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setDeleting(c)
                            setDeleteOpen(true)
                          }}
                          className="inline-flex h-9 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-3 text-xs font-semibold text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={formOpen}
        title={editing ? 'Edit Kandidat' : 'Tambah Kandidat'}
        onClose={() => (submitting ? null : setFormOpen(false))}
        footer={
          <>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              disabled={submitting || uploadingPhoto}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={saveCandidate}
              disabled={submitting || uploadingPhoto}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gov-accent px-4 text-sm font-semibold text-white shadow-sm hover:bg-gov-accent/95 disabled:opacity-50"
            >
              {submitting || uploadingPhoto ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="grid grid-cols-12 gap-3">
            <div className="col-span-3">
              <label className="block text-sm font-medium text-zinc-700" htmlFor="cand_number">
                No. Urut
              </label>
              <input
                id="cand_number"
                type="number"
                value={candidateNumber}
                onChange={(e) => setCandidateNumber(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 shadow-sm focus:border-gov-accent focus:outline-none focus:ring-4 focus:ring-gov-accent/15"
              />
            </div>
            <div className="col-span-9">
              <label className="block text-sm font-medium text-zinc-700" htmlFor="chairman_name">
                Nama Calon Ketua
              </label>
              <input
                id="chairman_name"
                value={chairmanName}
                onChange={(e) => setChairmanName(e.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 shadow-sm focus:border-gov-accent focus:outline-none focus:ring-4 focus:ring-gov-accent/15"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700" htmlFor="vice_name">
              Nama Calon Wakil Ketua
            </label>
            <input
              id="vice_name"
              value={viceChairmanName}
              onChange={(e) => setViceChairmanName(e.target.value)}
              className="mt-2 h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 shadow-sm focus:border-gov-accent focus:outline-none focus:ring-4 focus:ring-gov-accent/15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700" htmlFor="cand_vision">
              Vision
            </label>
            <textarea
              id="cand_vision"
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm focus:border-gov-accent focus:outline-none focus:ring-4 focus:ring-gov-accent/15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700" htmlFor="cand_mission">
              Mission
            </label>
            <textarea
              id="cand_mission"
              value={mission}
              onChange={(e) => setMission(e.target.value)}
              rows={3}
              className="mt-2 w-full rounded-xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 shadow-sm focus:border-gov-accent focus:outline-none focus:ring-4 focus:ring-gov-accent/15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700" htmlFor="cand_photo_file">
              Foto Kandidat
            </label>

            <div className="mt-2 flex items-start gap-3">
              <div className="h-16 w-16 overflow-hidden rounded-xl bg-zinc-100">
                {photoPreviewUrl || photoUrl ? (
                  <img src={photoPreviewUrl || photoUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="flex-1">
                <input
                  id="cand_photo_file"
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  disabled={submitting || uploadingPhoto}
                  className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-xl file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-700 hover:file:bg-zinc-200 disabled:opacity-50"
                />
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {photoUrl && !photoFile ? (
                    <button
                      type="button"
                      onClick={() => setPhotoUrl('')}
                      disabled={submitting || uploadingPhoto}
                      className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
                    >
                      Hapus Foto
                    </button>
                  ) : null}
                </div>
                <div className="mt-2 text-xs text-zinc-500">
                  Upload akan disimpan ke Storage bucket <span className="font-mono">{PHOTO_BUCKET}</span>.
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        title="Konfirmasi Hapus"
        onClose={() => (submitting ? null : setDeleteOpen(false))}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteOpen(false)}
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-600/95 disabled:opacity-50"
            >
              {submitting ? 'Menghapus...' : 'Hapus'}
            </button>
          </>
        }
      >
        <div className="text-sm text-zinc-700">
          Anda yakin menghapus paslon <span className="font-semibold text-zinc-900">{deleting?.chairman_name} & {deleting?.vice_chairman_name}</span>?
        </div>
      </Modal>

      <Modal
        open={deleteAllOpen}
        title="Hapus Semua Kandidat"
        onClose={() => (submitting ? null : setDeleteAllOpen(false))}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleteAllOpen(false)}
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={confirmDeleteAll}
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-600/95 disabled:opacity-50"
            >
              {submitting ? 'Menghapus...' : 'Hapus Semua'}
            </button>
          </>
        }
      >
        <div className="space-y-2 text-sm text-zinc-700">
          <div>Tindakan ini akan menghapus semua kandidat dan seluruh suara terkait (cascade).</div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
            Pastikan Anda telah mengekspor data yang diperlukan sebelum melanjutkan.
          </div>
        </div>
      </Modal>
    </>
  )
}
