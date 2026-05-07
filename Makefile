SHELL := /bin/bash
export DOCKER_BUILDKIT ?= 1

# Prefer pnpm when installed; otherwise npm (see README).
PKG_MANAGER := $(shell command -v pnpm >/dev/null 2>&1 && echo pnpm || echo npm)

.PHONY: help install dev start seed seed-reset \
	docker-dev-up docker-dev-down docker-dev-logs \
	docker-dev-api-up docker-dev-api-logs \
	docker-prod-up docker-prod-down docker-prod-logs docker-build

help:
	@echo "Smart Constructor — common tasks"
	@echo ""
	@echo "Package manager: $(PKG_MANAGER) (pnpm if available, else npm)"
	@echo ""
	@echo "  make install          Install dependencies"
	@echo "  make dev              Run API with nodemon"
	@echo "  make start            Run API (production mode, NODE_ENV from .env)"
	@echo "  make seed             Run database seeders"
	@echo "  make seed-reset       Seed with --reset"
	@echo ""
	@echo "  make docker-dev-up       Start MongoDB + Redis only"
	@echo "  make docker-dev-api-up   Build & run API in Docker (nodemon) + Mongo + Redis"
	@echo "  make docker-dev-down     Stop dev stack (including API if it was running)"
	@echo "  make docker-dev-logs     Follow Mongo + Redis logs"
	@echo "  make docker-dev-api-logs Follow API container logs"
	@echo ""
	@echo "  make docker-build     Build API image (smart-constructor:local)"
	@echo "  make docker-prod-up   Build and run full prod stack (needs .env)"
	@echo "  make docker-prod-down Stop prod stack"
	@echo "  make docker-prod-logs Follow prod API logs"

install:
	$(PKG_MANAGER) install

dev:
	$(PKG_MANAGER) run dev

start:
	$(PKG_MANAGER) run start

seed:
	$(PKG_MANAGER) run seed

seed-reset:
	$(PKG_MANAGER) run seed:reset

docker-dev-up:
	docker compose -f docker-compose.dev.yml up -d mongo redis

docker-dev-api-up:
	docker compose -f docker-compose.dev.yml --profile api up -d --build

docker-dev-down:
	docker compose -f docker-compose.dev.yml --profile api down

docker-dev-logs:
	docker compose -f docker-compose.dev.yml logs -f mongo redis

docker-dev-api-logs:
	docker compose -f docker-compose.dev.yml logs -f api

docker-build:
	docker build -t smart-constructor:local .

docker-prod-up:
	docker compose -f docker-compose.prod.yml --env-file .env up -d --build

docker-prod-down:
	docker compose -f docker-compose.prod.yml down

docker-prod-logs:
	docker compose -f docker-compose.prod.yml logs -f api
