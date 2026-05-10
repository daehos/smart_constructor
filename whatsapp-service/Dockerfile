# Production WhatsApp worker (Baileys + BullMQ). Build from repo root:
#   docker build -f whatsapp-service/Dockerfile .

FROM node:22-bookworm-slim

WORKDIR /app
ENV NODE_ENV=production

RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Copy contracts (peer dependency)
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/contracts/src ./packages/contracts/src
# Copy whatsapp package manifest
COPY whatsapp-service/package.json ./whatsapp-service/package.json

RUN pnpm install --frozen-lockfile --prod --filter @smart-constructor/whatsapp...

# Copy source
COPY whatsapp-service/src ./whatsapp-service/src

WORKDIR /app/whatsapp-service

CMD ["node", "src/worker.js"]
