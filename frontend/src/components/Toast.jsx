import { useEffect } from 'react'
import { X } from 'lucide-react'

export default function Toast({ open, variant = 'error', title, message, onClose, autoCloseMs }) {
  useEffect(() => {
    if (!open) return undefined
    if (!autoCloseMs) return undefined
    const t = setTimeout(() => {
      if (typeof onClose === 'function') onClose()
    }, autoCloseMs)
    return () => clearTimeout(t)
  }, [autoCloseMs, onClose, open])

  if (!open) return null

  const effectiveTitle =
    title ||
    (variant === 'success'
      ? 'Berhasil'
      : variant === 'warning'
        ? 'Perhatian'
        : variant === 'info'
          ? 'Info'
          : 'Perhatian')

  const styles =
    variant === 'error'
      ? {
          container: 'border-red-200 bg-red-50 text-red-800',
          icon: 'text-red-700',
        }
      : variant === 'warning'
        ? {
            container: 'border-amber-200 bg-amber-50 text-amber-900',
            icon: 'text-amber-800',
          }
        : variant === 'info'
          ? {
              container: 'border-blue-200 bg-blue-50 text-blue-900',
              icon: 'text-blue-800',
            }
          : {
              container: 'border-emerald-200 bg-emerald-50 text-emerald-800',
              icon: 'text-emerald-700',
            }

  return (
    <div className="fixed inset-x-0 top-3 z-50 mx-auto w-full max-w-lg px-4 sm:top-6">
      <div className={`rounded-2xl border px-4 py-3 shadow-lg ${styles.container}`} role="alert">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {effectiveTitle ? <div className="text-sm font-semibold">{effectiveTitle}</div> : null}
            <div className="mt-0.5 text-sm">{message}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-lg hover:bg-black/5 ${styles.icon}`}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
