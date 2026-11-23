import { CheckIcon, AlertIcon } from './Icons.jsx'

export function Toast({ toast, onClose }) {
  if (!toast) return null

  const isError = toast.type === 'error'

  return (
    <div
      role="status"
      className={`fade-up fixed bottom-5 right-5 z-40 flex max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur ${
        isError
          ? 'border-rose-400/25 bg-rose-950/80 text-rose-100'
          : 'border-emerald-400/25 bg-emerald-950/80 text-emerald-100'
      }`}
    >
      {isError ? <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" /> : <CheckIcon className="mt-0.5 h-4 w-4 shrink-0" />}
      <p className="text-sm leading-relaxed">{toast.message}</p>
      <button
        type="button"
        onClick={onClose}
        className="ml-1 text-lg leading-none text-current opacity-50 transition hover:opacity-100"
        aria-label="Fermer la notification"
      >
        ×
      </button>
    </div>
  )
}
