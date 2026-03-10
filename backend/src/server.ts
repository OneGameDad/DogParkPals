import "./jobs/autoCheckoutJob";
import { startEventConsumer } from './jobs/eventConsumer';
import { startOutboxPublisher } from './jobs/outboxPublisher';
import typeSafeLogger from "./utils/typeSafeLogger";
import app from "./app";
import { initializeSocket } from "./infrastructure/socket";
import { initializeNotificationSocket } from "./services/notificationService";
import { initializeMessageSocket } from "./services/messageService";
import https from 'https';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

const resolveFirstExistingPath = (explicitPath: string | undefined, candidates: string[]): string => {
  if (explicitPath) {
    return explicitPath;
  }

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return candidates[0];
};

// Resolve cert/key from env first, then common Docker/local fallback locations.
const certPath = resolveFirstExistingPath(process.env.CERT_PATH, [
  '/app/certs/server.crt',
  path.join(process.cwd(), '../certs/server.crt'),
  path.join(process.cwd(), 'certs/server.crt'),
]);
const keyPath = resolveFirstExistingPath(process.env.KEY_PATH, [
  '/app/certs/server.key',
  path.join(process.cwd(), '../certs/server.key'),
  path.join(process.cwd(), 'certs/server.key'),
]);

// Declare io variable at module level for export
let io!: ReturnType<typeof initializeSocket>;

try {
  // Validate certificate files exist
  if (!fs.existsSync(certPath)) {
    throw new Error(`Certificate file not found at ${certPath}`);
  }
  if (!fs.existsSync(keyPath)) {
    throw new Error(`Key file not found at ${keyPath}`);
  }

  const cert = fs.readFileSync(certPath, 'utf8');
  const key = fs.readFileSync(keyPath, 'utf8');

  const httpsOptions = {
    cert,
    key,
  };

  // Create HTTPS server and attach Socket.io
  const httpsServer = https.createServer(httpsOptions, app);
  io = initializeSocket(httpsServer);

  // Initialize notification and messaging channels after Socket.io is ready.
  initializeNotificationSocket(io);
  initializeMessageSocket(io);

  httpsServer.listen(PORT, () => {
    typeSafeLogger.info("HTTPS Server listening", { 
      port: PORT,
      certPath,
      keyPath
    });
  });
} catch (error) {
  const errorMsg = error instanceof Error ? error.message : String(error);
  typeSafeLogger.error('Failed to start HTTPS server', error instanceof Error ? error : new Error(errorMsg));
  process.exit(1);
}

// Make io available globally for notification service
export { io };

startEventConsumer();
startOutboxPublisher();
