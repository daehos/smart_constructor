# syntax=docker/dockerfile:1

FROM node:22-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS prod-deps
RUN apk add --no-cache git
RUN corepack enable && corepack prepare pnpm@10.27.0 --activate

# Copy workspace root files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
# Copy packages required by the API
COPY packages/contracts/package.json ./packages/contracts/package.json
COPY packages/contracts/src ./packages/contracts/src
# Copy the API package
COPY api/package.json ./api/package.json

RUN pnpm install --frozen-lockfile --prod --filter @smart-constructor/api...

FROM base AS runner
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=prod-deps /app/api/node_modules ./api/node_modules
COPY --from=prod-deps /app/packages ./packages
COPY --chown=nodejs:nodejs api ./api

WORKDIR /app/api
USER nodejs
EXPOSE 3000
CMD ["node", "main.js"]
