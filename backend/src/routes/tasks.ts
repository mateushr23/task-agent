import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import {
  createTask,
  findAllTasks,
  findTaskById,
  updateTaskStatus,
  deleteTask,
} from "../db/queries/tasks.js";
import { findStepsByTaskId } from "../db/queries/steps.js";
import { createSSEStream } from "../services/sse.service.js";
import { executeAgentLoop } from "../services/agent.service.js";
import { sanitizeInput } from "../utils/sanitize.js";
import { logger } from "../utils/logger.js";

const router = Router();

// Track whether a task is currently running (single-user MVP: max 1 concurrent)
let runningTaskId: string | null = null;

// --- POST /api/tasks ---
const createTaskSchema = z.object({
  description: z
    .string()
    .min(1, "Description is required")
    .max(2000, "Description must be 2000 characters or less"),
});

router.post("/", validate(createTaskSchema), async (req, res, next) => {
  try {
    // Concurrent task limiter — check AND set before any await to prevent TOCTOU race
    if (runningTaskId !== null) {
      res.status(429).json({
        error: "A task is already running. Please wait for it to complete.",
        runningTaskId,
      });
      return;
    }

    const description = sanitizeInput(req.body.description);

    // Set lock BEFORE the async createTask call to prevent race conditions.
    // We use a placeholder; it will be replaced with the real task ID.
    runningTaskId = "pending";

    let task;
    try {
      task = await createTask(description);
    } catch (err) {
      // Release lock if task creation fails
      runningTaskId = null;
      throw err;
    }

    runningTaskId = task.id;

    // The real SSE stream is created when the client connects to /stream
    // The agent loop runs in background; we store a reference for the SSE endpoint
    agentLoops.set(task.id, { description, started: false });

    res.status(201).json({
      taskId: task.id,
      sseUrl: `/api/tasks/${task.id}/stream`,
    });
  } catch (err) {
    next(err);
  }
});

// In-memory map to track agent loop state per task
const agentLoops = new Map<
  string,
  { description: string; started: boolean }
>();

// --- GET /api/tasks/:taskId/stream ---
router.get("/:taskId/stream", async (req, res, next) => {
  try {
    const { taskId } = req.params;
    const task = await findTaskById(taskId);

    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }

    const sseEmitter = createSSEStream(res);

    // If task is already done, replay past steps and close
    if (task.status === "completed" || task.status === "failed") {
      for (const step of task.steps) {
        if (step.status === "completed") {
          sseEmitter.emit("step:start", {
            index: step.index,
            toolName: step.toolName,
            toolInput: step.toolInput,
          });
          sseEmitter.emit("step:complete", {
            index: step.index,
            result: (step.result || "").substring(0, 200),
            durationMs: step.durationMs,
          });
        } else if (step.status === "failed") {
          sseEmitter.emit("step:start", {
            index: step.index,
            toolName: step.toolName,
            toolInput: step.toolInput,
          });
          sseEmitter.emit("step:error", {
            index: step.index,
            error: step.error,
          });
        }
      }

      if (task.status === "completed" && task.result) {
        sseEmitter.emit("result", { content: task.result });
      } else if (task.status === "failed" && task.error) {
        sseEmitter.emit("error", { message: task.error });
      }

      sseEmitter.emit("done", {});
      sseEmitter.close();
      return;
    }

    // Task is still running — check if we need to start the agent loop
    const loopInfo = agentLoops.get(taskId);
    if (loopInfo && !loopInfo.started) {
      loopInfo.started = true;

      // Run the agent loop (async, don't await)
      executeAgentLoop(taskId, loopInfo.description, sseEmitter)
        .then(() => {
          runningTaskId = null;
          agentLoops.delete(taskId);
          sseEmitter.close();
        })
        .catch((err) => {
          logger.error({ err, taskId }, "Agent loop crashed");
          runningTaskId = null;
          agentLoops.delete(taskId);
          sseEmitter.close();
        });
    }

    // Handle client disconnect
    req.on("close", () => {
      logger.info({ taskId }, "SSE client disconnected");
    });
  } catch (err) {
    next(err);
  }
});

// --- GET /api/tasks ---
router.get("/", async (req, res, next) => {
  try {
    const limit = Math.min(Math.max(parseInt(String(req.query.limit)) || 20, 1), 100);
    const offset = Math.max(parseInt(String(req.query.offset)) || 0, 0);

    const result = await findAllTasks(limit, offset);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

// --- GET /api/tasks/:taskId ---
router.get("/:taskId", async (req, res, next) => {
  try {
    const task = await findTaskById(req.params.taskId);
    if (!task) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// --- DELETE /api/tasks/:taskId ---
router.delete("/:taskId", async (req, res, next) => {
  try {
    const deleted = await deleteTask(req.params.taskId);
    if (!deleted) {
      res.status(404).json({ error: "Task not found" });
      return;
    }
    res.status(204).end();
  } catch (err) {
    next(err);
  }
});

export default router;
