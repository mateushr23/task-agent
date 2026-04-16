import { pool } from "../client.js";
import type { Task, TaskSummary, TaskDetail, TaskStep } from "../../types/index.js";

export async function createTask(description: string): Promise<Task> {
  const result = await pool.query(
    `INSERT INTO tasks (description) VALUES ($1)
     RETURNING id, description, status, result, error,
       created_at AS "createdAt",
       completed_at AS "completedAt",
       duration_ms AS "durationMs"`,
    [description]
  );
  return result.rows[0] as Task;
}

export async function findAllTasks(
  limit: number,
  offset: number
): Promise<{ tasks: TaskSummary[]; total: number }> {
  const countResult = await pool.query("SELECT COUNT(*)::int AS total FROM tasks");
  const total: number = countResult.rows[0].total;

  const result = await pool.query(
    `SELECT
       t.id,
       t.description,
       t.status,
       t.created_at AS "createdAt",
       t.duration_ms AS "durationMs",
       COALESCE(s.step_count, 0)::int AS "stepCount"
     FROM tasks t
     LEFT JOIN (
       SELECT task_id, COUNT(*)::int AS step_count
       FROM task_steps
       GROUP BY task_id
     ) s ON s.task_id = t.id
     ORDER BY t.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return { tasks: result.rows as TaskSummary[], total };
}

export async function findTaskById(id: string): Promise<TaskDetail | null> {
  const taskResult = await pool.query(
    `SELECT id, description, status, result, error,
       created_at AS "createdAt",
       completed_at AS "completedAt",
       duration_ms AS "durationMs"
     FROM tasks WHERE id = $1`,
    [id]
  );

  if (taskResult.rows.length === 0) return null;

  const task = taskResult.rows[0] as Task;

  const stepsResult = await pool.query(
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
    [id]
  );

  return {
    ...task,
    steps: stepsResult.rows as TaskStep[],
  };
}

export async function updateTaskStatus(
  id: string,
  status: string,
  result?: string,
  error?: string
): Promise<void> {
  const isTerminal = status === "completed" || status === "failed";
  await pool.query(
    `UPDATE tasks
     SET status = $2,
         result = COALESCE($3, result),
         error = COALESCE($4, error),
         completed_at = CASE WHEN $5 THEN NOW() ELSE completed_at END,
         duration_ms = CASE WHEN $5
           THEN EXTRACT(EPOCH FROM (NOW() - created_at))::int * 1000
           ELSE duration_ms END
     WHERE id = $1`,
    [id, status, result ?? null, error ?? null, isTerminal]
  );
}

export async function deleteTask(id: string): Promise<boolean> {
  const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);
  return (result.rowCount ?? 0) > 0;
}
