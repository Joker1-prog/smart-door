import { useEffect, useRef, useState } from 'react'
import { LockIcon, AlertIcon, CheckIcon } from './Icons.jsx'

export function AuthModal({ open, onClose, onSubmit, busy, error }) {
  const [code, setCode] = useState('')
  const inputRef = useRef(null)

  useEffect(() => {
    if (!open) return
    setCode('')
    const timer = setTimeout(() => inputRef.current?.focus(), 40)
    return () => clearTimeout(timer)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && !busy) onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, busy, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onClose()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        className="card fade-up w-full max-w-md p-6"
      >
        <div className="flex items-start gap-3">
          <span className="inline-flex rounded-xl bg-emerald-400/10 p-2.5 text-emerald-300 ring-1 ring-emerald-400/20">
            <LockIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 id="auth-title" className="text-lg font-semibold text-white">
              Code d’accès requis
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Toute commande doit être authentifiée par le serveur.
            </p>
          </div>
        </div>

        <form
          className="mt-6"
          onSubmit={(event) => {
            event.preventDefault()
            if (code.trim() && !busy) onSubmit(code)
          }}
        >
          <label htmlFor="access-code" className="block text-xs font-medium uppercase tracking-wider text-slate-400">
            Code d’accès
          </label>
          <input
            id="access-code"
            ref={inputRef}
            type="password"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="current-password"
            placeholder="Saisissez le code d’accès"
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-emerald-400/60 focus:ring-2 focus:ring-emerald-400/20"
          />

          {error && (
            <p className="mt-3 flex items-start gap-2 text-sm text-rose-300">
              <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </p>
          )}

          <p className="mt-4 rounded-lg bg-slate-950/50 px-3 py-2 text-xs leading-relaxed text-slate-500">
            Le code est défini dans <code className="text-slate-400">backend/.env</code> (ACCESS_CODE) et vérifié
            côté serveur. Il n’est jamais stocké dans le code du frontend.
          </p>

          <div className="mt-6 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={busy}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-slate-200 disabled:opacity-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={busy || !code.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
            >
              {busy ? <span className="h-4 w-4 rounded-full border-2 border-slate-400 border-t-transparent spin-slow" /> : <CheckIcon className="h-4 w-4" />}
              {busy ? 'Vérification...' : 'Valider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
