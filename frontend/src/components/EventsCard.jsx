import { Card, CardHeader } from './Card.jsx'
import {
  MotionIcon,
  DoorIcon,
  ClockIcon,
  BellIcon,
  WifiIcon,
  SendIcon,
  ShieldIcon,
  RefreshIcon,
} from './Icons.jsx'

const TONE_CLASSES = {
  emerald: 'bg-emerald-400/10 text-emerald-300 ring-emerald-400/20',
  amber: 'bg-amber-400/10 text-amber-300 ring-amber-400/20',
  sky: 'bg-sky-400/10 text-sky-300 ring-sky-400/20',
  rose: 'bg-rose-400/10 text-rose-300 ring-rose-400/20',
  slate: 'bg-slate-400/10 text-slate-300 ring-slate-400/20',
}

const EVENT_META = {
  PRESENCE_DETECTED: { label: 'Présence détectée', tone: 'amber', Icon: MotionIcon },
  DOOR_OPENED: { label: 'Ouverture', tone: 'emerald', Icon: DoorIcon },
  DOOR_AUTO_CLOSED: { label: 'Fermeture auto', tone: 'sky', Icon: ClockIcon },
  DOOR_CLOSED: { label: 'Fermeture', tone: 'sky', Icon: ClockIcon },
  DOOR_COMMAND_SENT: { label: 'Commande envoyée', tone: 'sky', Icon: SendIcon },
  ALARM_ENABLED: { label: 'Alarme activée', tone: 'rose', Icon: BellIcon },
  ALARM_DISABLED: { label: 'Alarme désactivée', tone: 'slate', Icon: ShieldIcon },
  DEVICE_CONNECTED: { label: 'ESP32 connecté', tone: 'emerald', Icon: WifiIcon },
  DEVICE_DISCONNECTED: { label: 'ESP32 déconnecté', tone: 'rose', Icon: WifiIcon },
}

function formatTime(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(date)
}

function formatDate(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(date)
}

function formatRelative(iso) {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const seconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return 'à l’instant'
  if (seconds < 3600) return `il y a ${Math.floor(seconds / 60)} min`
  if (seconds < 86400) return `il y a ${Math.floor(seconds / 3600)} h`
  return `il y a ${Math.floor(seconds / 86400)} j`
}

export function EventsCard({ events, onRefresh }) {
  return (
    <Card className="lg:col-span-2">
      <CardHeader
        icon={RefreshIcon}
        title="Historique des événements"
        subtitle="Dernières activités enregistrées en base"
        tone="slate"
        right={
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-slate-400 transition hover:bg-white/5 hover:text-slate-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            Actualiser
          </button>
        }
      />

      {events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-950/30 px-4 py-10 text-center text-sm text-slate-500">
          Aucun événement enregistré pour le moment.
        </div>
      ) : (
        <ul className="max-h-[26rem] space-y-2 overflow-y-auto pr-1">
          {events.map((event) => {
            const meta = EVENT_META[event.eventType] || {
              label: event.eventType,
              tone: 'slate',
              Icon: ShieldIcon,
            }
            const EventIcon = meta.Icon

            return (
              <li
                key={event.id}
                className="flex items-start gap-3 rounded-xl border border-white/5 bg-slate-950/40 px-3.5 py-3 transition hover:border-white/10 hover:bg-slate-950/60"
              >
                <span className={`mt-0.5 inline-flex shrink-0 rounded-lg p-2 ring-1 ${TONE_CLASSES[meta.tone]}`}>
                  <EventIcon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                    <p className="text-sm font-medium text-slate-200">{meta.label}</p>
                    <span className="text-[11px] text-slate-500">{formatRelative(event.createdAt)}</span>
                  </div>
                  <p className="mt-0.5 break-words text-xs leading-relaxed text-slate-400">
                    {event.description}
                  </p>
                </div>
                <time
                  dateTime={event.createdAt}
                  className="hidden shrink-0 pt-1 text-[11px] tabular-nums text-slate-600 sm:block"
                >
                  {formatDate(event.createdAt)} · {formatTime(event.createdAt)}
                </time>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
