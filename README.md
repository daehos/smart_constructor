# Smart Constructor API

Express + MongoDB (Mongoose) + Redis (BullMQ / OTP) backend. Routes are mounted under `/api/<API_VERSION>` (for example `/api/v1`).

## Requirements

- Node.js 20+ (22 LTS recommended; the production image uses Node 22 Alpine)
- **pnpm** (recommended) or **npm**
- Docker with Compose v2 (optional, for containerized MongoDB / Redis / full stack)

## Package manager: pnpm with npm fallback

This repo includes **`pnpm-lock.yaml`** (primary) and **`package-lock.json`** so either tool works.

| Tool | Install command |
|------|-----------------|
| pnpm | `pnpm install` |
| npm  | `npm install` |

The **Makefile** picks `pnpm` when it is on your `PATH`, otherwise `npm`. Corepack (ships with Node) can enable pnpm:

```bash
corepack enable
corepack prepare pnpm@latest --activate
```

To regenerate the pnpm lockfile from npm’s lockfile:

```bash
pnpm import
```

## Configuration

1. Copy the example env file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env`. Variables validated at startup are defined in `configs/env.js`. Notable entries:

   | Variable | Purpose |
   |----------|---------|
   | `NODE_ENV` | `development` \| `staging` \| `production` |
   | `PORT` | HTTP port (default in schema: `3000` if unset) |
   | `API_VERSION` | URL segment, e.g. `v1` |
   | `MONGODB_URI` | Mongo connection string |
   | `REDIS_HOST`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD` | Redis for app + workers |
   | `JWT_SECRET` | Signing secret for JWTs |

   Optional: `EMAIL_USER`, `EMAIL_PASSWORD` (OTP mail), and `SITE_*` in `constants/site.constant.js`.

## Local development

### Option A: Docker for MongoDB + Redis only

Start dependencies (Mongo + Redis; no API container):

```bash
make docker-dev-up
# or: docker compose -f docker-compose.dev.yml up -d mongo redis
```

Use a `.env` aligned with the dev compose file (see `.env.example`: `REDIS_PASSWORD=dev_redis_secret`, Mongo on `127.0.0.1:27017`).

Then run the API on the host:

```bash
make dev
# or: pnpm dev   /   npm run dev
```

### Option A2: API in Docker (nodemon + bind-mounted code)

Same Mongo/Redis images, plus an **`api`** service (Compose **profile** `api`) that runs `pnpm dev` / `npm run dev` inside Node 22. Your repo is bind-mounted at `/app`; `node_modules` lives in a named volume so installs stay inside Linux.

Requires a `.env` file (for `JWT_SECRET`, `API_VERSION`, email, etc.). Compose **overrides** `MONGODB_URI`, `REDIS_*`, and `PORT` so the container talks to `mongo` and `redis` on the compose network and listens on **8080** inside the container.

```bash
cp .env.example .env   # if you have not already
make docker-dev-api-up
# Host URL: http://localhost:8080 (or set DEV_HOST_PORT in the environment)
```

Logs: `make docker-dev-api-logs`. Stop everything (including API): `make docker-dev-down`.

### Option B: Everything installed locally

Run MongoDB and Redis yourself, set `MONGODB_URI` and Redis variables in `.env`, then `make dev`.

### Seed data

```bash
make seed
make seed-reset   # with --reset
```

## Production-style run with Docker Compose

1. Create `.env` with strong `JWT_SECRET` and `REDIS_PASSWORD`, plus `API_VERSION` and any email/site variables you need.

2. The compose file overrides `MONGODB_URI`, `REDIS_HOST`, and `REDIS_PORT` for in-network services. The API listens on **port 3000 inside the container**; the host maps **`HOST_PORT` (default `8080`)** to that port.

3. Start the stack:

   ```bash
   make docker-prod-up
   # or: docker compose -f docker-compose.prod.yml --env-file .env up -d --build
   ```

4. Stop:

   ```bash
   make docker-prod-down
   ```

For managed MongoDB or Redis, remove or adjust those services in `docker-compose.prod.yml` and set `MONGODB_URI` / Redis settings in `.env` only.

## Makefile reference

Run `make help` for the full list. Common targets:

- `make install` — install dependencies (pnpm or npm)
- `make dev` / `make start` — run the API
- `make docker-dev-up` / `make docker-dev-down` — dev Mongo + Redis
- `make docker-dev-api-up` / `make docker-dev-api-logs` — API in Docker + dev data services
- `make docker-prod-up` / `make docker-prod-down` — full prod stack

## API image only

```bash
make docker-build
# or: docker build -t smart-constructor:local .
```

The Dockerfile installs with **pnpm** when `pnpm-lock.yaml` is present, otherwise **`npm ci`** if `package-lock.json` exists, else `npm install`.

## Project layout (high level)

- `main.js` — HTTP server bootstrap
- `configs/` — env, MongoDB, Redis
- `routes/`, `controllers/`, `services/` — HTTP layer and domain logic
- `models/` — Mongoose schemas
- `queues/` — BullMQ workers (e.g. OTP)
- `seeders/` — data seed scripts
