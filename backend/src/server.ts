import express from "express";
import userRouter from "./routes/userRouter";
import logger from "./utils/logger";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(express.json());
app.use(userRouter);

app.get("/health", (_req, res) => {
  logger.info("Health check endpoint hit");
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  logger.info("Server listening", { port: PORT });
});
