# whatsapp — WhatsApp Worker

BullMQ consumer that processes `scheduled-whatsapp` jobs and delivers messages via
the Baileys (WhatsApp Web protocol) library.

> **MVP / experimental**: Baileys uses the unofficial WhatsApp Web protocol. It is not
> supported by Meta. Use at your own risk.

## Stack

- Node.js 22
- [@whiskeysockets/baileys](https://github.com/WhiskeySockets/Baileys) — unofficial WhatsApp Web client
- BullMQ — job queue consumer
- Mongoose — Schedule model (schema from `@smart-constructor/contracts`)
- ioredis — Redis connection

## How it works

1. On startup the worker connects to MongoDB and Redis, runs a reconcile pass
   (re-enqueues any missed oneshot jobs, recreates lost repeatable jobs), then
   initialises the Baileys client.
2. Baileys connects to WhatsApp Web. On first run it prints a QR code to stdout
   (and stores it in Redis under `wa:qr`). Scan it with your phone.
3. After pairing, Baileys persists the session in `WHATSAPP_AUTH_DIR`. Subsequent
   restarts reconnect without re-scanning.
4. The BullMQ worker picks up `send-whatsapp` jobs from the `scheduled-whatsapp`
   queue and calls `baileys.sendText(to, body)`.

## Environment variables

Copy `.env.example` to `.env`:

```bash
cp whatsapp-service/.env.example whatsapp-service/.env
```

In Docker (dev or prod) the Compose file reads `api/.env` for all shared secrets,
so you only need a separate `whatsapp-service/.env` for local runs outside Docker.

| Variable | Default | Description |
|---|---|---|
| `MONGODB_URI` | — | Full Mongo connection string |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD` | — | Redis connection |
| `WHATSAPP_AUTH_DIR` | `./wa-auth` | Baileys session storage directory |
| `WHATSAPP_DEFAULT_TZ` | `Asia/Jakarta` | Default IANA timezone |
| `WHATSAPP_WA_VERSION` | — | Optional override `major,build,revision` for Baileys if you see repeated disconnects (e.g. HTTP 405). Otherwise the worker picks version from `web.whatsapp.com/sw.js`, then Baileys’ GitHub JSON, then the bundled default. |
| `WHATSAPP_SEND_DELAY_MS` | `1500` | Jitter delay between sends (ms) |
| `WHATSAPP_QR_TTL_SECONDS` | `60` | QR code TTL in Redis (seconds) |

## Local development

```bash
# From repo root
make install
# Start Mongo + Redis + MinIO in Docker
make docker-dev-infra

# Copy and fill env (MongoDB URI, Redis, etc.)
cp whatsapp-service/.env.example whatsapp-service/.env

# Run worker
cd whatsapp-service
pnpm run dev
```

## Docker

Started automatically by `make docker-dev-up`. Tail logs:

```bash
make docker-dev-wa-logs
```

On first start you will see a QR code in the logs. Scan it with the WhatsApp app
(Linked Devices → Link a Device) to pair the session.

## Source layout

```
whatsapp-service/
  src/
    worker.js            Entry point — bootstraps MongoDB, Redis, reconcile, Baileys
    baileys.client.js    Baileys connection management + sendText
    schedule.queue.js    BullMQ Queue instance
    schedule.worker.js   BullMQ Worker — processes send-whatsapp jobs
    mongoose.config.js   MongoDB connection helper
    redis.config.js      Redis clients
    constants.js         Re-exports from @smart-constructor/contracts
    config/
      env.js             Zod-validated environment config
  scripts/
    docker-entrypoint.dev.sh
  Dockerfile
  Dockerfile.dev
  .env.example
```
