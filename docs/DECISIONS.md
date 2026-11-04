# Decisions

| ID | Decision | Why / tradeoff |
|---|---|---|
| D-001 | Custom DOM + SVG canvas, not tldraw/Konva/Fabric | Most elements are HTML-like; tldraw production needs a license key; learning goal. Fallback: tldraw if Phases 3–5 stall. |
| D-002 | Canvas content in a Yjs document, not element rows | Free undo, collaboration-ready, no later migration. Cost: opaque binary; mitigated by JSON export. |
| D-003 | Sync via separate Hocuspocus (Node) service in Phase 9; Django owns auth/permissions | Mature; pycrdt-websocket spiked first. |
| D-004 | No Redis/Celery until needed | Avoid unnecessary tech. |
| D-005 | MIT license | Simple; all dependencies MIT-compatible. |
| D-006 | Auth deferred to Phase 8 with `get_current_user()` seam + owner filtering + two-user tests; custom user model in Phase 1 | Speeds early phases; keeps retrofit cheap. No public deploy before auth. |
| D-007 | Desktop only | Scope. Pointer events still used. |
| D-008 | Native Windows dev. Docker Compose runs Postgres by default; app runs natively. `full` profile containerises the apps. | Bind-mount file watching is slow on Windows. |
| D-009 | Django built-in test runner (APITestCase); Vitest for frontend | Fewer dependencies. |
| D-010 | MinIO/object storage added in Phase 7, not Phase 1 | Don't ship untested infrastructure. |
| D-011 | Fractional-index strings for z-order | Avoids concurrent renumbering conflicts. |
| D-012 | One signal colour (orange); no shadows; self-hosted OFL fonts | See UI_DESIGN_SYSTEM.md. |
| D-013 | Django 5.2 LTS unless a blocker is found | Long support window. Confirm in Phase 1 report. |
| D-014 | TypeScript pinned to 6.0.x, jsdom to 29.x | typescript-eslint 8.72 supports TS below 6.1. jsdom 30 needs Node 22.22.2 or newer (local is 22.14). Revisit when Node/tooling is updated. |
| D-015 | Postgres connect_timeout=3 | Stops an indefinite hang when the DB is down on Windows. The root cause is not independently verified. |
| D-016 | All published Docker ports bound to 127.0.0.1 | The dev DB and servers must not be reachable from the LAN. |
| D-017 | Compose-network ALLOWED_HOSTS set in the compose file, not .env | .env values override compose defaults. |
| D-018 | Theme applied synchronously before first render | Avoids a wrong-theme flash. |
| D-019 |	Phase 2 board settings are only appearance and background |	Accent and visibility need the canvas and auth first
| D-020 |	Foreign boards return 404, not 403	| Owner-filtered queryset, so existence never leaks
| D-021 |	Soft delete via deleted_at, alive() queryset |	Keeps rows for later restore and export
| D-022 |	Search is truncated at 100 characters, with no manual wildcard escaping |	Django escapes % and _ for icontains itself
| D-023 |	get_current_user() | seam seeds an unusable-password dev user	One function for Phase 8 to rewrite |
| D-024 |	confirmed by measurement: about 2 s first-request penalty on localhost, about 60 ms on 127.0.0.1 |
