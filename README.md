# VANTA — Operational Intelligence

**AI-powered incident triage, operational intelligence, and real-time incident management platform.**

**Repository:** https://github.com/Scarlet-Twinz/incident-intelligence-platform

VANTA is a full-stack operational intelligence platform designed to help engineering teams capture incidents, classify them, prioritize response, detect potential duplicates, assign ownership, process AI analysis asynchronously, and monitor operational activity in real time.

The platform combines a Fastify API, PostgreSQL, Redis, BullMQ, Next.js, server-sent events, and a local Ollama-powered AI assistant called **LYROMI**.

---

## Product Preview

A conceptual view of the VANTA experience: an operations dashboard centered on incident volume, severity, priority, service health, AI processing, realtime activity, and incident-level investigation. The interface is designed to make the flow from **incident intake → AI analysis → prioritization → assignment → resolution** easy to understand at a glance.

---

## Overview

VANTA is built around an event-driven incident-processing workflow:

```text
User / Operator
      │
      ▼
 Next.js UI
      │
      ▼
  Fastify API
   │    │    │
   │    │    └──────────────► SSE / Realtime Updates
   │    │
   │    └───────────────────► Redis + BullMQ
   │                              │
   │                              ▼
   │                        Background Worker
   │                         │    │    │
   │                         │    │    └── Duplicate Detection
   │                         │    └────── Priority Detection
   │                         └─────────── AI Summary / Analysis
   │
   └────────────────────────► PostgreSQL

 LYROMI AI Assistant
        │
        ▼
 Qwen 2.5 3B Instruct
        │
        ▼
      Ollama
```

The architecture separates request handling from background AI processing while keeping operators informed through real-time updates.

---

## Features

### Incident management

- Create and view operational incidents
- Persistent PostgreSQL storage
- Incident severity and status tracking
- Service and category information
- Incident assignment and reassignment
- Incident priority information

### AI-assisted incident triage

- Automatic incident classification
- Classification confidence and reasoning
- Priority detection
- AI-generated incident summaries
- Duplicate incident detection
- Background processing through BullMQ

### LYROMI — AI Operational Assistant

LYROMI is the AI assistant inside VANTA.

- Uses Qwen 2.5 3B Instruct through Ollama
- Reads current incident context from PostgreSQL
- Answers operational questions using available incident data
- Streams responses to the browser
- Avoids inventing incidents or operational facts
- Focuses on concise, operationally useful responses

### Real-time operations

- Server-Sent Events for live incident updates
- Live connection status
- Incident-created events
- Incident-assignment events
- Heartbeat handling for long-lived realtime connections

### Analytics

The dashboard exposes operational metrics including:

- Total incidents
- Open incidents
- Priority distribution
- Severity distribution
- Category distribution
- Service distribution
- Assigned versus unassigned incidents
- AI-processed versus pending incidents

### Authentication interface

The application includes signup, login, session handling, and logout flows for the current prototype.

> **Security note:** the current authentication implementation is a local prototype using browser storage. It is not a production authentication system and should be replaced with server-side authentication, secure password hashing, and protected sessions before production use.

---

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 19, TypeScript |
| API | Fastify 5, TypeScript |
| Database | PostgreSQL 16 |
| Queue | BullMQ 6 |
| Message Broker | Redis 7 |
| Realtime | Server-Sent Events (SSE) |
| AI Runtime | Ollama |
| AI Model | Qwen 2.5 3B Instruct |
| Package Manager | pnpm 11 |
| Runtime | Node.js 22 |
| Containers | Docker, Docker Compose |
| CI | GitHub Actions |

---

## Project Structure

