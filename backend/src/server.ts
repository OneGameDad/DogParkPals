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
import { initializeSocket } from "./infrastructure/socket";
import { initializeNotificationSocket } from "./services/notificationService";
import type { Server } from 'socket.io';

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

// Declare io variable at module level for export
let io: Server;

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

  // Initialize notification service with Socket.io
  initializeNotificationSocket(io);

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
