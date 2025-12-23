import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import Toast from '../../components/Toast.jsx'
import { supabase } from '../../lib/supabaseClient.js'
import { friendlyError } from '../../lib/friendlyError.js'

const PAGE_SIZE = 20

function parseDetails(details) {
  if (!details || typeof details !== 'object') return {}
  return details
}

function rowStyle(action) {
  if (action === 'LOGIN_FAIL') return 'bg-red-50'
  if (action === 'VOTE_SUCCESS') return 'bg-emerald-50'
  if (action === 'SYSTEM_ERROR') return 'bg-amber-50'
  return ''
}

export default function AdminAuditPage() {
  const [toast, setToast] = useState({ open: false, message: '', variant: 'error', title: '' })
  const [initialLoading, setInitialLoading] = useState(true)
  const [logs, setLogs] = useState([])
  const [page, setPage] = useState(1)

  useEffect(() => {
    let cancelled = false

    const fetchLogs = async ({ background } = {}) => {
      const bg = Boolean(background)

      if (!bg) {
        setInitialLoading(true)
        setToast({ open: false, message: '', variant: 'error', title: '' })
      }

      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(500)

      if (cancelled) return

      if (error) {
        if (!bg) {
          setToast({ open: true, variant: 'error', title: 'Tidak dapat memuat', message: friendlyError(error) })
        }
      } else {
        setLogs(Array.isArray(data) ? data : [])
      }

      setInitialLoading(false)
    }

    fetchLogs({ background: false })
    const interval = setInterval(() => fetchLogs({ background: true }), 10000)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  const rows = useMemo(() => {
    return logs.map((l) => {
      const details = parseDetails(l.details)
      return {
        id: l.id,
        time: l.created_at ? format(new Date(l.created_at), 'dd MMM HH:mm') : '-',
        action: l.action,
        data: details, // Pass full details object for custom rendering
        reason: details.reason,
        ip: details.ip,
        userAgent: details.userAgent,
        nim: details.nim,
      }
    })
  }, [logs])

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const paginatedRows = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return rows.slice(start, start + PAGE_SIZE)
  }, [rows, page])

  return (
    <>
      <Toast
        open={toast.open}
        variant={toast.variant}
        title={toast.title}
        message={toast.message}
        onClose={() => setToast({ open: false, message: '', variant: 'error', title: '' })}
      />

      <div>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-gov-blue sm:text-2xl">Audit Log</h1>
        <div className="mt-2 text-sm text-zinc-600">Catatan aktivitas penting untuk transparansi dan keamanan pemilihan.</div>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs font-semibold text-zinc-600">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Event</th>
                <th className="px-4 py-3">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              {initialLoading && rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-zinc-500" colSpan={3}>
                    Memuat...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-zinc-500" colSpan={3}>
                    Tidak ada data.
                  </td>
                </tr>
              ) : (
                paginatedRows.map((r) => (
                  <tr key={r.id} className={[rowStyle(r.action), 'hover:bg-zinc-50'].join(' ')}>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-zinc-700">{r.time}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-gov-blue">{r.action}</div>
                      {r.nim ? <div className="text-xs text-zinc-500">NIM/NPM: {r.nim}</div> : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-zinc-700 space-y-0.5">
                        {/* Security Logs */}
                        {r.data.reason ? <div>Reason: <span className="font-medium">{r.data.reason}</span></div> : null}
                        {r.data.ip ? <div className="font-mono text-xs text-zinc-500">IP: {r.data.ip}</div> : null}
                        {r.data.userAgent ? <div className="truncate max-w-xs text-zinc-400" title={r.data.userAgent}>UA: {r.data.userAgent}</div> : null}

                        {/* Admin Action Logs */}
                        {r.data.table ? (
                          <div className="flex items-center gap-2">
                            <span className="bg-zinc-100 px-1.5 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider">{r.data.table}</span>
                            <span className={`font-bold ${r.data.op === 'DELETE' ? 'text-red-600' : 'text-indigo-600'}`}>{r.data.op}</span>
                          </div>
                        ) : null}

                        {r.data.name ? <div>Name: <span className="font-medium">{r.data.name}</span></div> : null}
                        {r.data.id ? <div className="font-mono text-[10px] text-zinc-400">ID: {r.data.id}</div> : null}
                        {r.data.voting_open !== undefined ? (
                          <div>Status Voting: {r.data.voting_open ? <span className="text-emerald-600 font-bold">OPEN</span> : <span className="text-red-600 font-bold">CLOSED</span>}</div>
                        ) : null}
                        {r.data.live_result !== undefined ? (
                          <div>Live Result: {r.data.live_result ? <span className="text-emerald-600 font-bold">SHOWN</span> : <span className="text-zinc-500 font-bold">HIDDEN</span>}</div>
                        ) : null}

                        {!r.data.reason && !r.data.ip && !r.data.table && !r.data.type ? <div className="text-zinc-400 italic">(no details)</div> : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {rows.length > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-center gap-4">
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
      )}
    </>
  )
}
