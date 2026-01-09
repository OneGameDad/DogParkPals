import express from "express";
import userRouter from "./routes/userRouter";
import typeSafeLogger from "./utils/typeSafeLogger";
import { requestIdMiddleware } from "./middlewares/requestId";
import { errorHandler } from "./middlewares/errorHandler";
import "./jobs/autoCheckoutJob"

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(requestIdMiddleware);
app.use(express.json());
app.use(userRouter);

app.get("/health", (_req, res) => {
  typeSafeLogger.info("Health check endpoint hit");
  res.json({ status: "ok" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  typeSafeLogger.info("Server listening", { port: PORT });
});
