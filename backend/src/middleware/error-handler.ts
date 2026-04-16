import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";
import { env } from "../config/env.js";

/**
 * Global Express error handler.
 * Logs the error and returns a safe 500 response (no stack trace in production).
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  logger.error({ err }, "Unhandled error");

  if (env.NODE_ENV === "production") {
    res.status(500).json({ error: "Internal server error" });
  } else {
    res.status(500).json({
      error: err.message || "Internal server error",
      stack: err.stack,
    });
  }
}
