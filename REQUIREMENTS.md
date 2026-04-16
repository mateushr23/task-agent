# TaskAgent - Complete Requirements Document

**Date:** 2026-04-15
**Mode:** Pipeline brainstorming
**Status:** MVP Requirements

---

## Assumptions

1. Single-user MVP - no auth, no multi-tenancy
2. Groq free tier (rate limits: ~30 RPM, 6000 TPM on llama-3.3-70b)
3. SerpAPI free tier: 100 searches/month - must track usage
4. PostgreSQL runs locally (or via Docker)
5. Express backend and Next.js frontend are separate processes (different ports)
6. SSE only (no WebSocket)
7. No user accounts for MVP

---

## 1. Functional Requirements

### FR-1: Task Input
- Natural language task description in a textarea
- Multi-line input support
- "Run" button to submit
- Disabled while task is executing
- Character count (max 2000 chars)

### FR-2: Agent Execution Engine
- Backend receives task, sends to Groq with tool definitions
- Groq returns tool_calls; backend executes each tool
- After tool execution, result sent back to Groq for next decision
- Loop until Groq returns final text response (no more tool_calls)
- Max 10 tool calls per task (circuit breaker)

### FR-3: Real-Time Step Display
- Each step streams to frontend via SSE
- Steps show: tool name, status (running/done/error), duration, brief result preview
- Steps appear incrementally
- Progress indicator (step count)

### FR-4: Final Result Display
- Final formatted response renders in result panel
- Markdown rendering (tables, lists, bold, code blocks)
- Copy-to-clipboard button

### FR-5: Task History
- All completed tasks saved to PostgreSQL
- History sidebar shows past tasks: title (80 chars), date, step count, status
- Click to view full execution log and result
- Delete individual entries

### FR-6: Error Handling
- Tool failure shown in step panel, agent continues
- Groq API failure: user-friendly error + retry button
- SerpAPI quota exhausted: warning + disable web search tool
- Timeout: 60s per tool call, 5 minutes per total task

### FR-7: Available Tools
- **web_search**: SerpAPI, top 5 organic results (title, link, snippet)
- **read_url**: Fetch + extract text (cheerio/readability), max 5000 chars
- **format_data**: Structure raw data into markdown tables/lists (LLM-driven)

---

## 2. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | SSE events within 200ms of tool completion. First SSE byte within 1s. |
| Scalability | MVP: 1 concurrent task. Architecture allows queue-based scaling later. |
| Security | API keys in `.env`, never exposed to frontend. Input sanitized. URL restricted to HTTP/HTTPS. |
| UX | Soft style: rounded corners, pastel palette, warm typography. Mobile-responsive. Accessible. |
| Reliability | SSE auto-reconnect. Partial results preserved on error. |
| Observability | Structured logging (pino). Log every tool call with duration and status. |

---

## 3. API Design

### Base URL: `http://localhost:3001/api`

### POST `/tasks`
```typescript
interface CreateTaskRequest { description: string; }
interface CreateTaskResponse { taskId: string; sseUrl: string; }
```

### GET `/tasks/:taskId/stream` - SSE endpoint

### GET `/tasks` - List history (?limit=20&offset=0)
```typescript
interface TaskListResponse { tasks: TaskSummary[]; total: number; }
interface TaskSummary {
  id: string; description: string;
  status: "running" | "completed" | "failed";
  stepCount: number; createdAt: string; durationMs: number | null;
}
```

### GET `/tasks/:taskId` - Full task detail
```typescript
interface TaskDetail {
  id: string; description: string;
  status: "running" | "completed" | "failed";
  steps: TaskStep[]; result: string | null; error: string | null;
  createdAt: string; completedAt: string | null; durationMs: number | null;
}
interface TaskStep {
  index: number; toolName: string; toolInput: Record<string, unknown>;
  status: "running" | "completed" | "failed";
  result: string | null; error: string | null;
  startedAt: string; completedAt: string | null; durationMs: number | null;
}
```

