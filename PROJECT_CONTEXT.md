# OHh — Project Context (for LLM Q&A)

A one-page briefing on what this project is, what's built so far, and why
decisions were made. Written for hand-off context; not part of the shipped app.

## What the project is

**OHh** ("ohh" with an orange period) — a collaborative whiteboard/moodboard
web app, built in phases by an AI coding agent under strict phase prompts.
Single user for now; auth arrives later. Repo layout:

- `backend/` — Django 5.2 + Django REST Framework, Postgres (psycopg 3), apps in `apps/` (`accounts`, `core`, `boards`), project config in `config/`.
- `frontend/` — React 19 + Vite + TypeScript (strict) + Tailwind 4, TanStack Query.
- `docker-compose.yml` — db (host port 5433) + `--profile full` for backend:8000 & frontend:5173 with API proxy.
- `docs/` — design docs (ARCHITECTURE, API_DESIGN, DATABASE_SCHEMA, UI_DESIGN_SYSTEM, DECISIONS, PROGRESS). These are the human's spec, kept out of the agent's edit path.

Everything runs on Windows/PowerShell; exact-pinned dependencies only; the
human reviews and commits (the agent never commits).

## What's implemented (through Phase 2)

**Phase 1** — scaffold: custom `accounts.User` (AbstractUser), `/api/v1/health/`
with DB check, Docker, CI, frontend token-based design system (light/dark via a
`data-theme` attribute on `<html>`, persisted in localStorage key `ohh-theme`).

**Phase 2** — Boards + dashboard:

- `boards.Board` model: UUID pk, FK owner → AUTH_USER_MODEL, `title`,
  `description`, `settings` JSONField (default `{"appearance":"light","background":"dots"}`),
  `deleted_at` (soft delete), `created_at`/`updated_at`. `Board.objects.alive()`
  filters out soft-deleted rows everywhere.
- REST API at `/api/v1/boards/` (DRF router; ModelViewSet; **no PUT**, only
  GET/POST/PATCH/DELETE). Project-default pagination (page size 20, `?page=N`).
- Dashboard UI: board grid with procedural SVG hatch thumbnails (deterministic
  from board id via FNV-1a → angle/spacing/stroke), debounced search (300 ms),
  create/edit dialog (native `<dialog>`, segmented LIGHT/DARK + PLAIN/GRID/DOTS
  controls), delete confirm dialog, LOADING/empty/error/no-results states,
  LOAD MORE, footer backend-status line, theme toggle preserved from Phase 1.

## Key architectural decisions (and their reasons)

1. **The `get_current_user(request)` seam** (`apps/accounts/current_user.py`):
   every board query and creation resolves "the current user" through this ONE
   function. Until auth exists (Phase 8) it get_or_creates a `dev` user with an
   unusable password, no staff/superuser. Phase 8 should only replace this
   function's body — no other file knows how the user is resolved.
2. **Owner filtering = authorization**: `get_queryset()` always does
   `alive().filter(owner=get_current_user(...))`. A foreign board gives **404,
   never 403** — no existence leak; object lookups can't see others' rows.
3. **Soft delete**: `perform_destroy` sets `deleted_at` (204). Soft-deleted
   rows behave as nonexistent to all reads; the row survives for undo later.
4. **Strict settings validation**: nested serializer requires exactly the two
   keys; unknown keys → 400 (DRF would silently drop them otherwise);
   explicit missing-key check because nested serializers would inherit
   `partial=True` on PATCH. PATCH with `settings` replaces the whole object;
   PATCH without `settings` leaves it untouched. `owner`/`deleted_at` are not
   serializer fields, so payloads trying to set them are ignored.
5. **Search**: `?search=` → `title__icontains`, stripped; **truncated** at 100
   chars rather than 400 (documented in views.py). No manual `%`/`_` escaping —
   Django's PostgreSQL backend escapes them inside `icontains` already
   (manually escaping double-escapes and breaks matching; verified empirically).
6. **Pagination client-side rule**: the frontend never follows the API's
   `next` URL; it builds `?page=N` itself and uses `next !== null` only as a
   "has more" flag. Chose simple page-state over `useInfiniteQuery` (small
   pages, LOAD MORE replaces the grid, easier invalidation).
7. **Retry policy**: TanStack Query retries network/5xx but never 4xx
   (they're answers, not accidents); mutations never retry.
8. **Theme**: synchronous `applyInitialTheme()` before React mounts (no flash);
   all colors come from CSS tokens in `tokens.css`, no shadows/gradients.

## Testing

- Backend: Django `APITestCase` suites in `apps/boards/tests/` (CRUD, 404s for
  foreign + malformed ids, 400 validation matrix, soft delete, search incl.
  literal `%`, ordering, pagination 21→20+1) plus seam tests in
  `accounts/tests.py`. **36 tests pass**; gate test runs
  `makemigrations --check`. Gotchas learned: APIClient defaults to multipart —
  nested JSON payloads need `format="json"`; tests must run from `backend/`.
- Frontend: Vitest + Testing Library, fetch stubbed at transport level.
  **20 tests pass** (dashboard flows incl. debounce timing, dialogs, theme;
  pure utils). Gotchas: jsdom lacks `<dialog>.showModal()/close()` — polyfilled
  in `src/test/setup.ts`; closed dialogs stay in the DOM, so queries are scoped
  (open-dialog helper) to avoid matching invisible content.
- `docker compose up -d db` then `.venv\Scripts\python.exe manage.py migrate`
  from `backend/`; test DB is created/destroyed per run.

## Current state / next phases (per the plan)

- Just finished **Phase 2** (being human-reviewed). Nothing merged yet.
- Later phases (rough roadmap from docs): Phase 3 canvas; 6 board documents
  (Yjs) + snapshots; 7 assets + link previews; 8 auth (registers the seam
  swap — body becomes `request.user`, SimpleJWT); 9 members/invites + sync
  service (separate WebSocket service). Trash/restore UI, duplicate endpoint,
  board visibility fields are all planned OUT so far despite mentions in docs.

## Known doc contradictions

- `docs/API_DESIGN.md` puts `POST /boards/{id}/duplicate/` in Phase 2, but the
  prompt explicitly excluded it.
- `docs/DATABASE_SCHEMA.md` lists boards fields (accent, visibility, thumbnail)
  that current scope deliberately does not include.
- `docs/DECISIONS.md`, `PROGRESS.md`, `TESTING.md` have uncommitted
  modifications in git status (left over from the Phase 1 fix round — Phase 2
  never touched docs/).

## Useful facts

- Dev flow: `docker compose up -d db`; `backend\.venv\Scripts\python.exe
  manage.py runserver`; `cd frontend && npm run dev` → http://localhost:5173
  (Vite proxies `/api` to the backend).
- Full stack: `docker compose --profile full up -d --build`.
- npm audit shows 12 moderate, dev-only advisories (minimatch chain) — accepted.
- CI config exists but was never executed to date.
