import { useEffect, useRef, useState } from 'react'
import { api } from './api.js'
import { useDashboard } from './hooks/useDashboard.js'
import { Header } from './components/Header.jsx'
import { DoorCard } from './components/DoorCard.jsx'
import { SensorsCard } from './components/SensorsCard.jsx'
import { IndicatorsCard } from './components/IndicatorsCard.jsx'
import { EventsCard } from './components/EventsCard.jsx'
import { AuthModal } from './components/AuthModal.jsx'
import { Toast } from './components/Toast.jsx'
import { AlertIcon, DoorIcon, RefreshIcon } from './components/Icons.jsx'

const TOKEN_KEY = 'smartdoor.session'

function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-slate-400">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-400/10 text-emerald-300 ring-1 ring-emerald-400/20">
        <DoorIcon className="h-8 w-8" />
      </div>
      <p className="text-sm">Chargement du tableau de bord...</p>
      <span className="h-4 w-4 rounded-full border-2 border-emerald-400/40 border-t-emerald-300 spin-slow" />
    </div>
  )
}

export default function App() {
  const { status, events, loading, backendOnline, refreshStatus, refreshEvents } = useDashboard()
  const [token, setToken] = useState(() => {
    try {
      return sessionStorage.getItem(TOKEN_KEY) || ''
    } catch {
      return ''
    }
  })
  const [authOpen, setAuthOpen] = useState(false)
  const [authError, setAuthError] = useState('')
  const [authBusy, setAuthBusy] = useState(false)
  const [busyAction, setBusyAction] = useState(null)
  const [toast, setToast] = useState(null)
  const pendingAction = useRef(null)

  useEffect(() => {
    if (!toast) return undefined
    const timer = setTimeout(() => setToast(null), 6000)
    return () => clearTimeout(timer)
  }, [toast])

  function showToast(type, message) {
    setToast({ type, message })
  }

  function clearSession() {
    try {
      sessionStorage.removeItem(TOKEN_KEY)
    } catch {
      // Le stockage de session peut être indisponible (navigation privée).
    }
    setToken('')
  }

  async function openDoorAction(activeToken) {
    setBusyAction('open')
    try {
      const result = await api.openDoor(activeToken)
      showToast('success', result.message || 'Commande acceptée.')
      await Promise.allSettled([refreshStatus(), refreshEvents()])
    } catch (error) {
      if (error.status === 401) {
        clearSession()
        pendingAction.current = openDoorAction
        setAuthError('Session expirée. Saisissez à nouveau le code d’accès.')
        setAuthOpen(true)
      } else {
        showToast('error', error.message || 'Impossible d’envoyer la commande.')
      }
    } finally {
      setBusyAction(null)
    }
  }

  async function alarmAction(activeToken, enabled) {
    setBusyAction('alarm')
    try {
      const result = await api.setAlarm(activeToken, enabled)
      showToast('success', result.message || 'Commande d’alarme acceptée.')
      await Promise.allSettled([refreshStatus(), refreshEvents()])
    } catch (error) {
      if (error.status === 401) {
        clearSession()
        pendingAction.current = (newToken) => alarmAction(newToken, enabled)
        setAuthError('Session expirée. Saisissez à nouveau le code d’accès.')
        setAuthOpen(true)
      } else {
        showToast('error', error.message || 'Impossible de modifier l’alarme.')
      }
    } finally {
      setBusyAction(null)
    }
  }

  function requestOpen() {
    if (!token) {
      pendingAction.current = openDoorAction
      setAuthError('')
      setAuthOpen(true)
      return
    }
    openDoorAction(token)
  }

  function requestAlarmToggle() {
    if (!status) return
    const enabled = !status.alarm.enabled
    if (!token) {
      pendingAction.current = (newToken) => alarmAction(newToken, enabled)
      setAuthError('')
      setAuthOpen(true)
      return
    }
    alarmAction(token, enabled)
  }

  async function handleLogin(code) {
    setAuthBusy(true)
    setAuthError('')
    try {
      const result = await api.login(code)
      try {
        sessionStorage.setItem(TOKEN_KEY, result.token)
      } catch {
        // Session en mémoire uniquement si le stockage est indisponible.
      }
      setToken(result.token)
      setAuthOpen(false)
      showToast('success', 'Accès autorisé. Commande en cours...')

      const action = pendingAction.current
      pendingAction.current = null
      if (action) await action(result.token)
    } catch (error) {
      setAuthError(error.message || 'Connexion impossible.')
    } finally {
      setAuthBusy(false)
    }
  }

  if (loading && !status) {
    return <LoadingScreen />
  }

  if (!status) {
    return (
      <div className="relative z-10 mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
        <AlertIcon className="h-10 w-10 text-rose-400" />
        <h1 className="text-xl font-semibold text-white">Backend indisponible</h1>
        <p className="text-sm text-slate-400">
          Démarrez le serveur avec <code className="text-slate-300">npm run dev</code> dans le dossier{' '}
          <code className="text-slate-300">backend</code>, puis rechargez la page.
        </p>
        <button
          type="button"
          onClick={() => refreshStatus().catch(() => {})}
          className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-emerald-400"
        >
          <RefreshIcon className="h-4 w-4" />
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <Header
        mode={status.mode}
        backendOnline={backendOnline}
        deviceConnected={status.device.connected}
      />

      {!backendOnline && (
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
          <span className="flex items-center gap-2">
            <AlertIcon className="h-4 w-4" />
            Connexion au backend perdue. Les dernières données affichées peuvent être obsolètes.
          </span>
          <button
            type="button"
            onClick={() => {
              refreshStatus().catch(() => {})
              refreshEvents()
            }}
            className="rounded-lg bg-rose-400/15 px-3 py-1.5 text-xs font-semibold hover:bg-rose-400/25"
          >
            Reconnecter
          </button>
        </div>
      )}

      {status.configurationRequired && (
        <div className="mb-5 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
          {status.system.message} Tant que ce n’est pas fait, les commandes d’ouverture sont refusées.
        </div>
      )}

      <main className="grid grid-cols-1 gap-4 lg:grid-cols-3 lg:gap-5">
        <DoorCard
          door={status.door}
          simulated={status.simulated}
          backendOnline={backendOnline}
          onOpen={requestOpen}
          busy={busyAction === 'open'}
        />
        <SensorsCard status={status} />
        <IndicatorsCard status={status} onToggleAlarm={requestAlarmToggle} busy={busyAction === 'alarm'} />
        <EventsCard events={events} onRefresh={refreshEvents} />
      </main>

      <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-white/5 pt-5 text-xs text-slate-600">
        <span>SMART DOOR · v1.0.0 · React + Express + Prisma</span>
        <span>
          {status.simulated
            ? 'Mode DEMO — aucune commande réelle n’est exécutée sur l’ESP32.'
            : 'Mode Blynk — état et commandes dépendent de la connexion matériel.'}
        </span>
      </footer>

      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        onSubmit={handleLogin}
        busy={authBusy}
        error={authError}
      />
      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  )
}
