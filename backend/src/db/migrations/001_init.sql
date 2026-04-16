CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE task_status AS ENUM ('running', 'completed', 'failed');
CREATE TYPE step_status AS ENUM ('running', 'completed', 'failed');

CREATE TABLE tasks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description   TEXT NOT NULL CHECK (char_length(description) <= 2000),
  status        task_status NOT NULL DEFAULT 'running',
  result        TEXT,
  error         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  duration_ms   INTEGER
);

CREATE TABLE task_steps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id       UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  step_index    INTEGER NOT NULL,
  tool_name     VARCHAR(64) NOT NULL,
  tool_input    JSONB NOT NULL DEFAULT '{}',
  status        step_status NOT NULL DEFAULT 'running',
  result        TEXT,
  error         TEXT,
  started_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at  TIMESTAMPTZ,
  duration_ms   INTEGER,
  UNIQUE (task_id, step_index)
);

CREATE INDEX idx_task_steps_task_id ON task_steps(task_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
