# VANTA — Operational Intelligence

**AI-assisted incident triage, operational intelligence, and realtime incident management.**

VANTA connects incident intake, classification, prioritization, duplicate detection, assignment, background AI processing, analytics, and realtime operational updates in one full-stack system.

It is intentionally documented as a **local development/prototype platform**, not as a production-ready incident-management service.

## System Flow

```text
Operator
   │
   ▼
Next.js UI
   │
   ▼
Fastify API ───────────────► SSE / Realtime
   │
   ├──────────────► PostgreSQL
   │
   └──────────────► Redis + BullMQ
                         │
                         ▼
                   Background Worker
                    │    │    │
                    │    │    └── Duplicate Detection
                    │    └────── Priority Detection
                    └─────────── AI Summary / Classification

LYROMI
   │
   ▼
Qwen 2.5 3B Instruct / Ollama
```

The architecture keeps AI work off the synchronous request path while SSE keeps operators informed about changes as processing completes.

## Core Features

### Incident operations

- Incident creation and persistence
- Severity and status tracking
- Service and category metadata
- Assignment and reassignment
- Priority information

### AI-assisted triage

- Automatic classification
- Classification confidence/reasoning
- Priority detection
- AI-generated summaries
- Duplicate incident detection
- Background processing through BullMQ

### LYROMI

LYROMI is the AI assistant inside VANTA. It reads current incident context from PostgreSQL, answers operational questions from available data, and streams responses through the API.

The assistant is designed not to invent incident facts. It is an intelligence layer over application-owned operational data, not the source of truth for incident state.

### Realtime operations

- Server-Sent Events
- Live connection state
- Incident-created events
- Assignment events
- Heartbeat handling for long-lived connections

### Analytics

The dashboard exposes incident volume, open incidents, priority/severity distribution, category/service distribution, assignment state, and AI processing state.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript |
| API | Fastify 5, TypeScript |
| Database | PostgreSQL 16 |
| Queue | BullMQ 6 |
| Broker | Redis 7 |
| Realtime | Server-Sent Events |
| AI runtime | Ollama |
| Model | Qwen 2.5 3B Instruct |
| Infrastructure | Docker / Docker Compose |
| CI | GitHub Actions |
| Workspace | pnpm |
| Runtime | Node.js 22 |

## Architecture Decisions

### AI is asynchronous

Incident creation does not need to wait for every AI operation. The API persists the incident and queues work so classification, priority detection, duplicate detection, and summaries can happen independently.

### Realtime is separate from persistence

PostgreSQL remains the source of persisted incident state. SSE is the delivery mechanism used to inform connected clients about changes.

### Local AI runtime

Ollama keeps the development model local. The application can therefore exercise the AI workflow without treating a hosted model provider as a mandatory dependency.

## Security Boundary

The current authentication implementation uses browser storage and is explicitly a prototype. It is **not suitable for production authentication**.

Before deployment, the project needs server-side authentication, secure password hashing, protected sessions/cookies, authorization on protected operations, rate limiting, secret management, restricted CORS, TLS, and stronger infrastructure isolation.

## Repository Structure

```text
incident-intelligence-platform/
├── apps/
│   ├── api/
│   │   ├── src/ai/
│   │   ├── src/db/
│   │   ├── src/queue/
│   │   ├── src/realtime/
│   │   └── src/redis/
│   └── web/
├── .github/workflows/ci.yml
├── Dockerfile
├── docker-compose.yml
└── package.json
```

## Local Development

### Prerequisites

- Node.js 22+
- pnpm 11+
- Docker Desktop
- Ollama
- Qwen 2.5 3B Instruct model

```bash
ollama pull qwen2.5:3b-instruct
git clone https://github.com/Scarlet-Twinz/incident-intelligence-platform.git
cd incident-intelligence-platform
pnpm install
```

Start PostgreSQL and Redis using the repository's documented configuration, start Ollama, then run:

```bash
pnpm --filter api dev
pnpm --filter api worker
pnpm --filter web dev
```

## Validation

The repository includes production-style Docker build configuration and GitHub Actions validation for dependency installation, API build, web lint/build, Docker Compose configuration, and image builds.

## Current Status

**Functional full-stack operational intelligence prototype.**

Implemented: incident operations, PostgreSQL persistence, Redis/BullMQ processing, AI classification/priority/duplicate detection, summaries, assignment, SSE updates, analytics, LYROMI, Docker build targets, and CI configuration.

**Deployment status: not currently deployed.**


## License

MIT License.

See [LICENSE](LICENSE) for the full license text.