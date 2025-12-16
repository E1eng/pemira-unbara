import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import Toast from '../../components/Toast.jsx'
import { supabase } from '../../lib/supabaseClient.js'
import { friendlyError } from '../../lib/friendlyError.js'

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

  useEffect(() => {
    let cancelled = false

    const fetchLogs = async ({ background } = {}) => {
      const bg = Boolean(background)

      if (!bg) {
        setInitialLoading(true)
        setToast({ open: false, message: '', variant: 'error', title: '' })
      }

      const { data, error } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200)

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
        reason: details.reason,
        ip: details.ip,
        userAgent: details.userAgent,
        nik: details.nik,
      }
    })
  }, [logs])

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
        <div className="text-sm text-zinc-500">Thesis Highlight</div>
        <h1 className="mt-1 text-xl font-bold tracking-tight text-gov-blue sm:text-2xl">Security Log (Audit Trail)</h1>
        <div className="mt-2 text-sm text-zinc-600">Menampilkan aktivitas penting untuk OWASP A09 (Security Logging).</div>
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
                rows.map((r) => (
                  <tr key={r.id} className={[rowStyle(r.action), 'hover:bg-zinc-50'].join(' ')}>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-zinc-700">{r.time}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="font-semibold text-gov-blue">{r.action}</div>
                      {r.nik ? <div className="text-xs text-zinc-500">NIK: {r.nik}</div> : null}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-zinc-700">
                        {r.reason ? <div>Reason: {r.reason}</div> : null}
                        {r.ip ? <div>IP: {r.ip}</div> : null}
                        {r.userAgent ? <div className="truncate">UA: {r.userAgent}</div> : null}
                        {!r.reason && !r.ip && !r.userAgent ? <div className="text-zinc-500">(no details)</div> : null}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  )
}
