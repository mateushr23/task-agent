import { pool } from "../client.js";
import type { TaskStep } from "../../types/index.js";

export async function createStep(
  taskId: string,
  stepIndex: number,
  toolName: string,
  toolInput: object
): Promise<TaskStep> {
  const result = await pool.query(
    `INSERT INTO task_steps (task_id, step_index, tool_name, tool_input)
     VALUES ($1, $2, $3, $4)
     RETURNING
       step_index AS "index",
       tool_name AS "toolName",
       tool_input AS "toolInput",
       status,
       result,
       error,
       started_at AS "startedAt",
       completed_at AS "completedAt",
       duration_ms AS "durationMs"`,
    [taskId, stepIndex, toolName, JSON.stringify(toolInput)]
  );
  return result.rows[0] as TaskStep;
}

export async function updateStepComplete(
  taskId: string,
  stepIndex: number,
  result: string,
  durationMs: number
): Promise<void> {
  await pool.query(
    `UPDATE task_steps
     SET status = 'completed',
         result = $3,
         completed_at = NOW(),
         duration_ms = $4
     WHERE task_id = $1 AND step_index = $2`,
    [taskId, stepIndex, result, durationMs]
  );
}

export async function updateStepError(
  taskId: string,
  stepIndex: number,
  error: string
): Promise<void> {
  await pool.query(
    `UPDATE task_steps
     SET status = 'failed',
         error = $3,
         completed_at = NOW()
     WHERE task_id = $1 AND step_index = $2`,
    [taskId, stepIndex, error]
  );
}

export async function findStepsByTaskId(taskId: string): Promise<TaskStep[]> {
  const result = await pool.query(
    `SELECT
       step_index AS "index",
       tool_name AS "toolName",
       tool_input AS "toolInput",
       status,
       result,
       error,
       started_at AS "startedAt",
       completed_at AS "completedAt",
       duration_ms AS "durationMs"
     FROM task_steps
     WHERE task_id = $1
     ORDER BY step_index ASC`,
    [taskId]
  );
  return result.rows as TaskStep[];
}
