# API Design

- REST under `/api/v1/`, JSON, DRF. Errors: `{ "detail": "...", "code": "..." }` with correct HTTP status.
- IDs are UUIDs for user-facing resources.
- Pagination on all list endpoints.

## Planned endpoints
| Phase | Endpoint |
|---|---|
| 1 | `GET /api/v1/health/` |
| 2 | `/api/v1/boards/` CRUD; `POST /api/v1/boards/{id}/duplicate/` |
| 6 | board document load/save, snapshots |
| 7 | asset presign + confirm; `POST /api/v1/link-preview/` |
| 8 | auth: register, login, refresh, logout, me |
| 9 | members, invites; internal endpoints for the sync service (shared secret) |

The sync service is a separate WebSocket service, not part of the REST API.
