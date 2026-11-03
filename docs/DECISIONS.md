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
