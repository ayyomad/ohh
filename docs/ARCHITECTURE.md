# Architecture

## Overview
- **Frontend**: React + TypeScript + Vite + Tailwind. Canvas is a custom DOM + SVG renderer.
- **Backend**: Django + Django REST Framework + PostgreSQL. Owns users, boards, permissions, assets, snapshots.
- **Sync service** (Phase 9): small Node service (Hocuspocus) speaking the Yjs protocol over WebSocket. Authenticates against Django.
- **Object storage** (Phase 7): S3-compatible (MinIO locally). Binaries never go in PostgreSQL.
- Redis and Celery are NOT used until a concrete need appears.

## Canvas rendering
- A "world" container with one CSS transform = the camera (pan/zoom). Zoom is anchored at the cursor.
- Element cards (text, sticky, checklist, link, ...) are DOM nodes: free accessibility, text editing, CSS.
- Freehand strokes are SVG paths generated with `perfect-freehand`.
- Viewport culling when boards get large.
- Pointer events everywhere (mouse, trackpad, pen). No touch-specific work (desktop only).

## State model (key decision)
- **Document state** (elements) lives in a Yjs document: single source of truth for the board content. Undo/redo via `Y.UndoManager`.
- **Ephemeral UI state** (active tool, selection, camera) lives in Zustand and is never synced.
- Do not mix the two.
- Z-order uses fractional-index strings, not integers.

## Persistence
- Yjs binary state stored in `board_documents` (one row per board); debounced autosave; periodic snapshots in `board_snapshots`.
- Never write every pointer move to the database.
- A JSON export tool exists for debugging, since binary state is opaque.

## Auth (deferred to Phase 8)
- Custom user model exists from Phase 1.
- All board access goes through ONE function, `get_current_user()`, which returns a seeded dev user until Phase 8. Every queryset filters by owner from day one. Tests use two users.
- Phase 8: SimpleJWT; short-lived access token; refresh token in httpOnly cookie (web) or body (future mobile).

## Security notes
Link-preview fetcher must block private/internal IPs (SSRF). Sanitize rich text. Serve uploaded SVGs as downloads or rasterise. Enforce permissions in the sync server. Quotas and rate limits before any public hosting. Do not deploy publicly before Phase 8.

## Repo layout
```
backend/   Django project (config/, apps/accounts, apps/core, ...)
frontend/  React app
docs/      project docs
docker-compose.yml  (db by default; `full` profile adds app containers)
```
