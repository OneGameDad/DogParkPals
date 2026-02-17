/// <reference path="./types/express.d.ts" />
/**
 * Express Application Configuration
 * 
 * This file exports the configured Express app WITHOUT calling app.listen().
 * This separation from server.ts enables integration testing with supertest.
 * 
 * Architecture:
 * - app.ts: Configures and exports the Express app (middleware, routes, error handlers)
 * - server.ts: Imports the app and starts the HTTP server with app.listen()
 * - tests: Import app directly and let supertest create ephemeral test servers
 * 
 * Why this matters:
 * - Integration tests need the app without starting a real server
 * - Prevents port conflicts when running tests
 * - Allows clean database resets between test runs
 * - Supertest creates isolated server instances for each test suite
 */

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import passport from "./services/googleAuthService";
import userRouter from "./routes/userRouter";
import authRouter from "./routes/authRouter";
import dogRouter from "./routes/dogRouter";
import parkRouter from "./routes/parkRouter";
import eventRouter from "./routes/eventRouter";
import fileRouter from "./routes/fileRouter";
import organizationRouter from "./routes/organizationRouter";
import friendRouter from "./routes/friendRouter";
import messageRouter from "./routes/messageRouter";
import notificationRouter from "./routes/notificationRouter";
import enemyRouter from "./routes/enemyRouter";
import achievementRouter from "./routes/achievementRouter";
import searchRouter from "./routes/searchRouter";
import typeSafeLogger from "./utils/typeSafeLogger";
import { requestIdMiddleware } from "./middlewares/requestId";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

app.use(cors({
  // Hardcoded for development purposes
  origin: process.env.FRONTEND_URL || "http://localhost:5173",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

app.use(requestIdMiddleware);
app.use(cookieParser());
app.use(express.json());

// Initialize Passport
app.use(passport.initialize());

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
app.use("/api/achievements", achievementRouter);
app.use("/api/files", fileRouter);
app.use("/api/search", searchRouter);

app.use(errorHandler);

export default app;
