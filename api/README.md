# api — Smart Constructor API

Express + MongoDB (Mongoose) + Redis (BullMQ) + MinIO (image storage) + Gemini API (receipt OCR) + Baileys (WhatsApp scheduling via BullMQ) backend.

Routes are mounted under `/api/<API_VERSION>` (e.g. `/api/v1`).

## Stack

- Node.js 22 / Express 5
- MongoDB via Mongoose
- Redis via ioredis + BullMQ
- MinIO (@aws-sdk/client-s3)
- JWT auth (jsonwebtoken)
- Zod validation

## Environment variables

Copy `.env.example` to `.env`:

```bash
cp api/.env.example api/.env
```

| Variable | Default | Description |
|---|---|---|
| `NODE_ENV` | `development` | `development` / `staging` / `production` |
| `PORT` | `3000` | HTTP port |
| `API_VERSION` | `v1` | URL prefix segment |
| `MONGODB_URI` | — | Full Mongo connection string |
| `MONGO_ROOT_USER` / `MONGO_ROOT_PASSWORD` | — | Root user (used by Compose to init Mongo) |
| `REDIS_HOST`, `REDIS_PORT`, `REDIS_USERNAME`, `REDIS_PASSWORD` | — | Redis connection |
| `JWT_SECRET` | — | JWT signing secret |
| `EMAIL_USER`, `EMAIL_PASSWORD` | — | Gmail SMTP for OTP emails |
| `MINIO_ENDPOINT`, `MINIO_PORT`, `MINIO_ACCESS_KEY`, `MINIO_SECRET_KEY` | — | MinIO / S3 connection |
| `MINIO_BUCKET_RECEIPTS` | `receipts` | Bucket for receipt images |
| `MINIO_USE_SSL` | `false` | Enable TLS |
| `GEMINI_API_KEY` | — | Gemini API key |
| `GEMINI_MODEL` | `gemini-2.5-flash` | Gemini model name |
| `RECEIPT_MAX_UPLOAD_BYTES` | `5242880` | Max receipt image size (5 MB) |
| `WHATSAPP_AUTH_DIR` | `./wa-auth` | Baileys session directory |
| `WHATSAPP_DEFAULT_TZ` | `Asia/Jakarta` | Default timezone for schedules |
| `WHATSAPP_SEND_DELAY_MS` | `1500` | Jitter between sends |
| `WHATSAPP_QR_TTL_SECONDS` | `60` | QR code TTL in Redis |

## Local development

```bash
# From repo root
make install
make docker-dev-infra   # Starts Mongo, Redis, MinIO in Docker
make dev                # Runs api with nodemon
```

## Docker

The `api` service is started via `make docker-dev-up` (together with all infra + WhatsApp worker). See the root [docker-compose.dev.yml](../docker-compose.dev.yml).

## API endpoints

All authenticated endpoints require `Authorization: Bearer <token>`.

### Auth
| Method | Path | Auth |
|---|---|---|
| `POST` | `/api/v1/auth/register` | — |
| `POST` | `/api/v1/auth/login` | — |

### Receipts (OCR)
| Method | Path | Auth |
|---|---|---|
| `POST` | `/api/v1/receipts` | JWT |
| `GET` | `/api/v1/receipts` | JWT |
| `GET` | `/api/v1/receipts/:id` | JWT |

### Schedules (WhatsApp)
| Method | Path | Auth |
|---|---|---|
| `POST` | `/api/v1/schedules` | JWT |
| `GET` | `/api/v1/schedules` | JWT |
| `GET` | `/api/v1/schedules/:id` | JWT |
| `PATCH` | `/api/v1/schedules/:id` | JWT |
| `DELETE` | `/api/v1/schedules/:id` | JWT |

### WhatsApp admin
| Method | Path | Auth |
|---|---|---|
| `GET` | `/api/v1/whatsapp/status` | JWT |
| `GET` | `/api/v1/whatsapp/qr` | JWT |
