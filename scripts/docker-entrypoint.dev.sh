#!/bin/sh
set -e
cd /app

corepack enable

if [ -f pnpm-lock.yaml ]; then
  corepack prepare pnpm@10.27.0 --activate 2>/dev/null || corepack prepare pnpm@latest --activate
  pnpm install
  exec pnpm run dev
fi

if [ -f package-lock.json ]; then
  npm install
  exec npm run dev
fi

npm install
exec npm run dev
