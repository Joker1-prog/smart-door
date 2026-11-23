import { config } from './config.js';
import { createApp } from './app.js';
import { prisma } from './lib/prisma.js';
import { getIotService } from './services/iot/index.js';

const iot = getIotService();

async function main() {
  await iot.init();

  const app = createApp();
  const server = app.listen(config.port, () => {
    console.log(`[api] SMART DOOR backend démarré sur http://localhost:${config.port}`);
    console.log(`[api] Mode IoT : ${config.iotMode.toUpperCase()}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`[api] Le port ${config.port} est déjà utilisé.`);
    } else {
      console.error('[api] Erreur du serveur:', error);
    }
    process.exit(1);
  });

  let closing = false;
  const shutdown = async (signal) => {
    if (closing) return;
    closing = true;
    console.log(`\n[api] Arrêt demandé (${signal})...`);

    server.close(async () => {
      try {
        await iot.shutdown();
        await prisma.$disconnect();
      } catch (error) {
        console.error('[api] Erreur pendant l’arrêt:', error.message);
      } finally {
        process.exit(0);
      }
    });

    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => {
  console.error('[api] Promesse rejetée non gérée:', reason);
});

main().catch(async (error) => {
  console.error('[api] Démarrage impossible:', error);
  await prisma.$disconnect().catch(() => {});
  process.exit(1);
});
