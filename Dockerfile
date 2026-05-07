# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS prod-deps
RUN corepack enable

COPY package.json pnpm-lock.yaml* package-lock.json* ./

RUN set -eux; \
  if [ -f pnpm-lock.yaml ]; then \
    corepack prepare pnpm@latest --activate; \
    pnpm install --frozen-lockfile --prod; \
  elif [ -f package-lock.json ]; then \
    npm ci --omit=dev; \
  else \
    npm install --omit=dev; \
  fi

FROM base AS runner
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .

USER nodejs
EXPOSE 3000
CMD ["node", "main.js"]
