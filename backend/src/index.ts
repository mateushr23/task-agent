import "dotenv/config";
import express from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { errorHandler } from "./middleware/error-handler.js";
import taskRoutes from "./routes/tasks.js";
import healthRoutes from "./routes/health.js";

const app = express();

// --------------- Middleware ---------------

app.use(
  cors({
    origin: env.FRONTEND_URL,
  })
);

app.use(express.json({ limit: "100kb" }));

app.use(pinoHttp({ logger }));

// --------------- Routes ------------------

app.use("/api/health", healthRoutes);
app.use("/api/tasks", taskRoutes);

// --------------- Global error handler ----

app.use(errorHandler);

// --------------- Start -------------------

const server = app.listen(env.PORT, () => {
  logger.info(`Server running on port ${env.PORT}`);
});

process.on("unhandledRejection", (err) => {
  logger.fatal({ err }, "Unhandled rejection");
  process.exit(1);
});

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down");
  server.close();
  const { pool } = await import("./db/client.js");
  await pool.end();
  process.exit(0);
});
