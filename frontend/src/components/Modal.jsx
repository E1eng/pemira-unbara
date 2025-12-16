export default function Modal({ open, title, children, footer, onClose }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg rounded-2xl border border-zinc-200 bg-white shadow-xl">
        <div className="px-5 py-4 sm:px-6">
          <div className="text-base font-semibold text-gov-blue">{title}</div>
        </div>

        <div className="px-5 pb-5 sm:px-6">{children}</div>

        {footer ? (
          <div className="flex flex-col gap-2 border-t border-zinc-200 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  )
}
