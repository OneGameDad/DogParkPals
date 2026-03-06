import "./jobs/autoCheckoutJob";
import { startEventConsumer } from './jobs/eventConsumer';
import { startOutboxPublisher } from './jobs/outboxPublisher';
import typeSafeLogger from "./utils/typeSafeLogger";
import app from "./app";
import { createServer } from "http";
import { initializeSocket } from "./infrastructure/socket";
import { initializeNotificationSocket } from "./services/notificationService";
import { initializeMessageSocket } from "./services/messageService";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

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

startEventConsumer();
startOutboxPublisher();
