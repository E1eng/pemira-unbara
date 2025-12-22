import { useEffect, useMemo, useState } from 'react'
import { FileDown, FileUp, Plus, Printer, RotateCcw, Search, Trash2 } from 'lucide-react'
import Modal from '../../components/Modal.jsx'
import Toast from '../../components/Toast.jsx'
import { supabase } from '../../lib/supabaseClient.js'
import { friendlyError } from '../../lib/friendlyError.js'

const PAGE_SIZE = 10

export default function AdminVotersPage() {
  const [toast, setToast] = useState({ open: false, message: '', variant: 'error', title: '' })
  const [loading, setLoading] = useState(true)
  const [voters, setVoters] = useState([])
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)

  const [formOpen, setFormOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [importing, setImporting] = useState(false)
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 })
  const [importErrors, setImportErrors] = useState([])
  const [importMasterList, setImportMasterList] = useState([])

  const [deletingNim, setDeletingNim] = useState(null)
  const [resetNim, setResetNim] = useState('')

  const [nim, setNim] = useState('')
  const [name, setName] = useState('')
  const [token, setToken] = useState('')

  const resetForm = () => {
    setNim('')
    setName('')
    setToken('')
  }

  const refresh = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('voters')
      .select('nim, name, has_voted, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      setVoters([])
      setToast({ open: true, variant: 'error', title: 'Tidak dapat memuat', message: friendlyError(error) })
      setLoading(false)
      return
    }

    setVoters(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  const addVoter = async () => {
    setToast({ open: false, message: '', variant: 'error', title: '' })

    const cleanedNim = nim.trim()
    const cleanedName = name.trim()
    const cleanedToken = token.trim()

    if (!cleanedNim || !cleanedName) {
      setToast({ open: true, variant: 'warning', title: 'Periksa input', message: 'NIM/NPM dan Nama wajib diisi.' })
      return
    }

    if (!/^[0-9]+$/.test(cleanedNim)) {
      setToast({ open: true, variant: 'warning', title: 'Periksa input', message: 'NIM/NPM harus berupa angka.' })
      return
    }

    setSubmitting(true)

    // CRITICAL: use RPC so token gets hashed
    const finalToken = cleanedToken || generateSecureToken(6)
    const { error } = await supabase.rpc('admin_add_voter', {
      p_nim: cleanedNim,
      p_name: cleanedName,
      p_access_code_plain: finalToken,
    })

    if (error) {
      setSubmitting(false)
      setToast({ open: true, variant: 'error', title: 'Gagal menambah pemilih', message: friendlyError(error) })
      return
    }

    setSubmitting(false)
    setFormOpen(false)
    resetForm()
    setToast({ open: true, variant: 'success', title: 'Berhasil', message: `Pemilih berhasil ditambahkan. Token: ${finalToken}` })
    refresh()
  }

  const deleteVoter = async () => {
    if (!deletingNim) return

    setSubmitting(true)
    const { error } = await supabase.from('voters').delete().eq('nim', deletingNim)

    if (error) {
      setSubmitting(false)
      setToast({ open: true, variant: 'error', title: 'Gagal menghapus', message: friendlyError(error) })
      return
    }

    setSubmitting(false)
    setDeleteOpen(false)
    setDeletingNim(null)
    setToast({ open: true, variant: 'success', title: 'Berhasil', message: 'Pemilih berhasil dihapus.' })
    refresh()
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return voters
    return voters.filter((v) => String(v.nim).includes(q) || String(v.name ?? '').toLowerCase().includes(q))
  }, [query, voters])

  useEffect(() => {
    setPage(1)
  }, [query])

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filtered.length / PAGE_SIZE)), [filtered.length])

  useEffect(() => {
    setPage((p) => Math.min(p, totalPages))
  }, [totalPages])

  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filtered.slice(start, start + PAGE_SIZE)
  }, [filtered, page])

  const generateSecureToken = (length = 8) => {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    const buf = new Uint8Array(length)
    window.crypto.getRandomValues(buf)
    let out = ''
    for (let i = 0; i < buf.length; i += 1) {
      out += alphabet[buf[i] % alphabet.length]
    }
    return out
  }

  const parseDptCsv = (text) => {
    const rawLines = String(text ?? '')
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)

    if (rawLines.length === 0) return []

    const first = rawLines[0]
    const commaCount = (first.match(/,/g) || []).length
    const semiCount = (first.match(/;/g) || []).length
    const delimiter = semiCount > commaCount ? ';' : ','

    const looksLikeHeader = /(nik|nim|npm)/i.test(first) && /(name|nama)/i.test(first)
    const startIndex = looksLikeHeader ? 1 : 0

    const rows = []
    for (let i = startIndex; i < rawLines.length; i += 1) {
      const parts = rawLines[i].split(delimiter).map((p) => p.trim())
      if (parts.length < 2) continue
      const rowNim = parts[0]
      const rowName = parts.slice(1).join(delimiter).trim()
      if (!rowNim || !rowName) continue
      rows.push({ nim: rowNim, name: rowName })
    }

    return rows
  }

  const toMasterCsv = (rows) => {
    const escape = (v) => {
      const s = String(v ?? '')
      if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
        return `"${s.replaceAll('"', '""')}"`
      }
      return s
    }

    const header = ['Name', 'NIM/NPM', 'Token']
    const lines = [header.join(',')]
    rows.forEach((r) => {
      lines.push([escape(r.name), escape(r.nim), escape(r.token)].join(','))
    })
    return lines.join('\n')
  }

  const toRecapCsv = (rows) => {
    const escape = (v) => {
      const s = String(v ?? '')
      if (s.includes('"') || s.includes(',') || s.includes('\n') || s.includes('\r')) {
        return `"${s.replaceAll('"', '""')}"`
      }
      return s
    }

    const header = ['nim', 'name', 'has_voted']
    const lines = [header.join(',')]
    rows.forEach((r) => {
      lines.push([escape(r.nim), escape(r.name), escape(r.has_voted)].join(','))
    })
    return lines.join('\n')
  }

  const downloadVotersRecapCsv = async ({ onlyVoted } = {}) => {
    setToast({ open: false, message: '', variant: 'error', title: '' })
    setExporting(true)

    let q = supabase.from('voters').select('nim, name, has_voted').order('created_at', { ascending: false })
    if (onlyVoted) q = q.eq('has_voted', true)

    const { data, error } = await q
    if (error) {
      setExporting(false)
      setToast({ open: true, variant: 'error', title: 'Gagal download', message: friendlyError(error) })
      return
    }

    const rows = Array.isArray(data) ? data : []
    if (rows.length === 0) {
      setExporting(false)
      setToast({
        open: true,
        variant: 'warning',
        title: 'Tidak ada data',
        message: onlyVoted ? 'Belum ada pemilih yang tercatat sudah memilih.' : 'Data pemilih kosong.',
      })
      return
    }

    const csv = toRecapCsv(rows)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = onlyVoted
      ? `rekap-pemilih-sudah-memilih-${new Date().toISOString().slice(0, 10)}.csv`
      : `rekap-pemilih-semua-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)

    setExporting(false)
    setExportOpen(false)
    setToast({
      open: true,
      variant: 'success',
      title: 'Berhasil',
      message: `Rekap berhasil diunduh. Total baris: ${rows.length}.`,
    })
  }

  const downloadMasterListCsv = () => {
    if (importMasterList.length === 0) {
      setToast({ open: true, variant: 'warning', title: 'CSV tidak valid', message: 'Master list kosong.' })
      return
    }
    const csv = toMasterCsv(importMasterList)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `master-list-dpt-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const printMasterList = () => {
    if (importMasterList.length === 0) {
      setToast({ open: true, variant: 'warning', title: 'CSV tidak valid', message: 'Master list kosong.' })
      return
    }
    const w = window.open('', '_blank', 'noopener,noreferrer')
    if (!w) {
      setToast({ open: true, variant: 'error', title: 'Tidak didukung', message: 'Popup diblokir. Izinkan popup untuk cetak PDF.' })
      return
    }

    const rowsHtml = importMasterList
      .map(
        (r, idx) =>
          `<tr><td>${idx + 1}</td><td>${String(r.name)}</td><td>${String(r.nim)}</td><td style="font-family:monospace;font-weight:700;letter-spacing:0.06em;">${String(r.token)}</td></tr>`,
      )
      .join('')

    w.document.write(`<!doctype html>
<html><head><meta charset="utf-8" />
<title>Master List Token DPT</title>
<style>
  body{font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;padding:24px;}
  h1{margin:0 0 4px 0;font-size:18px;}
  .warn{margin:12px 0;padding:12px;border:1px solid #fecaca;background:#fef2f2;color:#7f1d1d;font-size:12px;}
  table{width:100%;border-collapse:collapse;margin-top:12px;font-size:12px;}
  th,td{border:1px solid #e5e7eb;padding:8px;text-align:left;}
  th{background:#f8fafc;}
</style>
</head><body>
<h1>Master List Token DPT (One-Time)</h1>
<div>Generated: ${new Date().toLocaleString()}</div>
<div class="warn"><b>WARNING:</b> Download/cetak daftar ini SEKARANG. Token disimpan dalam bentuk hash di database dan tidak bisa dilihat kembali.</div>
<table>
<thead><tr><th>No</th><th>Nama</th><th>NIM/NPM</th><th>Token</th></tr></thead>
<tbody>${rowsHtml}</tbody>
</table>
</body></html>`)
    w.document.close()
    w.focus()
    w.print()
  }

  const handleDptFile = async (file) => {
    setToast({ open: false, message: '', variant: 'error', title: '' })
    setImportErrors([])
    setImportProgress({ done: 0, total: 0 })
    setImportMasterList([])

    if (!file) return

    const text = await file.text()
    const parsed = parseDptCsv(text)
    if (parsed.length === 0) {
      setToast({ open: true, variant: 'warning', title: 'CSV tidak valid', message: 'CSV kosong atau format tidak valid. Kolom wajib: nim,name' })
      return
    }

    if (!window.crypto?.getRandomValues) {
      setToast({ open: true, variant: 'error', title: 'Tidak didukung', message: 'Browser tidak mendukung crypto secure RNG.' })
      return
    }

    const used = new Set()
    const prepared = parsed
      .map((r) => {
        let t = generateSecureToken(12)
        while (used.has(t)) t = generateSecureToken(6)
        used.add(t)
        return { nim: String(r.nim).trim(), name: String(r.name).trim(), token: t }
      })
      .filter((r) => r.nim && r.name)

    setImportMasterList(prepared)
    setToast({ open: true, variant: 'info', title: 'Siap import', message: `File dibaca. ${prepared.length} baris siap diimport.` })
  }

  const startImport = async () => {
    setToast({ open: false, message: '', variant: 'error', title: '' })
    setImportErrors([])

    if (importMasterList.length === 0) {
      setToast({ open: true, variant: 'warning', title: 'Belum siap', message: 'Upload CSV dulu, lalu pastikan daftar siap diimport.' })
      return
    }

    setImporting(true)
    setImportProgress({ done: 0, total: importMasterList.length })

    const errors = []
    const success = []

    try {
      for (let i = 0; i < importMasterList.length; i += 1) {
        const row = importMasterList[i]
        const cleanedNim = String(row.nim).trim()
        const cleanedName = String(row.name).trim()
        const cleanedToken = String(row.token).trim()

        if (!cleanedNim || !cleanedName || !cleanedToken) {
          errors.push({ nim: cleanedNim || '(empty)', message: 'NIM/NPM/Nama/Token kosong.' })
          setImportProgress({ done: i + 1, total: importMasterList.length })
          continue
        }

        if (!/^[0-9]+$/.test(cleanedNim)) {
          errors.push({ nim: cleanedNim, message: 'NIM/NPM harus berupa angka.' })
          setImportProgress({ done: i + 1, total: importMasterList.length })
          continue
        }

        const { error } = await supabase.rpc('admin_add_voter', {
          p_nim: cleanedNim,
          p_name: cleanedName,
          p_access_code_plain: cleanedToken,
        })

        if (error) {
          errors.push({ nim: cleanedNim, message: friendlyError(error) })
        } else {
          success.push({ nim: cleanedNim, name: cleanedName, token: cleanedToken })
        }

        setImportProgress({ done: i + 1, total: importMasterList.length })
      }

      setImportErrors(errors)
      setImportMasterList(success)
      await refresh()

      if (errors.length > 0) {
        setToast({ open: true, variant: 'warning', title: 'Import selesai', message: `Berhasil: ${success.length}. Gagal: ${errors.length}.` })
      } else {
        setToast({ open: true, variant: 'success', title: 'Import berhasil', message: `Berhasil mengimport ${success.length} pemilih.` })
      }
    } finally {
      setImporting(false)
    }
  }

  const resetVoteStatus = async () => {
    setToast({ open: false, message: '', variant: 'error', title: '' })
    const cleanedNim = resetNim.trim()
    if (!cleanedNim) {
      setToast({ open: true, variant: 'warning', title: 'Periksa input', message: 'NIM/NPM wajib diisi.' })
      return
    }

    setSubmitting(true)
    const { error } = await supabase.from('voters').update({ has_voted: false }).eq('nim', cleanedNim)
    if (error) {
      setSubmitting(false)
      setToast({ open: true, variant: 'error', title: 'Gagal reset status', message: friendlyError(error) })
      return
    }

    setSubmitting(false)
    setResetOpen(false)
    setResetNim('')
    setToast({ open: true, variant: 'success', title: 'Berhasil', message: 'Status memilih berhasil di-reset.' })
    refresh()
  }

  return (
    <>
      <Toast
        open={toast.open}
        variant={toast.variant}
        title={toast.title}
        message={toast.message}
        autoCloseMs={toast.variant === 'success' || toast.variant === 'info' ? 2500 : undefined}
        onClose={() => setToast({ open: false, message: '', variant: 'error', title: '' })}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm text-zinc-500">Manajemen</div>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-gov-blue sm:text-2xl">DPT (Pemilih)</h1>
          <div className="mt-2 text-sm text-zinc-600">Tambah pemilih menggunakan RPC untuk hashing token.</div>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={() => {
              setImportErrors([])
              setImportProgress({ done: 0, total: 0 })
              setImportMasterList([])
              setImportOpen(true)
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <FileUp className="h-4 w-4" />
            Import DPT
          </button>

          <button
            type="button"
            onClick={() => setExportOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <FileDown className="h-4 w-4" />
            Download Rekap
          </button>

          <button
            type="button"
            onClick={() => setResetOpen(true)}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-amber-200 bg-white px-4 text-sm font-semibold text-amber-800 shadow-sm hover:bg-amber-50"
          >
            <RotateCcw className="h-4 w-4" />
            Reset Status
          </button>

          <button
            type="button"
            onClick={() => {
              resetForm()
              setFormOpen(true)
            }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-gov-accent px-4 text-sm font-semibold text-white shadow-sm hover:bg-gov-accent/95"
          >
            <Plus className="h-4 w-4" />
            Tambah
          </button>
        </div>
      </div>

      {/* Keamanan & Token Management */}
      <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-amber-100">
            <div className="h-3 w-3 rounded-full bg-amber-600" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-amber-900">Keamanan & Token Management</div>
            <div className="mt-2 text-sm text-amber-800">
              <div className="space-y-2">
                <div>
                  <strong>Tambah Manual:</strong> Isi NIM/NPM & Nama, biarkan kolom Token kosong untuk generate otomatis (12 karakter A-Z,a-z,0-9). Token asli ditampilkan sekali di toast; setelah itu hanya hash yang disimpan.
                </div>
                <div>
                  <strong>Import CSV:</strong> Format file <code>nim,name</code> (tanpa token). Sistem create token random untuk tiap baris, lalu tampilkan tombol Download CSV & Cetak PDF master list. Unduh/cetak segera dan simpan secara offline.
                </div>
                <div>
                  <strong>Distribusi Token:</strong> Kirim token ke pemilih via kanal aman. Jangan pernah re-upload token asli ke server; database hanya menyimpan hash BCrypt (tidak bisa dibalik).
                </div>
                <div>
                  <strong>Reset Status:</strong> Gunakan fitur reset hanya untuk koreksi. Semua perubahan tercatat di audit log (<code>ADMIN_ACTION</code>) dengan NIM/NPM yang dimodifikasi.
                </div>
              </div>
              <div className="mt-3 rounded-lg border border-amber-300 bg-amber-100 px-3 py-2 text-xs font-medium text-amber-900">
                <strong>Peringatan:</strong> Jangan simpan master list token di repo atau cloud publik. Backup offline dengan enkripsi bila perlu.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari NIM/NPM atau Nama..."
            className="h-11 w-full rounded-xl border border-zinc-300 bg-white pl-10 pr-4 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-gov-accent focus:outline-none focus:ring-4 focus:ring-gov-accent/15"
          />
        </div>

        <div className="text-xs text-zinc-500">
          Menampilkan {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} dari {filtered.length}
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs font-semibold text-zinc-600">
              <tr>
                <th className="px-4 py-3">NIM/NPM</th>
                <th className="px-4 py-3">Nama</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {loading ? (
                <tr>
                  <td className="px-4 py-4 text-zinc-500" colSpan={4}>
                    Memuat...
                  </td>
                </tr>
              ) : pageItems.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-zinc-500" colSpan={4}>
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                pageItems.map((v) => (
                  <tr key={v.nim} className="hover:bg-zinc-50">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700">{v.nim}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-gov-blue">{v.name}</div>
                    </td>
                    <td className="px-4 py-3">
                      {v.has_voted ? (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                          Sudah Pilih
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                          Belum
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingNim(v.nim)
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

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page <= 1}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          Prev
        </button>
        <div className="text-sm font-semibold text-zinc-700">
          Page {page} / {totalPages}
        </div>
        <button
          type="button"
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages}
          className="inline-flex h-10 items-center justify-center rounded-xl border border-zinc-200 bg-white px-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          Next
        </button>
      </div>

      <Modal
        open={exportOpen}
        title="Download Rekap DPT"
        onClose={() => (exporting ? null : setExportOpen(false))}
        footer={
          <>
            <button
              type="button"
              onClick={() => setExportOpen(false)}
              disabled={exporting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => downloadVotersRecapCsv({ onlyVoted: false })}
              disabled={exporting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white shadow-sm hover:bg-zinc-900/95 disabled:opacity-50"
            >
              {exporting ? 'Memproses...' : 'Download Semua'}
            </button>
            <button
              type="button"
              onClick={() => downloadVotersRecapCsv({ onlyVoted: true })}
              disabled={exporting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-emerald-600/95 disabled:opacity-50"
            >
              {exporting ? 'Memproses...' : 'Hanya Sudah Memilih'}
            </button>
          </>
        }
      >
        <div className="space-y-2 text-sm text-zinc-700">
          <div>Rekap akan diunduh dalam format CSV (Excel-friendly).</div>
          <div className="text-xs text-zinc-500">Kolom: nim, name, has_voted</div>
        </div>
      </Modal>

      <Modal
        open={importOpen}
        title="Import DPT (CSV: nim,name)"
        onClose={() => (importing ? null : setImportOpen(false))}
        footer={
          <>
            <button
              type="button"
              onClick={() => setImportOpen(false)}
              disabled={importing}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={startImport}
              disabled={importing || importMasterList.length === 0}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gov-accent px-4 text-sm font-semibold text-white shadow-sm hover:bg-gov-accent/95 disabled:opacity-50"
            >
              {importing ? 'Mengimpor...' : 'Mulai Import'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div className="text-sm text-zinc-700">
            Sistem otomatis membuat token acak 12 karakter (A-Z, a-z, 0-9) untuk setiap pemilih.
          </div>

          <input
            type="file"
            accept=".csv,text/csv"
            onChange={(e) => handleDptFile(e.target.files?.[0])}
            disabled={importing}
            className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-xl file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-zinc-700 hover:file:bg-zinc-200"
          />

          <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
            Row siap diimport: <span className="font-semibold">{importMasterList.length}</span>
          </div>

          {importing || importProgress.total > 0 ? (
            <div>
              <div className="flex items-center justify-between text-xs text-zinc-600">
                <div>Progress</div>
                <div>
                  {importProgress.done}/{importProgress.total}
                </div>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-zinc-200">
                <div
                  className="h-2 rounded-full bg-gov-accent"
                  style={{
                    width:
                      importProgress.total > 0
                        ? `${Math.round((importProgress.done / importProgress.total) * 100)}%`
                        : '0%',
                  }}
                />
              </div>
            </div>
          ) : null}

          {importErrors.length > 0 ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              Gagal import: {importErrors.length} baris.
              <div className="mt-2 max-h-32 overflow-auto text-xs">
                {importErrors.slice(0, 10).map((e) => (
                  <div key={e.nim}>
                    {e.nim}: {e.message}
                  </div>
                ))}
                {importErrors.length > 10 ? <div>...</div> : null}
              </div>
            </div>
          ) : null}

          {importProgress.total > 0 && !importing && importMasterList.length > 0 ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <div className="text-sm font-semibold text-red-700">WARNING: One-time Token List</div>
              <div className="mt-1 text-xs text-red-700">
                Download/cetak daftar ini SEKARANG. Token disimpan dalam bentuk hash di database dan tidak bisa ditampilkan kembali.
              </div>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button
                  type="button"
                  onClick={downloadMasterListCsv}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-semibold text-white hover:bg-zinc-900/95"
                >
                  <FileDown className="h-4 w-4" />
                  Download CSV (Excel)
                </button>
                <button
                  type="button"
                  onClick={printMasterList}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  <Printer className="h-4 w-4" />
                  Cetak / Save PDF
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal
        open={resetOpen}
        title="Reset Status Memilih (Debug Only)"
        onClose={() => (submitting ? null : setResetOpen(false))}
        footer={
          <>
            <button
              type="button"
              onClick={() => setResetOpen(false)}
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={resetVoteStatus}
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-amber-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-amber-600/95 disabled:opacity-50"
            >
              {submitting ? 'Memproses...' : 'Reset'}
            </button>
          </>
        }
      >
        <div className="text-sm text-zinc-700">Masukkan NIM/NPM yang akan di-reset (has_voted = false).</div>
        <input
          value={resetNim}
          onChange={(e) => setResetNim(e.target.value)}
          inputMode="numeric"
          autoComplete="off"
          className="mt-3 h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 shadow-sm focus:border-gov-accent focus:outline-none focus:ring-4 focus:ring-gov-accent/15"
        />
        <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          Gunakan hanya untuk koreksi kesalahan input/pengujian. Ini dapat memengaruhi integritas pemilihan.
        </div>
      </Modal>

      <Modal
        open={formOpen}
        title="Tambah Pemilih"
        onClose={() => (submitting ? null : setFormOpen(false))}
        footer={
          <>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={addVoter}
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-gov-accent px-4 text-sm font-semibold text-white shadow-sm hover:bg-gov-accent/95 disabled:opacity-50"
            >
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </button>
          </>
        }
      >
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-zinc-700" htmlFor="v_nim">
              NIM/NPM
            </label>
            <input
              id="v_nim"
              value={nim}
              onChange={(e) => setNim(e.target.value)}
              inputMode="numeric"
              autoComplete="off"
              className="mt-2 h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 shadow-sm focus:border-gov-accent focus:outline-none focus:ring-4 focus:ring-gov-accent/15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700" htmlFor="v_name">
              Nama
            </label>
            <input
              id="v_name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="off"
              className="mt-2 h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 shadow-sm focus:border-gov-accent focus:outline-none focus:ring-4 focus:ring-gov-accent/15"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700" htmlFor="v_token">
              Token Asli
            </label>
            <input
              id="v_token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              type="password"
              autoComplete="off"
              className="mt-2 h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 shadow-sm focus:border-gov-accent focus:outline-none focus:ring-4 focus:ring-gov-accent/15"
            />
            <div className="mt-2 text-xs text-zinc-500">Token akan di-hash di server melalui RPC (lebih aman).</div>
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
              onClick={deleteVoter}
              disabled={submitting}
              className="inline-flex h-11 items-center justify-center rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-sm hover:bg-red-600/95 disabled:opacity-50"
            >
              {submitting ? 'Menghapus...' : 'Hapus'}
            </button>
          </>
        }
      >
        <div className="text-sm text-zinc-700">Anda yakin menghapus pemilih NIM {deletingNim}?</div>
      </Modal>
    </>
  )
}
