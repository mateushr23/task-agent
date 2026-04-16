# TaskAgent

AI-powered task automation agent. Describe a task in natural language and an AI agent executes it step by step — searching the web, reading pages, formatting data — with real-time progress.

## Demo

1. Type a task: *"Search the prices of 3 smartphones and compare them in a table"*
2. Watch the agent execute tools in real-time
3. Get a formatted markdown result

## Stack

- **Frontend:** Next.js 16, React 19, Tailwind CSS v4
- **Backend:** Node.js, Express 5, TypeScript
- **AI:** Groq API (llama-3.3-70b-versatile) with function calling
- **Search:** DuckDuckGo (no API key needed)
- **Database:** PostgreSQL 16
- **Real-time:** Server-Sent Events (SSE)
- **Infra:** Docker Compose

## Quick Start

```bash
# 1. Clone
git clone https://github.com/mateushr23/task-agent.git
cd task-agent

# 2. Configure
cp .env.example .env
# Edit .env and add your GROQ_API_KEY (get one at https://console.groq.com/keys)

# 3. Run
docker compose up --build
```

Open [http://localhost:3000](http://localhost:3000)

## Local Development (without Docker)

```bash
# Start PostgreSQL
docker compose up postgres -d

# Run migration
docker exec -i task-agent-postgres-1 psql -U taskagent -d taskagent < backend/src/db/migrations/001_init.sql

# Backend
cd backend
cp ../.env.example .env  # edit DATABASE_URL to use localhost instead of postgres
npm install
npm run dev

# Frontend (new terminal)
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:3001/api npm run dev
```

## Agent Tools

| Tool | Description |
|------|-------------|
| `web_search` | Search DuckDuckGo, returns top 5 results |
| `read_url` | Fetch and extract text from a URL |
| `format_data` | Structure data into tables, lists, etc. |

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | Yes | — | Groq API key |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | LLM model |
| `DATABASE_URL` | No | `postgresql://taskagent:taskagent@postgres:5432/taskagent` | PostgreSQL connection |
| `PORT` | No | `3001` | Backend port |
| `FRONTEND_URL` | No | `http://localhost:3000` | CORS origin |
| `NODE_ENV` | No | `production` | Environment |
| `LOG_LEVEL` | No | `info` | Pino log level |

## Architecture

```
User → Next.js UI → Express API → Groq (LLM) → Tools → SSE → UI
                                    ↕
                               PostgreSQL
```

The agent loop: user sends a task → LLM decides which tools to call → backend executes tools → results sent back to LLM → repeat until done → final result streamed to frontend via SSE.

## License

MIT
