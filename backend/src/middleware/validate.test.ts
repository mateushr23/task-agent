import { describe, it, expect, vi } from "vitest";
import { z } from "zod";
import { validate } from "./validate.js";
import type { Request, Response, NextFunction } from "express";

// Helper to create mock Express objects
function createMockReq(body: unknown): Request {
  return { body } as Request;
}

function createMockRes(): Response & { _status: number; _json: unknown } {
  const res = {
    _status: 0,
    _json: null as unknown,
    status(code: number) {
      res._status = code;
      return res;
    },
    json(data: unknown) {
      res._json = data;
      return res;
    },
  };
  return res as unknown as Response & { _status: number; _json: unknown };
}

describe("validate middleware", () => {
  const schema = z.object({
    name: z.string().min(1, "Name is required"),
    age: z.number().int().positive("Age must be positive"),
  });

  it("calls next() when body is valid", () => {
    const req = createMockReq({ name: "Alice", age: 30 });
    const res = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res._status).toBe(0); // status was never set
    // Parsed data should be assigned back to req.body
    expect(req.body).toEqual({ name: "Alice", age: 30 });
  });

  it("returns 400 with error details when body is invalid", () => {
    const req = createMockReq({ name: "", age: -5 });
    const res = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(400);
    expect(res._json).toHaveProperty("error", "Validation failed");
    expect(res._json).toHaveProperty("details");
    const details = (res._json as any).details;
    expect(Array.isArray(details)).toBe(true);
    expect(details.length).toBeGreaterThan(0);
    // Each detail should have field and message
    for (const detail of details) {
      expect(detail).toHaveProperty("field");
      expect(detail).toHaveProperty("message");
    }
  });

  it("returns 400 when a required field is missing", () => {
    const req = createMockReq({ age: 25 }); // missing name
    const res = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(400);
    expect(res._json).toHaveProperty("error", "Validation failed");
    const details = (res._json as any).details;
    expect(details.some((d: any) => d.field === "name")).toBe(true);
  });

  it("returns 400 when body has wrong types", () => {
    const req = createMockReq({ name: 123, age: "not a number" });
    const res = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    validate(schema)(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(400);
  });

  it("strips unknown fields via Zod parse", () => {
    const req = createMockReq({ name: "Bob", age: 20, extra: "field" });
    const res = createMockRes();
    const next = vi.fn() as unknown as NextFunction;

    validate(schema)(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    // Zod strip mode removes extra fields
    expect(req.body).toEqual({ name: "Bob", age: 20 });
  });
});
