import { prisma } from '../lib/prisma.js';

export const EVENT_TYPES = Object.freeze({
  PRESENCE_DETECTED: 'PRESENCE_DETECTED',
  DOOR_OPENED: 'DOOR_OPENED',
  DOOR_AUTO_CLOSED: 'DOOR_AUTO_CLOSED',
  DOOR_CLOSED: 'DOOR_CLOSED',
  DOOR_COMMAND_SENT: 'DOOR_COMMAND_SENT',
  ALARM_ENABLED: 'ALARM_ENABLED',
  ALARM_DISABLED: 'ALARM_DISABLED',
  DEVICE_CONNECTED: 'DEVICE_CONNECTED',
  DEVICE_DISCONNECTED: 'DEVICE_DISCONNECTED',
});

export async function logEvent(eventType, description) {
  return prisma.doorEvent.create({
    data: { eventType, description },
  });
}

/**
 * Fire-and-forget pour les événements déclenchés par la simulation ou un
 * changement d'état : une erreur de journalisation ne doit pas interrompre
 * la supervision.
 */
export function safeLogEvent(eventType, description) {
  logEvent(eventType, description).catch((error) => {
    console.error(`[events] Impossible d'enregistrer l'événement ${eventType}:`, error.message);
  });
}
