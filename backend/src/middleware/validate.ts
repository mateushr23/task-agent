import type { Request, Response, NextFunction } from "express";
import { z } from "zod";

/**
 * Express middleware factory for Zod body validation.
 * Returns 400 with structured error details on validation failure.
 */
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      res.status(400).json({ error: "Validation failed", details: errors });
      return;
    }

    req.body = result.data;
    next();
  };
}
