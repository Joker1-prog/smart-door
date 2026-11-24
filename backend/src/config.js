
import 'dotenv/config';

const nodeEnv = process.env.NODE_ENV || 'development';
const isProduction = nodeEnv === 'production';

function readInt(name, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const raw = process.env[name];

  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }

  const value = Number(raw);

  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(
      `Variable d'environnement invalide : ${name} (attendu entre ${min} et ${max})`
    );
  }

  return value;
}

function readList(name, fallback) {
  const raw = process.env[name];

  if (!raw) return fallback;

  return raw
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function readString(name, fallback = '') {
  const raw = process.env[name];

  return raw === undefined || raw === '' ? fallback : raw.trim();
}

// --- Sécurité : code d'accès ---
const accessCode = readString('ACCESS_CODE');

if (!accessCode && isProduction) {
  throw new Error(
    "ACCESS_CODE est obligatoire en production. Définissez-le dans les variables d'environnement de l'hébergeur."
  );
}

if (!accessCode) {
  console.warn(
    "[config] ACCESS_CODE absent : utilisation du code de démonstration 'smartdoor-demo' (développement uniquement)."
  );
}

// --- Configuration du mode IoT ---
const iotMode = readString('IOT_MODE', 'demo').toLowerCase();

if (!['demo', 'blynk'].includes(iotMode)) {
  console.warn(
    `[config] IOT_MODE inconnu ('${iotMode}'). Repli sur le mode DEMO.`
  );
}

// --- Configuration générale ---
export const config = Object.freeze({
  nodeEnv,
  isProduction,

  port: readInt('PORT', 4000, {
    min: 1,
    max: 65535,
  }),

  corsOrigins: readList('CLIENT_ORIGIN', [
    'http://localhost:5173',
  ]),

  openDurationSeconds: readInt('OPEN_DURATION_SECONDS', 6, {
    min: 1,
    max: 120,
  }),

  sessionTtlMinutes: readInt('SESSION_TTL_MINUTES', 480, {
    min: 1,
    max: 10080,
  }),

  accessCode: accessCode || 'smartdoor-demo',

  iotMode: iotMode === 'blynk' ? 'blynk' : 'demo',

  // --- Configuration Blynk ---
  blynk: Object.freeze({
    authToken: readString('BLYNK_AUTH_TOKEN'),

    baseUrl: readString(
      'BLYNK_BASE_URL',
      'https://blynk.cloud/external/api'
    ).replace(/\/+$/, ''),

    timeoutMs: readInt('BLYNK_TIMEOUT_MS', 5000, {
      min: 1000,
      max: 30000,
    }),

    // Correspondance avec les six Datastreams du modèle Blynk
    pins: Object.freeze({
      distance: readString('BLYNK_PIN_DISTANCE', 'V0'),
      pir: readString('BLYNK_PIN_PIR', 'V1'),
      doorState: readString('BLYNK_PIN_DOOR_STATE', 'V2'),
      alarm: readString('BLYNK_PIN_ALARM', 'V3'),
      doorCommand: readString('BLYNK_PIN_DOOR_COMMAND', 'V4'),
      alarmCommand: readString('BLYNK_PIN_ALARM_COMMAND', 'V5'),
    }),
  }),
});
