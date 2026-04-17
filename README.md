# TaskAgent

Agente de automação que recebe uma tarefa em linguagem natural e executa passo a passo — busca web, leitura de páginas, formatação — transmitindo raciocínio e cada chamada de ferramenta em tempo real via Server-Sent Events (não polling). Loop agêntico com até 10 iterações, cancelamento cooperativo por AbortSignal, proteção SSRF na leitura de URLs e saída em markdown sanitizada contra XSS. Cobertura de testes real: 54 testes em Vitest, sem mocks para as ferramentas core.

## Recursos

- Entrada em linguagem natural: o agente decide quais ferramentas chamar e em que ordem
- Execução em tempo real via SSE — você vê cada passo de raciocínio e cada tool call à medida que acontecem, sem polling
- Loop agêntico limitado a 10 iterações (evita loops infinitos sem sacrificar tarefas complexas)
- Cancelamento cooperativo: `POST /api/tasks/:id/cancel` dispara `AbortSignal` que interrompe Groq e ferramentas em andamento
- Ferramentas integradas: `web_search` (DuckDuckGo), `read_url` (Mozilla Readability + Cheerio) e `format_data`
- Proteção SSRF em `read_url`: resolução DNS bloqueia IPs internos e metadata de cloud
- Saída em markdown renderizada com `rehype-sanitize` (defesa em profundidade contra XSS)
- Rate limit do Groq tratado com retry-after e mensagem amigável para o usuário
- Histórico persistente de tarefas com passos, inputs e outputs em PostgreSQL

## Stack

- **Frontend:** Next.js 16
- **Backend:** Node.js, Express 5, Pino
- **AI:** Groq API
- **Real-time:** Server-Sent Events, AbortSignal
- **Tools:** DuckDuckGo
- **Validation:** Zod
- **Database:** PostgreSQL 17
- **Testing:** Vitest
- **Infra:** Docker

## Como começar

```bash
# 1. Clonar
git clone https://github.com/mateushr23/task-agent.git
cd task-agent

# 2. Configurar
cp .env.example .env
# Edite .env e adicione sua GROQ_API_KEY (obtenha em https://console.groq.com/keys)

# 3. Subir
docker compose up --build
```

