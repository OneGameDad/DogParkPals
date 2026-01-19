import express from "express";
import cors from "cors";
import userRouter from "./routes/userRouter";
import authRouter from "./routes/authRouter";
import dogRouter from "./routes/dogRouter";
import parkRouter from "./routes/parkRouter";
import eventRouter from "./routes/eventRouter";
import organizationRouter from "./routes/organizationRouter";
import friendRouter from "./routes/friendRouter";
import messageRouter from "./routes/messageRouter";
import notificationRouter from "./routes/notificationRouter";
import enemyRouter from "./routes/enemyRouter";
import typeSafeLogger from "./utils/typeSafeLogger";
import { requestIdMiddleware } from "./middlewares/requestId";
import { errorHandler } from "./middlewares/errorHandler";
import "./jobs/autoCheckoutJob"

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;

app.use(cors({
  //Hardcoded for development purposes
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(requestIdMiddleware);
app.use(express.json());

app.use("/auth", authRouter);
app.use("/users", userRouter);

app.get("/health", (_req, res) => {
  typeSafeLogger.info("Health check endpoint hit");
  res.json({ status: "ok" });
});

// Generic API routes
app.use("/api/dogs", dogRouter);
app.use("/api/parks", parkRouter);
app.use("/api/events", eventRouter);
app.use("/api/organizations", organizationRouter);
app.use("/api/friends", friendRouter);
app.use("/api/messages", messageRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/enemies", enemyRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  typeSafeLogger.info("Server listening", { port: PORT });
});
