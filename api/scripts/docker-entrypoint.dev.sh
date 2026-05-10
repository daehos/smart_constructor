#!/bin/sh
set -e
cd /app/api

corepack enable

install_deps() {
  corepack prepare pnpm@10.27.0 --activate 2>/dev/null || corepack prepare pnpm@latest --activate
  # Install from repo root so workspace links are resolved
  pnpm --dir /app install
}

# Compose `command:` arguments take precedence over the default dev server.
if [ "$#" -gt 0 ]; then
  install_deps
  exec "$@"
fi

install_deps
exec pnpm run dev