```text
incident-intelligence-platform/
├── apps/
│   ├── api/
│   │   ├── src/
│   │   │   ├── ai/              # Classification, priority, duplicate detection, summaries, Ollama
│   │   │   ├── db/              # PostgreSQL connection
│   │   │   ├── queue/            # BullMQ queues
│   │   │   ├── realtime/         # SSE event broadcasting
│   │   │   ├── redis/            # Redis connection
│   │   │   ├── index.ts          # Fastify API
│   │   │   └── worker.ts         # Background worker
│   │   └── package.json
│   │
│   └── web/
│       ├── src/app/              # Next.js routes and pages
│       ├── src/components/       # Shared application shell
│       ├── src/lib/              # Client utilities and authentication
│       └── package.json
│
├── .github/workflows/ci.yml      # CI pipeline
├── .env.example                  # Environment variable template
├── .dockerignore
├── Dockerfile                    # API, worker, and web build targets
├── docker-compose.yml            # Local production-style containers
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
└── README.md
```

---

## Prerequisites

Install the following before running VANTA locally:

- Node.js 22+
- pnpm 11+
- Docker Desktop
- Ollama
- Qwen 2.5 3B Instruct model

Pull the AI model with Ollama if it is not already installed:

```bash
ollama pull qwen2.5:3b-instruct
```

---

## Local Development

### 1. Clone the repository

```bash
git clone https://github.com/Scarlet-Twinz/incident-intelligence-platform.git
cd incident-intelligence-platform
```

### 2. Install dependencies

```bash
pnpm install
```

### 3. Configure environment variables

Copy the example configuration:

```bash
copy .env.example .env
```

On macOS/Linux:

```bash
cp .env.example .env
```

The default local configuration expects:

```text
PostgreSQL → localhost:5435
Redis      → localhost:6381
API        → localhost:4000
Ollama     → localhost:11434
```

### 4. Start PostgreSQL and Redis

The project uses the following Docker containers for local infrastructure:

```bash
docker run --name vanta-postgres \
  -e POSTGRES_USER=vanta \
  -e POSTGRES_PASSWORD=vanta_dev_password \
  -e POSTGRES_DB=vanta \
  -p 5435:5432 \
  -d postgres:16
```

```bash
docker run --name vanta-redis \
  -p 6381:6379 \
  -d redis:7-alpine
```

If these containers already exist, simply start them:

```bash
docker start vanta-postgres vanta-redis
```

### 5. Start Ollama

Make sure Ollama is running and the model is available:

```bash
ollama list
```

The default model is:

```text
qwen2.5:3b-instruct
```

### 6. Start the API

```bash
pnpm --filter api dev
```

API:

```text
http://localhost:4000
```

### 7. Start the worker

In another terminal:

```bash
pnpm --filter api worker
```

### 8. Start the web application

In another terminal:

```bash
pnpm --filter web dev
```

Web application:

```text
http://localhost:3000
```

---

## Environment Variables

The main variables are documented in `.env.example`.

| Variable | Purpose | Local default |
| --- | --- | --- |
| `PORT` | API port | `4000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5435` |
| `DB_USER` | PostgreSQL user | `vanta` |
| `DB_PASSWORD` | PostgreSQL password | `vanta_dev_password` |
| `DB_NAME` | PostgreSQL database | `vanta` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6381` |
| `OLLAMA_URL` | Ollama chat endpoint | `http://127.0.0.1:11434/api/chat` |
| `OLLAMA_MODEL` | LYROMI model | `qwen2.5:3b-instruct` |
| `NEXT_PUBLIC_API_URL` | Browser-facing API URL | `http://localhost:4000` |

Never commit real credentials or production secrets.

---

## API

### Health

```http
GET /health
```

### Database health

```http
GET /health/database
```

### Redis health

```http
GET /health/redis
```

### Realtime health

```http
GET /health/realtime
```

### List incidents

```http
GET /incidents
```

### Create an incident

```http
POST /incidents
Content-Type: application/json
```

Example:

```json
{
  "title": "Payment API latency spike",
  "description": "Payment requests are taking longer than expected.",
  "service": "payments",
  "severity": "HIGH"
}
```

Creating an incident stores it in PostgreSQL, classifies it, queues background processing, and broadcasts an incident-created realtime event.

### Assign an incident

```http
PATCH /incidents/:id/assignment
Content-Type: application/json
```

Example:

```json
{
  "assignee": "engineering-team"
}
```

