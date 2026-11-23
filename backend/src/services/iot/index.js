import { config } from '../../config.js';
import { DemoService } from './demoService.js';
import { BlynkService } from './blynkService.js';

let service = null;

/**
 * Point d'entrée unique vers le service IoT.
 * Les routes ne connaissent que cette interface : remplacer le mode DEMO par
 * Blynk se fait via la variable IOT_MODE, sans modifier les routes.
 */
export function getIotService() {
  if (!service) {
    service = config.iotMode === 'blynk' ? new BlynkService() : new DemoService();
  }
  return service;
}
