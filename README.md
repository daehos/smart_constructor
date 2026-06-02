# Smart Constructor — Monorepo

pnpm workspace containing three sibling services and a shared contracts package.

## Repo layout

```
repo-root/
  api/                    Express API (receipts, schedules, auth)
  whatsapp-service/       Baileys WhatsApp worker (BullMQ consumer)
  packages/
    contracts/            Shared queue constants + mongoose schema factory
  docker-compose.dev.yml
  docker-compose.prod.yml
  Makefile
  pnpm-workspace.yaml
```

## Services

| Service | Language | README |
|---|---|---|
| `api` | Node.js / Express | [api/README.md](api/README.md) |
| `whatsapp-service` | Node.js / Baileys | [whatsapp-service/README.md](whatsapp-service/README.md) |
| `packages/contracts` | Node.js | [packages/contracts/README.md](packages/contracts/README.md) |

## Quick start (Docker)

Compose uses an **external** Docker network (Compose does not create it). Defaults:

| Stack | Network name | One-time setup |
|---|---|---|
| Dev | `smart_constructor_dev` | `make docker-dev-network` or `docker network create smart_constructor_dev` |
| Prod | `smart_constructor_prod` | `make docker-prod-network` or `docker network create smart_constructor_prod` |

Override the name with `SMART_CONSTRUCTOR_DOCKER_NETWORK` in your shell or `.env` next to the compose file when running `docker compose`.

`make docker-dev-up` / `make docker-dev-infra` / `make docker-prod-up` run the matching `make docker-*-network` first so the network exists.

```bash
# Copy environment file and fill in secrets
cp api/.env.example api/.env

# Start full stack (API + WhatsApp + infra)
make docker-dev-up

# Tail WhatsApp worker logs (scan QR on first run)
make docker-dev-wa-logs
```

## Quick start (local)

```bash
# Install all workspace dependencies
make install   # or: pnpm install

# Copy and configure API env
cp api/.env.example api/.env

# Start infra (Mongo, Redis, MinIO) in Docker
make docker-dev-infra

# Run API locally
make dev
```

## Makefile targets

```
make install            Install all workspace dependencies
make dev                Run API with nodemon
make docker-dev-network Ensure dev external network exists
make docker-prod-network Ensure prod external network exists
make docker-dev-up      Full dev stack in Docker
make docker-dev-infra   Infra only (no API/WhatsApp)
make docker-dev-down    Stop dev stack
make docker-dev-api-logs   API container logs
make docker-dev-wa-logs    WhatsApp worker logs (+ QR)
make docker-prod-up     Build and run production stack
```

## Environment files

Each service owns its own `.env` / `.env.example`. For development the Docker Compose
files read `api/.env` for both the `api` and `whatsapp` services (shared secrets for
MongoDB, Redis, JWT, etc.). Copy and edit before first run:

```bash
cp api/.env.example api/.env
```

Receipt OCR uses the Gemini API; configure `GEMINI_API_KEY` in `api/.env`.
