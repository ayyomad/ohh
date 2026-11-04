# Testing

- Backend: `python manage.py test` (Django test runner, DRF `APITestCase`). Tests hit real PostgreSQL.
- Frontend: Vitest + Testing Library; `npm run lint`, `npm run typecheck`, `npm run build`.
- CI (GitHub Actions) runs all of the above on every push/PR.
- Every phase has automated tests for critical behaviour plus a short manual checklist.
- Evidence rule: a phase is not "tested" until real test output has been seen. Agent reports are not evidence.
- Security-relevant behaviour (ownership, permissions, validation) always gets tests, including negative cases.
- Backend tests run from backend/”. In docs/UI_DESIGN_SYSTEM.md, add: “Tailwind utilities: bg-ground (dashboard),    bg-ground-canvas (canvas).
- avoid password hashing in test fixtures; use set_unusable_password()

