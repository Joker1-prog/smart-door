
import { config } from '../../config.js';
import { HttpError } from '../../lib/httpError.js';
import { prisma } from '../../lib/prisma.js';
import { safeLogEvent, EVENT_TYPES } from '../eventService.js';

const DEVICE_ID = 1;
const DEVICE_NAME = 'ESP32 DevKit V1 (Blynk)';
const CACHE_TTL_MS = 4000;
const DEVICE_UPDATE_INTERVAL_MS = 15_000;

function parseMaybeJson(value) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return trimmed;
  }
}

function toBool(value) {
  const parsed = parseMaybeJson(value);
  if (typeof parsed === 'boolean') return parsed;
  if (typeof parsed === 'number') return parsed !== 0;

  if (typeof parsed === 'string') {
    return ['1', 'true', 'on', 'yes', 'open', 'ouvert'].includes(
      parsed.trim().toLowerCase()
    );
  }

  return false;
}

function toNumber(value, fallback = null) {
  const parsed = Number(parseMaybeJson(value));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeDoorState(value) {
  const parsed = parseMaybeJson(value);

  if (typeof parsed === 'string') {
    const normalized = parsed.trim().toLowerCase();

    if (['1', 'open', 'ouvert', 'opened', 'true'].includes(normalized)) {
      return 'open';
    }

    if (['0', 'closed', 'ferme', 'fermé', 'false'].includes(normalized)) {
      return 'closed';
    }

    return 'unknown';
  }

  if (typeof parsed === 'boolean') return parsed ? 'open' : 'closed';
  if (typeof parsed === 'number') return parsed === 0 ? 'closed' : 'open';

  return 'unknown';
}

/**
 * Service Blynk (production).
 *
 * Il lit les virtual pins via l'API HTTP Blynk et transmet les commandes
 * d'ouverture et d'alarme sur les pins configurés.
 *
 * Il ne simule rien : sans BLYNK_AUTH_TOKEN, il signale explicitement que
 * l'intégration n'est pas configurée et refuse toute commande.
 *
 * Les pins et le jeton sont définis dans backend/.env (voir .env.example).
 */
export class BlynkService {
  constructor() {
    this.mode = 'blynk';
    this.cache = null;
    this.cacheAt = 0;
    this.inFlight = null;
    this.hardwareConnected = null;
    this.lastDoorState = null;
    this.lastKnown = null;
    this.lastDeviceUpdateAt = 0;
  }

  get configured() {
    return Boolean(config.blynk.authToken);
  }

  async init() {
    if (!this.configured) {
      console.warn(
        '[blynk] IOT_MODE=blynk mais BLYNK_AUTH_TOKEN est absent. ' +
          "L'API reste disponible mais les commandes seront refusées jusqu'à la configuration."
      );

      await this.updateDeviceRow('unconfigured', true);
      return;
    }

    try {
      const status = await this.getStatus({ force: true });

      if (status.device.connected) {
        console.log('[blynk] Connexion au matériel Blynk confirmée.');
      } else {
        console.warn('[blynk] Matériel Blynk non connecté :', status.system.message);
      }
    } catch (error) {
      console.warn('[blynk] Vérification initiale impossible :', error.message);
    }
  }

  async request(path, params = {}) {
    const url = new URL(`${config.blynk.baseUrl}${path}`);
    url.searchParams.set('token', config.blynk.authToken);

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, String(value));
    }

    let response;

    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(config.blynk.timeoutMs),
      });
    } catch {
      throw new Error('Blynk injoignable (timeout ou erreur réseau).');
    }

    const text = await response.text();

    if (!response.ok) {
      const details = text ? ` — ${text.slice(0, 120)}` : '';
      throw new Error(`Blynk a répondu avec le statut ${response.status}${details}`);
    }

    return text;
  }

  async fetchAllPins() {
    const text = await this.request('/getAll');
    const data = parseMaybeJson(text);

    if (!data || typeof data !== 'object' || Array.isArray(data)) {
      throw new Error('Réponse Blynk getAll invalide.');
    }

    return data;
  }

  async fetchPinsIndividually() {
    const values = {};

    for (const pin of Object.values(config.blynk.pins)) {
      const text = await this.request('/get', { [pin]: '' });
      values[pin] = parseMaybeJson(text.trim());
    }

    return values;
  }

  async fetchRemoteState() {
    const connectedText = await this.request('/isHardwareConnected');

    if (!toBool(connectedText)) {
      return { connected: false, values: null };
    }

    let values;

    try {
      values = await this.fetchAllPins();
    } catch {
      values = await this.fetchPinsIndividually();
    }

    return { connected: true, values };
  }

  async getStatus({ force = false } = {}) {
    if (!force && this.cache && Date.now() - this.cacheAt < CACHE_TTL_MS) {
      return this.cache;
    }

    if (this.inFlight) return this.inFlight;

    this.inFlight = this.fetchStatus()
      .catch((error) => {
        this.handleDisconnected(error.message);
        return this.offlineSnapshot(`Connexion Blynk impossible : ${error.message}`);
      })
      .finally(() => {
        this.inFlight = null;
      });

    return this.inFlight;
  }

  async fetchStatus() {
    if (!this.configured) {
      const snapshot = this.offlineSnapshot(
        'Blynk n’est pas configuré : renseignez BLYNK_AUTH_TOKEN dans backend/.env puis redémarrez le serveur.',
        true
      );

      this.cache = snapshot;
      this.cacheAt = Date.now();

      return snapshot;
    }

    const remote = await this.fetchRemoteState();

    if (!remote.connected) {
      this.handleDisconnected('Le matériel est hors ligne.');
      this.cache = this.offlineSnapshot('ESP32 déconnecté de Blynk.');
      this.cacheAt = Date.now();

      return this.cache;
    }

    this.handleConnected();

    const pins = config.blynk.pins;
    const values = remote.values;

    const distanceCm = toNumber(values[pins.distance], null);
    const pirDetected = toBool(values[pins.pir]);
    const doorState = normalizeDoorState(values[pins.doorState]);
    const alarmEnabled = toBool(values[pins.alarm]);

    // Le buzzer n'a pas de Datastream Blynk dédié.
    // Son état affiché est donc une indication basée sur l'alarme et le PIR.
    const buzzer = alarmEnabled && pirDetected;

    this.logDoorTransitions(doorState);

    this.lastKnown = {
      distanceCm,
      pirDetected,
      alarmEnabled,
      doorState,
      lastSeen: new Date().toISOString(),
    };

    const snapshot = {
      mode: 'blynk',
      simulated: false,
      configurationRequired: false,

      device: {
        id: DEVICE_ID,
        name: DEVICE_NAME,
        connected: true,
        status: 'online',
        lastSeen: this.lastKnown.lastSeen,
      },

      door: {
        state: doorState,
        isOpen: doorState === 'open',
        openDurationSeconds: config.openDurationSeconds,
        remainingOpenSeconds: 0,
        openedAt: null,
      },

      sensors: {
        distanceCm,
        pirDetected,
        presence: pirDetected ? 'detected' : 'none',
      },

      indicators: {
        redLed: alarmEnabled,
        greenLed: doorState === 'open',
        buzzer,
      },

      alarm: {
        enabled: alarmEnabled,
      },

      system: {
        status: 'operational',
        message:
          'Connecté à Blynk. L’état affiché provient du matériel ; la fermeture automatique est gérée par le firmware ESP32.',
      },

      updatedAt: new Date().toISOString(),
    };

    this.cache = snapshot;
    this.cacheAt = Date.now();

    return snapshot;
  }

  logDoorTransitions(doorState) {
    const previous = this.lastDoorState;

    if (previous && previous !== doorState) {
      if (doorState === 'open') {
        safeLogEvent(
          EVENT_TYPES.DOOR_OPENED,
          'Ouverture confirmée par l’ESP32 via Blynk.'
        );
      } else if (doorState === 'closed') {
        safeLogEvent(
          EVENT_TYPES.DOOR_CLOSED,
          'Fermeture confirmée par l’ESP32 (fermeture automatique ou bouton physique).'
        );
      }
    }

    this.lastDoorState = doorState;
  }

  handleConnected() {
    if (this.hardwareConnected !== true) {
      if (this.hardwareConnected === false) {
        safeLogEvent(EVENT_TYPES.DEVICE_CONNECTED, 'ESP32 reconnecté à Blynk.');
      } else {
        safeLogEvent(EVENT_TYPES.DEVICE_CONNECTED, 'ESP32 connecté à Blynk.');
      }

      this.hardwareConnected = true;
      this.updateDeviceRow('online', true);
    } else {
      this.updateDeviceRow('online');
    }
  }

  handleDisconnected(reason) {
    const wasConnected = this.hardwareConnected === true;

    if (wasConnected) {
      safeLogEvent(
        EVENT_TYPES.DEVICE_DISCONNECTED,
        `ESP32 déconnecté de Blynk${reason ? ` (${reason})` : ''}`
      );
    }

    if (this.hardwareConnected !== false) {
      this.hardwareConnected = false;
      this.lastDoorState = null;
      this.updateDeviceRow('offline', true);
    }
  }

  offlineSnapshot(message, configurationRequired = false) {
    return {
      mode: 'blynk',
      simulated: false,
      configurationRequired,

      device: {
        id: DEVICE_ID,
        name: DEVICE_NAME,
        connected: false,
        status: configurationRequired ? 'unconfigured' : 'offline',
        lastSeen: this.lastKnown?.lastSeen ?? null,
      },

      door: {
        state: 'unknown',
        isOpen: false,
        openDurationSeconds: config.openDurationSeconds,
        remainingOpenSeconds: 0,
        openedAt: null,
      },

      sensors: {
        distanceCm: this.lastKnown?.distanceCm ?? null,
        pirDetected: false,
        presence: 'unknown',
      },

      indicators: {
        redLed: this.lastKnown?.alarmEnabled ?? false,
        greenLed: false,
        buzzer: false,
      },

      alarm: {
        enabled: this.lastKnown?.alarmEnabled ?? false,
      },

      system: {
        status: 'degraded',
        message,
      },

      updatedAt: new Date().toISOString(),
    };
  }

  updateDeviceRow(status, force = false) {
    if (!force && Date.now() - this.lastDeviceUpdateAt < DEVICE_UPDATE_INTERVAL_MS) {
      return;
    }

    this.lastDeviceUpdateAt = Date.now();

    prisma.device
      .upsert({
        where: { id: DEVICE_ID },
        create: {
          id: DEVICE_ID,
          name: DEVICE_NAME,
          status,
          lastSeen: new Date(),
        },
        update: {
          name: DEVICE_NAME,
          status,
          lastSeen: new Date(),
        },
      })
      .catch((error) =>
        console.error('[blynk] Impossible de mettre à jour le device:', error.message)
      );
  }

  async openDoor() {
    if (!this.configured) {
      throw new HttpError(
        503,
        'IOT_NOT_CONFIGURED',
        'Blynk n’est pas configuré (BLYNK_AUTH_TOKEN manquant). Aucune commande n’a été envoyée.'
      );
    }

    const status = await this.getStatus({ force: true });

    if (!status.device.connected) {
      throw new HttpError(
        409,
        'DEVICE_OFFLINE',
        'L’ESP32 n’est pas connecté à Blynk. Ouverture refusée.'
      );
    }

    await this.request('/update', {
      [config.blynk.pins.doorCommand]: 1,
    });

    this.cache = null;
    this.cacheAt = 0;

    let command = null;

    try {
      command = await prisma.command.create({
        data: { commandType: 'DOOR_OPEN', status: 'SENT' },
      });
    } catch (error) {
      console.error('[blynk] Impossible d’enregistrer la commande:', error.message);
    }

    safeLogEvent(
      EVENT_TYPES.DOOR_COMMAND_SENT,
      'Commande d’ouverture transmise via Blynk (en attente de confirmation du firmware ESP32).'
    );

    return {
      accepted: true,
      simulated: false,
      message:
        'Commande transmise à Blynk. L’ouverture sera confirmée par l’ESP32 (fermeture automatique gérée par le firmware).',
      command,
    };
  }

  async setAlarm(enabled) {
    if (!this.configured) {
      throw new HttpError(
        503,
        'IOT_NOT_CONFIGURED',
        'Blynk n’est pas configuré (BLYNK_AUTH_TOKEN manquant). Aucune commande n’a été envoyée.'
      );
    }

    const status = await this.getStatus({ force: true });

    if (!status.device.connected) {
      throw new HttpError(
        409,
        'DEVICE_OFFLINE',
        'L’ESP32 n’est pas connecté à Blynk. Modification de l’alarme refusée.'
      );
    }

    // V5 = Alarm_Command : commande envoyée à l'ESP32.
    // V3 = Alarm_Status : état renvoyé par l'ESP32.
    await this.request('/update', {
      [config.blynk.pins.alarmCommand]: enabled ? 1 : 0,
    });

    this.cache = null;
    this.cacheAt = 0;

    let command = null;

    try {
      command = await prisma.command.create({
        data: {
          commandType: enabled ? 'ALARM_ON' : 'ALARM_OFF',
          status: 'SENT',
        },
      });
    } catch (error) {
      console.error('[blynk] Impossible d’enregistrer la commande:', error.message);
    }

    safeLogEvent(
      enabled ? EVENT_TYPES.ALARM_ENABLED : EVENT_TYPES.ALARM_DISABLED,
      `${enabled ? 'Activation' : 'Désactivation'} de l’alarme transmise via Blynk.`
    );

    return {
      accepted: true,
      simulated: false,
      changed: true,
      enabled,
      message: `Commande d’${enabled ? 'activation' : 'désactivation'} de l’alarme transmise à Blynk.`,
      command,
    };
  }

  async shutdown() {
    try {
      await prisma.device.update({
        where: { id: DEVICE_ID },
        data: { status: 'offline', lastSeen: new Date() },
      });
    } catch {
      // La base peut déjà être fermée lors de l'arrêt.
    }
  }
}
