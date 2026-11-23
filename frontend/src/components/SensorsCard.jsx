import { Card, CardHeader } from './Card.jsx'
import { RadarIcon, MotionIcon, ShieldIcon, CheckIcon, AlertIcon } from './Icons.jsx'

export function SensorsCard({ status }) {
  const { sensors, system } = status
  const distance = sensors.distanceCm
  const hasDistance = typeof distance === 'number' && Number.isFinite(distance)
  const percent = hasDistance ? Math.min(100, Math.max(0, (distance / 400) * 100)) : 0
  const operational = system.status === 'operational'

  return (
    <Card>
      <CardHeader
        icon={RadarIcon}
        title="Capteurs"
        subtitle="Mesures en temps quasi réel"
        tone="sky"
      />

      <div className="space-y-6">
        <div>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">HC-SR04</p>
              <p className="mt-1 text-sm text-slate-300">Distance mesurée</p>
            </div>
            <p className="text-3xl font-bold tabular-nums text-white">
              {hasDistance ? distance.toFixed(0) : '—'}
              <span className="ml-1 text-sm font-medium text-slate-500">cm</span>
            </p>
          </div>

          <div className="relative mt-4 h-2 rounded-full bg-slate-700/60">
            <div className="absolute inset-y-0 left-0 w-full rounded-full bg-gradient-to-r from-emerald-500/70 via-sky-500/50 to-slate-600/60 opacity-60" />
            {hasDistance && (
              <div
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-950 bg-sky-300 shadow-[0_0_12px_rgba(125,211,252,0.8)] transition-[left] duration-700"
                style={{ left: `${percent}%` }}
              />
            )}
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-500">
            <span>0 cm · proche</span>
            <span>400 cm · loin</span>
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/40 p-3.5">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex rounded-lg p-2 ${
                sensors.pirDetected
                  ? 'bg-amber-400/10 text-amber-300'
                  : 'bg-slate-700/40 text-slate-500'
              }`}
            >
              <MotionIcon className="h-5 w-5" />
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Capteur PIR</p>
              <p className="mt-0.5 text-sm text-slate-200">
                {sensors.pirDetected ? 'Présence détectée' : 'Aucune présence'}
              </p>
            </div>
          </div>
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              sensors.pirDetected ? 'bg-amber-400 shadow-[0_0_10px_#fbbf24]' : 'bg-slate-600'
            }`}
          />
        </div>

        <div className="flex items-center justify-between rounded-xl border border-white/5 bg-slate-950/40 p-3.5">
          <div className="flex items-center gap-3">
            <span
              className={`inline-flex rounded-lg p-2 ${
                operational ? 'bg-emerald-400/10 text-emerald-300' : 'bg-amber-400/10 text-amber-300'
              }`}
            >
              {operational ? <CheckIcon className="h-5 w-5" /> : <AlertIcon className="h-5 w-5" />}
            </span>
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-500">Système</p>
              <p className="mt-0.5 text-sm capitalize text-slate-200">{system.status}</p>
            </div>
          </div>
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              operational ? 'bg-emerald-400 shadow-[0_0_10px_#34d399]' : 'bg-amber-400'
            }`}
          />
        </div>

        <p className="text-xs leading-relaxed text-slate-500">{system.message}</p>
      </div>
    </Card>
  )
}
