import "dotenv/config";
import express from "express";
import cors from "cors";
import pino from "pino";
import pinoHttp from "pino-http";

const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? { target: "pino/file", options: { destination: 1 } }
      : undefined,
});

const app = express();

// --------------- Middleware ---------------

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
  })
);

app.use(express.json({ limit: "10mb" }));

app.use(pinoHttp({ logger }));

// --------------- Routes ------------------

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// --------------- Global error handler ----

app.use(
  (
    err: Error,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction
  ) => {
    logger.error(err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
);

// --------------- Start -------------------

const PORT = parseInt(process.env.PORT || "3001", 10);

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});
