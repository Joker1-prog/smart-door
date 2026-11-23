import { DoorIcon, WifiIcon, ShieldIcon, AlertIcon, CheckIcon } from './Icons.jsx'

export function Header({ mode, backendOnline, deviceConnected }) {
  const isDemo = mode === 'demo'

  return (
    <header className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/30">
          <DoorIcon className="h-7 w-7" />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-emerald-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            SMART <span className="text-emerald-400">DOOR</span>
          </h1>
          <p className="text-xs text-slate-400 sm:text-sm">Supervision de la porte intelligente</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${
            backendOnline
              ? 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20'
              : 'bg-rose-400/10 text-rose-300 ring-rose-400/20'
          }`}
        >
          {backendOnline ? <CheckIcon className="h-3.5 w-3.5" /> : <AlertIcon className="h-3.5 w-3.5" />}
          {backendOnline ? 'API en ligne' : 'API hors ligne'}
        </span>

        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ring-1 ${
            deviceConnected
              ? 'bg-sky-400/10 text-sky-300 ring-sky-400/20'
              : 'bg-slate-400/10 text-slate-300 ring-slate-400/20'
          }`}
        >
          <WifiIcon className="h-3.5 w-3.5" />
          ESP32 {deviceConnected ? 'connecté' : 'déconnecté'}
        </span>

        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ${
            isDemo
              ? 'bg-amber-400/10 text-amber-300 ring-amber-400/25'
              : 'bg-violet-400/10 text-violet-300 ring-violet-400/25'
          }`}
        >
          <ShieldIcon className="h-3.5 w-3.5" />
          Mode {isDemo ? 'DEMO' : 'BLYNK'}
        </span>
      </div>
    </header>
  )
}
