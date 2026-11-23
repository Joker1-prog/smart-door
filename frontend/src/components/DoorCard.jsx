import { useEffect, useRef, useState } from 'react'
import { Card, CardHeader } from './Card.jsx'
import { DoorIcon, LockIcon, ClockIcon, AlertIcon } from './Icons.jsx'

const RADIUS = 66
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function DoorCard({ door, simulated, backendOnline, onOpen, busy }) {
  const [remaining, setRemaining] = useState(door.remainingOpenSeconds || 0)
  const deadline = useRef(null)

  useEffect(() => {
    if (door.isOpen && door.remainingOpenSeconds > 0) {
      deadline.current = Date.now() + door.remainingOpenSeconds * 1000
      setRemaining(door.remainingOpenSeconds)
    } else {
      deadline.current = null
      setRemaining(0)
    }
  }, [door.isOpen, door.remainingOpenSeconds, door.openedAt])

  useEffect(() => {
    const timer = setInterval(() => {
      if (!deadline.current) return
      setRemaining(Math.max(0, Math.ceil((deadline.current - Date.now()) / 1000)))
    }, 200)
    return () => clearInterval(timer)
  }, [])

  const duration = door.openDurationSeconds || 6
  const progress = door.isOpen ? Math.min(1, Math.max(0, remaining / duration)) : 0
  const isOpen = door.isOpen
  const isUnknown = door.state === 'unknown'

  const label = isOpen
    ? 'Porte ouverte'
    : isUnknown
      ? 'État inconnu'
      : 'Porte fermée'
  const description = isOpen
    ? 'La porte est ouverte. Une fermeture automatique est programmée.'
    : isUnknown
      ? 'L’état de la porte ne peut pas être confirmé par le dispositif.'
      : 'La porte est verrouillée. Le système surveille les capteurs.'

  const ringColor = isOpen ? '#34d399' : isUnknown ? '#fbbf24' : '#475569'

  return (
    <Card className="lg:col-span-2">
      <CardHeader
        icon={DoorIcon}
        title="État de la porte"
        subtitle="Commande d’ouverture et fermeture automatique"
        tone={isOpen ? 'emerald' : isUnknown ? 'amber' : 'slate'}
        right={
          <span
            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ring-1 ${
              isOpen
                ? 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20'
                : isUnknown
                  ? 'bg-amber-400/10 text-amber-300 ring-amber-400/20'
                  : 'bg-slate-400/10 text-slate-400 ring-slate-400/20'
            }`}
          >
            {isOpen ? 'OPEN' : isUnknown ? 'UNKNOWN' : 'CLOSED'}
          </span>
        }
      />

      <div className="flex flex-col items-center gap-7 sm:flex-row sm:gap-10">
        <div className="relative h-44 w-44 shrink-0 sm:h-52 sm:w-52">
          <div
            className={`absolute inset-4 rounded-full bg-emerald-400/10 blur-2xl transition-opacity ${
              isOpen ? 'ring-pulse opacity-100' : 'opacity-0'
            }`}
          />
          <svg viewBox="0 0 160 160" className="relative h-full w-full -rotate-90">
            <circle cx="80" cy="80" r={RADIUS} fill="none" stroke="#1e293b" strokeWidth="8" />
            <circle
              cx="80"
              cy="80"
              r={RADIUS}
              fill="none"
              stroke={ringColor}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
              style={{ transition: 'stroke-dashoffset 250ms linear, stroke 300ms ease' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <DoorIcon className={`h-9 w-9 ${isOpen ? 'text-emerald-300' : 'text-slate-500'}`} />
            {isOpen ? (
              <>
                <span className="mt-1 text-4xl font-bold tabular-nums text-white">{remaining}</span>
                <span className="text-[11px] uppercase tracking-widest text-slate-400">secondes</span>
              </>
            ) : (
              <span className="mt-2 text-xs font-medium uppercase tracking-widest text-slate-500">
                {isUnknown ? 'Inconnu' : 'Fermée'}
              </span>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h3 className={`text-2xl font-bold ${isOpen ? 'text-emerald-300' : 'text-white'}`}>{label}</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-400">{description}</p>

          <div className="mt-5 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <button
              type="button"
              onClick={onOpen}
              disabled={busy || isOpen || !backendOnline}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
            >
              {busy ? (
                <span className="h-4 w-4 rounded-full border-2 border-slate-400 border-t-transparent spin-slow" />
              ) : (
                <LockIcon className="h-4 w-4" />
              )}
              {isOpen ? 'Déjà ouverte' : busy ? 'Commande...' : 'Demander l’ouverture'}
            </button>

            <span className="inline-flex items-center gap-1.5 text-xs text-slate-500">
              <ClockIcon className="h-4 w-4" />
              Ouverture de {duration} secondes
            </span>
          </div>

          <div
            className={`mt-5 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-left text-xs leading-relaxed ${
              simulated
                ? 'border-amber-400/20 bg-amber-400/5 text-amber-200/80'
                : 'border-sky-400/20 bg-sky-400/5 text-sky-200/80'
            }`}
          >
            <AlertIcon className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              {simulated
                ? 'Mode DEMO : la commande est simulée. Aucune action réelle n’est transmise à l’ESP32.'
                : 'Mode Blynk : la commande est transmise à Blynk. La fermeture automatique est gérée par le firmware ESP32.'}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}
