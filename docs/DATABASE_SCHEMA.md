# Database Schema (planned; built incrementally)

| Table | Purpose / key fields |
|---|---|
| users | Custom `accounts.User` (extends AbstractUser). Created Phase 1. |
| boards | UUID id, owner FK, title, description, `settings` JSONB (theme, accent, background), visibility (private/link-view/link-edit), thumbnail, soft delete, timestamps |
| board_members | board, user, role (owner/editor/viewer); unique (board, user) |
| board_invites | board, token, email, role, expires_at |
| board_documents | board (1:1), `ydoc_state` bytea, schema_version, updated_at |
| board_snapshots | board, state (bytea or storage key), reason, created_by, created_at |
| assets | board, uploader, storage_key, mime, size, sha256, width/height/duration, status |
| link_previews | url hash, title, description, image asset, fetched_at |
|the boards row now reads “settings JSONB {appearance: light|dark, background: plain|grid|dots}; deleted_at soft delete. Accent colour, visibility (Phase 9) and thumbnail come later.”|

Elements are NOT rows. They live inside the Yjs document:
`{ id, type, x, y, w, h, rotation, z, groupId, props }` where `props` is per-type JSON and `z` is a fractional index string.
Asset references inside elements use asset IDs; a scheduled job removes orphaned assets.