### DELETE `/tasks/:taskId` - 204 No Content
### GET `/health` - `{ "status": "ok", "groq": true, "db": true }`

---

## 4. Database Schema

```sql
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE TYPE task_status AS ENUM ('running', 'completed', 'failed');
CREATE TYPE step_status AS ENUM ('running', 'completed', 'failed');

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  description TEXT NOT NULL CHECK (char_length(description) <= 2000),
  status task_status NOT NULL DEFAULT 'running',
  result TEXT, error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ, duration_ms INTEGER
);

CREATE TABLE task_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  step_index INTEGER NOT NULL,
  tool_name VARCHAR(64) NOT NULL,
  tool_input JSONB NOT NULL DEFAULT '{}',
  status step_status NOT NULL DEFAULT 'running',
  result TEXT, error TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ, duration_ms INTEGER,
  UNIQUE (task_id, step_index)
);

CREATE INDEX idx_task_steps_task_id ON task_steps(task_id);
CREATE INDEX idx_tasks_created_at ON tasks(created_at DESC);
```

---

## 5. Frontend Components

```
App
├── Layout
│   ├── Header
│   └── Main
│       ├── HistorySidebar
│       │   └── TaskHistoryItem
│       └── TaskWorkspace
│           ├── TaskInput
│           ├── StepPanel → StepCard
│           ├── ResultPanel
│           └── ErrorBanner
├── SSEProvider
└── Providers
```

### Soft Theme
- Primary: #d94f68 (warm rose), Surface: #fefcfb (warm white), Text: #3d2c2e
- Border radius: 0.75rem default, up to 1.5rem
- Fonts: Inter (sans), JetBrains Mono (mono)

---

## 6. Backend Structure

```
taskagent-backend/src/
├── index.ts
├── config/env.ts
├── routes/ (tasks.ts, health.ts)
├── services/ (agent.service.ts, groq.service.ts, sse.service.ts)
├── tools/ (index.ts, web-search.ts, read-url.ts, format-data.ts)
├── db/ (client.ts, migrations/, queries/)
├── middleware/ (error-handler.ts, validate.ts, cors.ts)
├── types/index.ts
└── utils/ (logger.ts, sanitize.ts)
```

---

## 7. Agent Loop
- Model: llama-3.3-70b-versatile (configurable via GROQ_MODEL)
- Loop: messages -> tool_calls -> execute -> repeat until stop
- Circuit breaker: max 10 iterations
- Tool errors passed back to LLM, don't crash loop

---

## 8. SSE Events
| Event | Data |
|-------|------|
| step:start | { index, toolName, toolInput } |
| step:complete | { index, result, durationMs } |
| step:error | { index, error } |
| result | { content } |
| error | { message } |
| done | {} |
| heartbeat | {} (every 15s) |

---

## 9. Implementation Stages
1. **Scaffold** - create-next-app, Express init, Tailwind theme, DB, Docker Compose, git
2. **Backend Core** - DB layer, Groq service, tools, agent loop, SSE, routes
3. **Frontend Shell** - Layout, TaskInput, SSEProvider, StepPanel, ResultPanel
4. **History + Polish** - HistorySidebar, animations, mobile, copy button
5. **QA + Hardening** - Validation, error handling, quota tracking, smoke tests

Stages 2 and 3 can run in parallel.

---

## 10. Risks
| Risk | Mitigation |
|------|------------|
| Groq rate limits (30 RPM) | Backoff + retry, show status in UI |
| SerpAPI free tier (100/mo) | Track usage, mock in dev |
| Tool-use reliability | Validate JSON, retry on malformed |
| URL extraction (static only) | 10s timeout, 5000 char limit |
| No auth | Local-only, add auth before deploy |

---

## Environment Variables

### Backend (.env)
```
PORT=3001
GROQ_API_KEY=gsk_...
GROQ_MODEL=llama-3.3-70b-versatile
DATABASE_URL=postgresql://taskagent:taskagent@localhost:5432/taskagent
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
LOG_LEVEL=info
```

### Frontend (.env.local)
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```
