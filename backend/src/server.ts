import "./jobs/autoCheckoutJob";
import { startEventConsumer } from './jobs/eventConsumer';
import { startOutboxPublisher } from './jobs/outboxPublisher';
import typeSafeLogger from "./utils/typeSafeLogger";
import app from "./app";
import { createServer } from "http";
import { initializeSocket } from "./infrastructure/socket";
import { initializeNotificationSocket } from "./services/notificationService";
import { initializeMessageSocket } from "./services/messageService";
import https from 'https';
import fs from 'fs';
import path from 'path';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

// Set up HTTPS with certificate and key
const certPath = process.env.CERT_PATH || path.join(process.cwd(), '../certs/server.crt');
const keyPath = process.env.KEY_PATH || path.join(process.cwd(), '../certs/server.key');
// Create HTTP server and attach Socket.io
const httpServer = createServer(app);
const io = initializeSocket(httpServer);

// Initialize notification service with Socket.io
initializeNotificationSocket(io);

// Initialize message service with Socket.io
initializeMessageSocket(io);

// Make io available globally for notification service
export { io };

httpServer.listen(PORT, () => {
  typeSafeLogger.info("Server listening", { port: PORT });
});

try {
  const cert = fs.readFileSync(certPath, 'utf8');
  const key = fs.readFileSync(keyPath, 'utf8');

  const httpsOptions = {
    cert,
    key,
  };

  https.createServer(httpsOptions, app).listen(PORT, () => {
    typeSafeLogger.info("HTTPS Server listening", { port: PORT });
  });
} catch (error) {
  typeSafeLogger.error('Failed to start HTTPS server', error instanceof Error ? error : new Error(String(error)));
  process.exit(1);
}

startEventConsumer();
startOutboxPublisher();
