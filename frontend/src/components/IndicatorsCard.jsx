import { Card, CardHeader } from './Card.jsx'
import { ShieldIcon, BellIcon, DoorIcon, VolumeIcon, WifiIcon, LockIcon } from './Icons.jsx'

const LED_COLORS = {
  rose: '#fb7185',
  emerald: '#34d399',
  amber: '#fbbf24',
  sky: '#38bdf8',
}

function IndicatorRow({ icon: RowIcon, label, value, active, color }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-white/5 bg-slate-950/40 px-3.5 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className={`inline-flex shrink-0 rounded-lg p-2 ${active ? 'bg-white/5 text-slate-300' : 'bg-slate-800/50 text-slate-600'}`}>
          <RowIcon className="h-4.5 w-4.5" />
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-slate-200">{label}</p>
          <p className="truncate text-xs text-slate-500">{value}</p>
        </div>
      </div>
      <span className={`led-dot shrink-0 ${active ? 'is-on' : ''}`} style={{ '--led-color': LED_COLORS[color] }} />
    </div>
  )
}

export function IndicatorsCard({ status, onToggleAlarm, busy }) {
  const { indicators, device, door, alarm } = status
  const greenActive = indicators.greenLed
  const greenValue =
    door.state === 'open' ? 'Porte ouverte' : door.state === 'unknown' ? 'État inconnu' : 'Porte fermée'

  return (
    <Card>
      <CardHeader
        icon={ShieldIcon}
        title="Indicateurs"
        subtitle="État des sorties et de la liaison"
        tone="rose"
      />

      <div className="space-y-2.5">
        <IndicatorRow
          icon={BellIcon}
          label="LED rouge"
          value={alarm.enabled ? 'Alarme activée' : 'Alarme désactivée'}
          active={indicators.redLed}
          color="rose"
        />
        <IndicatorRow
          icon={DoorIcon}
          label="LED verte"
          value={greenValue}
          active={greenActive}
          color="emerald"
        />
        <IndicatorRow
          icon={VolumeIcon}
          label="Buzzer"
          value={indicators.buzzer ? 'Actif' : 'Inactif'}
          active={indicators.buzzer}
          color="amber"
        />
        <IndicatorRow
          icon={WifiIcon}
          label="Connexion ESP32"
          value={device.connected ? 'Connecté' : 'Déconnecté'}
          active={device.connected}
          color="sky"
        />
      </div>

      <button
        type="button"
        onClick={onToggleAlarm}
        disabled={busy}
        className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold ring-1 transition focus:outline-none focus-visible:ring-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          alarm.enabled
            ? 'bg-rose-500/10 text-rose-300 ring-rose-400/30 hover:bg-rose-500/20'
            : 'bg-slate-700/40 text-slate-200 ring-slate-500/30 hover:bg-slate-700/70'
        }`}
      >
        <LockIcon className="h-4 w-4" />
        {alarm.enabled ? 'Désactiver l’alarme' : 'Activer l’alarme'}
        <span className="ml-1 text-[10px] font-normal uppercase tracking-wider text-slate-500">code requis</span>
      </button>
    </Card>
  )
}
