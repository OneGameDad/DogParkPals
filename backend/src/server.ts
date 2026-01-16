import express from "express";
import cors from "cors";
import userRouter from "./routes/userRouter";
import authRouter from "./routes/authRouter";
import typeSafeLogger from "./utils/typeSafeLogger";
import { requestIdMiddleware } from "./middlewares/requestId";
import { errorHandler } from "./middlewares/errorHandler";
import "./jobs/autoCheckoutJob"

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(cors({
  origin: "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(requestIdMiddleware);
app.use(express.json());

app.use(authRouter);
app.use(userRouter);

app.get("/health", (_req, res) => {
  typeSafeLogger.info("Health check endpoint hit");
  res.json({ status: "ok" });
});

app.use(errorHandler);

app.listen(PORT, () => {
  typeSafeLogger.info("Server listening", { port: PORT });
});
