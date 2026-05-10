#!/bin/sh
set -e
cd /app/whatsapp-service

corepack enable
corepack prepare pnpm@10.27.0 --activate 2>/dev/null || corepack prepare pnpm@latest --activate

# Install from repo root so workspace symlinks (contracts) are resolved
pnpm --dir /app install

if [ "$#" -gt 0 ]; then
  exec "$@"
fi

exec node src/worker.js
