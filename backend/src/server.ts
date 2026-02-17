import "./jobs/autoCheckoutJob";
import { startEventConsumer } from './jobs/eventConsumer';
import { startOutboxPublisher } from './jobs/outboxPublisher';
import typeSafeLogger from "./utils/typeSafeLogger";
import app from "./app";

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.listen(PORT, () => {
  typeSafeLogger.info("Server listening", { port: PORT });
});

startEventConsumer();
startOutboxPublisher();