Abra [http://localhost:3000](http://localhost:3000)

### Desenvolvimento local (sem Docker)

```bash
# Subir só o PostgreSQL
docker compose up postgres -d

# Rodar a migration
docker exec -i task-agent-postgres-1 psql -U taskagent -d taskagent < backend/src/db/migrations/001_init.sql

# Backend
cd backend
cp ../.env.example .env  # edite DATABASE_URL trocando postgres por localhost
npm install
npm run dev

# Frontend (novo terminal)
cd frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:3001/api npm run dev
```

## Testes

```bash
# Backend (36 testes)
cd backend && npm test

# Frontend (18 testes)
cd frontend && npm test
```

## Ferramentas do agente

| Ferramenta | Descrição |
|------------|-----------|
| `web_search` | Busca no DuckDuckGo, retorna os 5 primeiros resultados |
| `read_url` | Fetch + extração de texto de uma URL (com proteção SSRF) |
| `format_data` | Estrutura dados em tabelas, listas, etc. |

## Endpoints da API

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/tasks` | Cria e executa uma tarefa |
| `GET` | `/api/tasks/:id/stream` | Stream SSE dos eventos de execução |
| `POST` | `/api/tasks/:id/cancel` | Cancela uma tarefa em execução |
| `GET` | `/api/tasks` | Lista o histórico de tarefas |
| `GET` | `/api/tasks/:id` | Detalhe da tarefa com passos |
| `DELETE` | `/api/tasks/:id` | Deleta uma tarefa |
| `GET` | `/api/health` | Health check |

## Eventos SSE

| Evento | Descrição |
|--------|-----------|
| `thinking` | Raciocínio do agente antes da tool call |
| `step:start` | Início da execução de uma ferramenta |
| `step:complete` | Fim bem-sucedido da ferramenta |
| `step:error` | Falha na execução da ferramenta |
| `result` | Resultado final em markdown |
| `rate_limit` | Rate limit atingido com `retry-after` |
| `cancelled` | Tarefa cancelada |
| `done` | Stream encerrado |

## Variáveis de ambiente

| Variável | Obrigatória | Default | Descrição |
|----------|-------------|---------|-----------|
| `GROQ_API_KEY` | Sim | — | Chave da API do Groq |
| `GROQ_MODEL` | Não | `llama-3.3-70b-versatile` | Modelo LLM |
| `DATABASE_URL` | Não | `postgresql://taskagent:taskagent@postgres:5432/taskagent` | Conexão PostgreSQL |
| `PORT` | Não | `3001` | Porta do backend |
| `FRONTEND_URL` | Não | `http://localhost:3000` | Origem CORS |
| `NODE_ENV` | Não | `production` | Ambiente |
| `LOG_LEVEL` | Não | `info` | Nível do Pino |

## Arquitetura

```
User → Next.js UI → Express API → Groq (LLM) → Tools → SSE → UI
                                    ↕
                               PostgreSQL
```

Loop do agente: usuário envia uma tarefa → LLM decide qual ferramenta chamar → backend executa a tool → resultado volta para o LLM → repete até `done` (ou até o limite de 10 iterações) → resultado final é transmitido ao frontend via SSE.

## Segurança

- Proteção SSRF via resolução DNS (bloqueia IPs internos e metadata de cloud)
- Prevenção de XSS com `rehype-sanitize` no markdown
- Queries SQL parametrizadas (sem injection)
- Validação de input com Zod
- Containers Docker sem root
- API keys nunca expostas ao frontend

## English

Automation agent that takes a natural-language task and executes it step by step — web search, page reading, formatting — streaming its reasoning and every tool call in real time via Server-Sent Events (not polling). Agentic loop capped at 10 iterations, cooperative cancellation via AbortSignal, SSRF protection on URL reads, and markdown output sanitized against XSS. Real test coverage: 54 Vitest tests, no mocks for the core tools.

### Features

- Natural-language input: the agent decides which tools to call and in what order
- Real-time execution via SSE — you watch every reasoning step and tool call as they happen, no polling
- Agentic loop capped at 10 iterations (prevents infinite loops without sacrificing complex tasks)
- Cooperative cancellation: `POST /api/tasks/:id/cancel` fires an `AbortSignal` that interrupts Groq and in-flight tools
- Built-in tools: `web_search` (DuckDuckGo), `read_url` (Mozilla Readability + Cheerio), and `format_data`
- SSRF protection on `read_url`: DNS resolution blocks internal IPs and cloud metadata
- Markdown output rendered with `rehype-sanitize` (defense-in-depth against XSS)
- Groq rate-limit handled with retry-after and a user-friendly message
- Persistent task history with steps, inputs, and outputs in PostgreSQL

### Stack

- **Frontend:** Next.js 16
- **Backend:** Node.js, Express 5, Pino
- **AI:** Groq API
- **Real-time:** Server-Sent Events, AbortSignal
- **Tools:** DuckDuckGo
- **Validation:** Zod
- **Database:** PostgreSQL 17
- **Testing:** Vitest
- **Infra:** Docker

### Getting Started

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

#### Local Development (without Docker)

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

### Testing

```bash
# Backend (36 tests)
cd backend && npm test

# Frontend (18 tests)
cd frontend && npm test
```

### Agent Tools

| Tool | Description |
|------|-------------|
| `web_search` | Search DuckDuckGo, returns top 5 results |
| `read_url` | Fetch and extract text from a URL (SSRF-protected) |
| `format_data` | Structure data into tables, lists, etc. |

### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/tasks` | Create and execute a task |
| `GET` | `/api/tasks/:id/stream` | SSE stream of execution events |
| `POST` | `/api/tasks/:id/cancel` | Cancel a running task |
| `GET` | `/api/tasks` | List task history |
| `GET` | `/api/tasks/:id` | Get task detail with steps |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `GET` | `/api/health` | Health check |

### SSE Events

| Event | Description |
|-------|-------------|
| `thinking` | Agent's reasoning before tool calls |
| `step:start` | Tool execution begins |
| `step:complete` | Tool execution finished |
| `step:error` | Tool execution failed |
| `result` | Final markdown result |
| `rate_limit` | Rate limit hit with retry info |
| `cancelled` | Task was cancelled |
| `done` | Stream complete |

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `GROQ_API_KEY` | Yes | — | Groq API key |
| `GROQ_MODEL` | No | `llama-3.3-70b-versatile` | LLM model |
| `DATABASE_URL` | No | `postgresql://taskagent:taskagent@postgres:5432/taskagent` | PostgreSQL connection |
| `PORT` | No | `3001` | Backend port |
| `FRONTEND_URL` | No | `http://localhost:3000` | CORS origin |
| `NODE_ENV` | No | `production` | Environment |
| `LOG_LEVEL` | No | `info` | Pino log level |

### Architecture

```
User → Next.js UI → Express API → Groq (LLM) → Tools → SSE → UI
                                    ↕
                               PostgreSQL
```

The agent loop: user sends a task → LLM decides which tools to call → backend executes tools → results sent back to LLM → repeat until done (or until the 10-iteration cap) → final result streamed to frontend via SSE.

### Security

- SSRF protection via DNS resolution (blocks internal IPs and cloud metadata)
- XSS prevention via `rehype-sanitize` on markdown output
- Parameterized SQL queries (no injection)
- Input validation with Zod
- Non-root Docker containers
- API keys never exposed to frontend