### Incident classification

```http
POST /ai/classify
Content-Type: application/json
```

### LYROMI streaming chat

```http
POST /ai/chat
Content-Type: application/json
```

Example:

```json
{
  "message": "Which incidents currently need the most attention?"
}
```

---

## Build

Build the API:

```bash
pnpm --filter api build
```

Build the web application:

```bash
pnpm --filter web build
```

Build everything:

```bash
pnpm build
```

---

## Testing and Validation

The project has been validated with the following checks during development:

```bash
pnpm --filter api build
pnpm --filter web build
docker compose config
docker compose build
```

The web lint configuration reports selected React/Next.js rules as warnings where the current application architecture intentionally performs client-side state initialization or incremental streaming updates. Lint feedback remains visible without blocking the production build.

---

## Docker

The repository includes a multi-stage Dockerfile with separate runtime targets for:

- API
- Background worker
- Next.js web application

Build the images:

```bash
docker compose build
```

Start the complete containerized application:

```bash
docker compose up -d
```

Check service status:

```bash
docker compose ps
```

Local container endpoints:

```text
Web      → http://localhost:3001
API      → http://localhost:4000
Worker   → background service
```

The Docker setup uses the host machine's Ollama service rather than downloading a separate Ollama container image. This keeps the AI runtime local and avoids duplicating the Qwen model inside Docker.

---

## CI

GitHub Actions is configured in:

```text
.github/workflows/ci.yml
```

The pipeline validates:

- Dependency installation with the locked pnpm version
- API TypeScript build
- Web linting
- Web production build
- Docker Compose configuration
- Docker image builds

---

## Production Configuration

The project includes production-oriented configuration through:

- Next.js standalone output
- Multi-stage Docker builds
- Separate API and worker runtime targets
- Docker Compose services
- Environment-based configuration
- GitHub Actions CI
- Restart policies for container services

For a real production deployment, PostgreSQL, Redis, Ollama, API, worker, and web services must be hosted on infrastructure that can communicate with one another.

The current repository does **not** claim a public production deployment.

**Deployment status: Not currently deployed.**

---

## Security Notes

This repository is a portfolio and engineering demonstration project.

Before production use, the following should be strengthened:

- Replace the prototype browser-storage authentication with server-side authentication.
- Hash passwords using a dedicated password-hashing algorithm on the backend.
- Use secure, HTTP-only session cookies or another server-side session mechanism.
- Move all production credentials into a secret manager or deployment platform secrets.
- Restrict CORS origins instead of allowing arbitrary origins.
- Add request rate limiting and authentication/authorization to protected API routes.
- Use TLS for externally exposed services.
- Secure PostgreSQL and Redis behind private networking where possible.
- Run Ollama behind an appropriate protected network boundary.

---

## Current Status

**Status: Functional full-stack portfolio project**

Implemented:

- Full Next.js dashboard
- Incident creation and persistence
- PostgreSQL integration
- Redis integration
- BullMQ background processing
- Automatic incident classification
- Priority detection
- Duplicate detection
- AI-generated summaries
- Incident assignment
- Realtime SSE updates
- Operational analytics
- LYROMI AI assistant
- Streaming AI responses
- Signup/login/logout prototype flow
- Docker production-style builds
- GitHub Actions CI configuration

The application is currently intended for local development, demonstration, and portfolio use.

---

## Why VANTA?

VANTA was built to demonstrate more than a conventional CRUD application.

The project focuses on operational workflows, asynchronous job processing, AI-assisted triage, realtime communication, analytics, containerization, CI, database integration, and practical production architecture.

It is designed as a compact example of how an incident-management workflow can connect user-facing operations with background intelligence and realtime feedback.

---

## License

This project is currently a portfolio and learning project and does not declare an open-source license.

## Author

**Anthony Emmanuella Mmasinachi**

Full-stack developer focused on frontend engineering, backend systems, APIs, automation, databases, realtime applications, and practical software architecture.

**GitHub:** https://github.com/Scarlet-Twinz
