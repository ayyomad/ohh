# AGENTS.md – rules for AI coding agents (OpenCode)

Read these before any work: `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/PROGRESS.md`, `docs/UI_DESIGN_SYSTEM.md`.

## Hard rules
1. Implement ONLY the phase described in the prompt. No extra features, no refactors outside scope.
2. NEVER run `git commit`, `git push`, `git reset`, `git rebase`, `git stash`, `git checkout`/`git switch`. Read-only git (`status`, `diff`, `log`) is fine. The human reviews and commits.
3. No new dependencies unless the prompt lists them. If you believe one is needed, STOP, do not install it, and explain in your report. Pin exact versions.
4. Do not change architecture. If something in the docs looks wrong or impossible, stop and report it.
5. Never write secrets into tracked files. `.env` is git-ignored; keep `.env.example` current.
6. Never claim tests pass unless you ran them and saw them pass. Paste real output in the report. Report failures honestly.
7. If blocked or unsure, stop and ask rather than guess.

## Environment
- Windows, PowerShell, repo at `F:\Projects\ohh`. Python 3.13, Node 22, Docker Desktop (no WSL assumed).
- No bash-only commands, no Makefile. Use PowerShell-compatible commands only.
- Python venv: `backend\.venv`. Run Python as `backend\.venv\Scripts\python.exe`.

## Code style
- Readable over clever. Comments explain WHY, not WHAT. Small functions.
- Python: type hints on public functions, Django conventions, validate on the backend.
- TypeScript: `strict`, no `any`, no unused exports.
- Never trust the frontend for permissions or validation.

## Final report (always)
Implementation summary; files created; files modified; dependencies added (with versions); important decisions; commands run; tests run with real output; known issues; remaining TODOs; manual testing steps.
