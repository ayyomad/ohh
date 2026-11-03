# Development Plan

Budget: ~4–5 h/week → ~3 weeks per phase. First milestone v0.1 = single-user canvas with autosave (end of Phase 7).

| Phase | Content | Key acceptance |
|---|---|---|
| 0 | Discovery & architecture | Docs approved |
| 1 | Repo, Docker, Django + React, CI, custom user model | One-command start; tests + CI green; health endpoint |
| 2 | Boards backend + dashboard (single user, owner-filtered) | CRUD works; owner isolation tested with two users |
| 3 | Canvas core: camera, hit-testing, selection, in-memory Yjs doc | Pan/zoom at cursor; space+drag; one element type |
| 4 | Text, sticky, shapes, arrows, resize/rotate, z-order, copy/paste | All manipulable; undo/redo works |
| 5 | Freehand + eraser | Smooth strokes; width/colour; no blur hacks |
| 6 | Persistence: autosave, load, snapshots | Refresh keeps board; no per-move DB writes |
| 7 | Images, uploads, link previews | Presigned flow; SSRF tests |
| 8 | Auth, then first deploy | Secure auth; permissions tested |
| 9 | Collaboration | Two browsers sync; viewers can't write |
| 10 | Tables, audio, CSV, charts | Per-type acceptance |
| 11 | PWA/offline (optional) | Installable |
| 12 | Hardening, performance, docs | Security checklist; large-board test |

## Workflow
ME → CLAUDE (plan + prompt) → OPENCODE (implement, no commits) → CLAUDE (review actual diff/test output) → ME (manual test, read code, commit) → next phase.
Problems are classed Critical / Major / Minor / Optional. No advancing with blockers open.

## Git workflow
Branch per phase (`phase-N-name`). OpenCode never commits. After review and manual testing, the human reads the code, then commits in small logical commits (`git add -p`), merges to `main` with `--no-ff`, tags `phase-N-complete`, and updates `PROGRESS.md` in the same merge. If you can't explain a file, don't commit it.
