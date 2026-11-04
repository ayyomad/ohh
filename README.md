# OHh

A free, open-source, collaborative infinite canvas for collecting and organising ideas.

Status: early development — Phase 1 (repo scaffold). See [`docs/PROGRESS.md`](docs/PROGRESS.md) for the current phase and [`docs/DEVELOPMENT_PLAN.md`](docs/DEVELOPMENT_PLAN.md) for the roadmap.

## Docs

- [`docs/PRODUCT_REQUIREMENTS.md`](docs/PRODUCT_REQUIREMENTS.md) – what we are building
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) – how it fits together
- [`docs/DATABASE_SCHEMA.md`](docs/DATABASE_SCHEMA.md), [`docs/API_DESIGN.md`](docs/API_DESIGN.md)
- [`docs/UI_DESIGN_SYSTEM.md`](docs/UI_DESIGN_SYSTEM.md) – visual language
- [`docs/DECISIONS.md`](docs/DECISIONS.md) – why we chose what we chose
- [`docs/TESTING.md`](docs/TESTING.md), [`docs/PROGRESS.md`](docs/PROGRESS.md)

## Project structure

```
backend/    Django project (config/, apps/accounts, apps/core)
frontend/   React + Vite + TypeScript + Tailwind app
docs/       project docs
docker-compose.yml   db by default; the `full` profile adds app containers
```

## Prerequisites

- Python 3.13 (`py -3.13` on Windows)
- Node.js 22
- Docker Desktop (running)

## Quickstart (PowerShell)

```powershell
# 1. Environment file (repo root). Adjust values if needed — do NOT commit it.
Copy-Item .env.example .env

# 2. Start only the Postgres database (host port 5433).
docker compose up -d db

# 3. Backend: create venv, install, migrate, run.
py -3.13 -m venv backend\.venv
backend\.venv\Scripts\pip.exe install -r backend\requirements.txt
backend\.venv\Scripts\python.exe backend\manage.py migrate
backend\.venv\Scripts\python.exe backend\manage.py runserver
# -> http://127.0.0.1:8000 (admin at /admin/, health at /api/v1/health/)

# 4. Frontend (separate terminal): install and run.
cd frontend
npm install
npm run dev
# -> http://127.0.0.1:5173 (proxies /api to 127.0.0.1:8000)
```

## Tests

```powershell
# Backend (run from backend/, so Django's test discovery finds the apps)
cd backend
.venv\Scripts\python.exe manage.py test
.venv\Scripts\python.exe manage.py makemigrations --check --dry-run

# Frontend (from frontend/)
npm run lint
npm run typecheck
npm run test
npm run build
```

## The `full` profile (everything in Docker)

`docker compose --profile full up --build` builds and starts all three
services: `db` (Postgres, port 5433), `backend` (http://127.0.0.1:8000) and
`frontend` (http://127.0.0.1:5173). Values come from the repo-root `.env`.
The default `docker compose up -d db` starts ONLY the database; day-to-day
development runs the two apps natively (see `docs/DECISIONS.md`, D-008).

## Troubleshooting

- **Docker not running / "error during connect"**: start Docker Desktop and
  wait until the whale icon is idle; check `docker info` succeeds.
- **Port 5433 in use**: another Postgres owns the port. Change
  `POSTGRES_PORT` in `.env` (e.g. `5434`) — never hardcode it elsewhere.
- **Backend refuses to start ("DJANGO_SECRET_KEY")**: `DJANGO_SECRET_KEY`
  has no default on purpose. Create `.env` from `.env.example` first.
- **`makemigrations`/`test` hang or warn about the database**: the Postgres
  container from step 2 must be up first (`docker compose up -d db`).
- On Windows prefer `127.0.0.1` over `localhost` for local services
  (IPv6 fallback can add multi-second delays).

## License

MIT
