import { config } from '../../config.js';
import { prisma } from '../../lib/prisma.js';
import { logEvent, safeLogEvent, EVENT_TYPES } from '../eventService.js';

const DEVICE_ID = 1;
const DEVICE_NAME = 'ESP32 DevKit V1 (DEMO)';
const SIMULATION_INTERVAL_MS = 5000;
const SENSOR_PERSIST_EVERY_TICKS = 3;
const PRESENCE_EVENT_COOLDOWN_MS = 20_000;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function round(value, decimals = 1) {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Service DEMO : aucun échange avec le matériel.
 * Il maintient un état en mémoire, simule les capteurs et persiste les
 * événements / mesures dans SQLite.
 *
 * L'interface publique (init, getStatus, openDoor, setAlarm, shutdown) est la
 * même que celle du service Blynk, ce qui permet de changer de mode via
 * IOT_MODE sans toucher aux routes.
 */
export class DemoService {
  constructor() {
    this.mode = 'demo';
    this.state = {
      connected: true,
      doorState: 'closed',
      alarmEnabled: false,
      distanceCm: 185,
      pirDetected: false,
      buzzer: false,
      openedAt: null,
      lastSeenAt: new Date(),
      lastPresenceEventAt: 0,
    };
    this.openTimer = null;
    this.simulationTimer = null;
    this.tickCount = 0;
    this.ticking = false;
    this.stopping = false;
  }

  async init() {
    await this.persistDevice('online');
    await logEvent(
      EVENT_TYPES.DEVICE_CONNECTED,
      'ESP32 connecté en mode DEMO (données simulées, aucune commande réelle)'
    );

    this.simulationTimer = setInterval(() => {
      this.tick().catch((error) => console.error('[demo] Erreur de simulation:', error.message));
    }, SIMULATION_INTERVAL_MS);
    this.simulationTimer.unref?.();

    console.log('[demo] Mode DEMO actif : capteurs simulés, commandes non transmises au matériel.');
  }

  async persistDevice(status) {
    this.state.lastSeenAt = new Date();
    try {
      await prisma.device.upsert({
        where: { id: DEVICE_ID },
        create: {
          id: DEVICE_ID,
          name: DEVICE_NAME,
          status,
          lastSeen: this.state.lastSeenAt,
        },
        update: {
          name: DEVICE_NAME,
          status,
          lastSeen: this.state.lastSeenAt,
        },
      });
    } catch (error) {
      console.error('[demo] Impossible de mettre à jour le device:', error.message);
    }
  }

  async tick() {
    if (this.ticking || this.stopping) return;
    this.ticking = true;

    try {
      this.tickCount += 1;

      const drift = Math.random() * 50 - 25;
      this.state.distanceCm = clamp(round(this.state.distanceCm + drift), 15, 400);

      const presenceChance = this.state.distanceCm < 100 ? 0.5 : 0.07;
      const presence = Math.random() < presenceChance;

      if (presence && !this.state.pirDetected) {
        this.state.pirDetected = true;
        const now = Date.now();
        if (now - this.state.lastPresenceEventAt > PRESENCE_EVENT_COOLDOWN_MS) {
          this.state.lastPresenceEventAt = now;
          safeLogEvent(
            EVENT_TYPES.PRESENCE_DETECTED,
            `Présence détectée par le capteur PIR (distance mesurée : ${round(this.state.distanceCm)} cm)`
          );
        }
      } else if (!presence) {
        this.state.pirDetected = false;
      }

      this.state.buzzer = this.state.alarmEnabled && this.state.pirDetected;

      if (this.tickCount % SENSOR_PERSIST_EVERY_TICKS === 0) {
        const snapshot = {
          distance: round(this.state.distanceCm),
          pirDetected: this.state.pirDetected,
        };
        prisma.sensorData.create({ data: snapshot }).catch((error) => {
          console.error('[demo] Impossible de persister les données capteur:', error.message);
        });
      }

      await this.persistDevice('online');
    } finally {
      this.ticking = false;
    }
  }

  async openDoor() {
    if (this.state.doorState === 'open') {
      return {
        accepted: false,
        reason: 'ALREADY_OPEN',
        message: 'La porte est déjà ouverte.',
        simulated: true,
      };
    }

    this.state.doorState = 'open';
    this.state.openedAt = new Date();
    this.scheduleAutoClose();

    let command = null;
    try {
      command = await prisma.command.create({
        data: { commandType: 'DOOR_OPEN', status: 'SIMULATED' },
      });
    } catch (error) {
      console.error('[demo] Impossible d’enregistrer la commande:', error.message);
    }

    safeLogEvent(
      EVENT_TYPES.DOOR_OPENED,
      `Ouverture simulée depuis le tableau de bord (fermeture automatique dans ${config.openDurationSeconds} s)`
    );

    return {
      accepted: true,
      simulated: true,
      message: `Mode DEMO : ouverture simulée. La porte se refermera automatiquement dans ${config.openDurationSeconds} secondes.`,
      command,
      status: this.getStatus(),
    };
  }

  scheduleAutoClose() {
    clearTimeout(this.openTimer);
    this.openTimer = setTimeout(() => {
      this.closeDoor().catch((error) => console.error('[demo] Erreur de fermeture:', error.message));
    }, config.openDurationSeconds * 1000);
    this.openTimer.unref?.();
  }

  async closeDoor() {
    if (this.state.doorState !== 'open') return;

    this.state.doorState = 'closed';
    this.state.openedAt = null;
    this.state.buzzer = false;
    clearTimeout(this.openTimer);
    this.openTimer = null;

    safeLogEvent(
      EVENT_TYPES.DOOR_AUTO_CLOSED,
      `Fermeture automatique après ${config.openDurationSeconds} secondes (mode DEMO)`
    );
  }

  async setAlarm(enabled) {
    if (this.state.alarmEnabled === enabled) {
      return {
        accepted: true,
        changed: false,
        simulated: true,
        enabled,
        message: enabled ? "L'alarme est déjà activée." : "L'alarme est déjà désactivée.",
        status: this.getStatus(),
      };
    }

    this.state.alarmEnabled = enabled;
    this.state.buzzer = enabled && this.state.pirDetected;

    safeLogEvent(
      enabled ? EVENT_TYPES.ALARM_ENABLED : EVENT_TYPES.ALARM_DISABLED,
      enabled ? 'Alarme activée depuis le tableau de bord (mode DEMO)' : 'Alarme désactivée depuis le tableau de bord (mode DEMO)'
    );

    return {
      accepted: true,
      changed: true,
      simulated: true,
      enabled,
      message: enabled ? 'Alarme activée (simulation).' : 'Alarme désactivée (simulation).',
      status: this.getStatus(),
    };
  }

  ensureConsistentState() {
    if (!this.state.openedAt) return;
    const deadline = this.state.openedAt.getTime() + config.openDurationSeconds * 1000;
    if (this.state.doorState === 'open' && Date.now() >= deadline) {
      this.closeDoor().catch((error) => console.error('[demo] Erreur de fermeture:', error.message));
    }
  }

  getStatus() {
    this.ensureConsistentState();

    const now = Date.now();
    const openedAt = this.state.openedAt;
    const remaining =
      this.state.doorState === 'open' && openedAt
        ? Math.max(0, Math.ceil((openedAt.getTime() + config.openDurationSeconds * 1000 - now) / 1000))
        : 0;

    const isConnected = this.state.connected;

    return {
      mode: 'demo',
      simulated: true,
      device: {
        id: DEVICE_ID,
        name: DEVICE_NAME,
        connected: isConnected,
        status: isConnected ? 'online' : 'offline',
        lastSeen: this.state.lastSeenAt.toISOString(),
      },
      door: {
        state: this.state.doorState,
        isOpen: this.state.doorState === 'open',
        openDurationSeconds: config.openDurationSeconds,
        remainingOpenSeconds: remaining,
        openedAt: openedAt ? openedAt.toISOString() : null,
      },
      sensors: {
        distanceCm: round(this.state.distanceCm),
        pirDetected: this.state.pirDetected,
        presence: this.state.pirDetected ? 'detected' : 'none',
      },
      indicators: {
        redLed: this.state.alarmEnabled,
        greenLed: this.state.doorState === 'open',
        buzzer: this.state.buzzer,
      },
      alarm: {
        enabled: this.state.alarmEnabled,
      },
      system: {
        status: 'operational',
        message:
          'Mode DEMO — les données sont simulées et aucune commande réelle n’est envoyée à l’ESP32.',
      },
      updatedAt: new Date().toISOString(),
    };
  }

  async shutdown() {
    this.stopping = true;
    clearInterval(this.simulationTimer);
    clearTimeout(this.openTimer);
    this.simulationTimer = null;
    this.openTimer = null;

    try {
      await this.persistDevice('offline');
      await logEvent(EVENT_TYPES.DEVICE_DISCONNECTED, 'Serveur arrêté : ESP32 DEMO déconnecté');
    } catch (error) {
      console.error('[demo] Impossible de journaliser la déconnexion:', error.message);
    }
  }
}
