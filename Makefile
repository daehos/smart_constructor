SHELL := /bin/bash
export DOCKER_BUILDKIT ?= 1

# Prefer pnpm when installed; otherwise npm.
PKG_MANAGER := $(shell command -v pnpm >/dev/null 2>&1 && echo pnpm || echo npm)

.PHONY: help install dev start seed seed-reset \
	docker-dev-network docker-prod-network \
	docker-dev-up docker-dev-infra docker-dev-down docker-dev-logs \
	docker-dev-api-up docker-dev-api-logs \
	docker-dev-ocr-build docker-dev-ocr-logs \
	docker-dev-wa-logs \
	docker-prod-up docker-prod-down docker-prod-logs docker-build

help:
	@echo "Smart Constructor — common tasks"
	@echo ""
	@echo "Package manager: $(PKG_MANAGER) (pnpm if available, else npm)"
	@echo ""
	@echo "  make install          Install all workspace dependencies"
	@echo "  make dev              Run API locally with nodemon (from api/)"
	@echo "  make start            Run API (production mode, NODE_ENV from api/.env)"
	@echo "  make seed             Run database seeders"
	@echo "  make seed-reset       Seed with --reset"
	@echo ""
	@echo "  make docker-dev-network     Ensure external Docker network exists (smart_constructor_dev)"
	@echo "  make docker-prod-network    Ensure external Docker network exists (smart_constructor_prod)"
	@echo "  make docker-dev-up          Full dev stack in Docker (API on :8080 + Mongo + Redis + MinIO + OCR + WhatsApp)"
	@echo "  make docker-dev-infra       Deps only (no API) — then run API on host: make dev"
	@echo "  make docker-dev-api-up      Alias for docker-dev-up"
	@echo "  make docker-dev-down        Stop dev stack (including API/WhatsApp)"
	@echo "  make docker-dev-logs        Follow Mongo + Redis logs"
	@echo "  make docker-dev-api-logs    Follow API container logs"
	@echo "  make docker-dev-ocr-build   Rebuild OCR Python image"
	@echo "  make docker-dev-ocr-logs    Follow OCR service logs"
	@echo "  make docker-dev-wa-logs     Follow WhatsApp worker logs (incl. QR code on first start)"
	@echo "  make docker-build           Build API image (smart-constructor-api:local)"
	@echo "  make docker-prod-up         Build and run full prod stack (needs api/.env)"
	@echo "  make docker-prod-down       Stop prod stack"
	@echo "  make docker-prod-logs       Follow prod API logs"

install:
	$(PKG_MANAGER) install

dev:
	cd api && $(PKG_MANAGER) run dev

start:
	cd api && $(PKG_MANAGER) run start

seed:
	cd api && $(PKG_MANAGER) run seed

seed-reset:
	cd api && $(PKG_MANAGER) run seed:reset

# Compose uses external: true — these targets create the network if missing (Compose will not).
docker-dev-network:
	@docker network inspect smart_constructor_dev >/dev/null 2>&1 || docker network create smart_constructor_dev

docker-prod-network:
	@docker network inspect smart_constructor_prod >/dev/null 2>&1 || docker network create smart_constructor_prod

docker-dev-up: docker-dev-network
	docker compose -f docker-compose.dev.yml --profile api up -d --build

docker-dev-infra: docker-dev-network
	docker compose -f docker-compose.dev.yml up -d mongo redis minio minio-init ocr

docker-dev-api-up: docker-dev-up

docker-dev-down:
	docker compose -f docker-compose.dev.yml --profile api down

docker-dev-logs:
	docker compose -f docker-compose.dev.yml logs -f mongo redis

docker-dev-api-logs:
	docker compose -f docker-compose.dev.yml logs -f api

docker-dev-ocr-build:
	docker compose -f docker-compose.dev.yml build ocr

docker-dev-ocr-logs:
	docker compose -f docker-compose.dev.yml logs -f ocr

docker-dev-wa-logs:
	docker compose -f docker-compose.dev.yml logs -f whatsapp

docker-build:
	docker build -f api/Dockerfile -t smart-constructor-api:local .

docker-prod-up: docker-prod-network
	docker compose -f docker-compose.prod.yml --env-file api/.env up -d --build

docker-prod-down:
	docker compose -f docker-compose.prod.yml down

docker-prod-logs:
	docker compose -f docker-compose.prod.yml logs -f api
