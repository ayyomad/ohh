# Product Requirements

OHh is a free, open-source (MIT), desktop-web infinite canvas. Users create boards and place anything on them: text, sticky notes, shapes, arrows, freehand drawing, images, links, checklists, later tables/audio/CSV/charts.

Goals: (1) a polished, reliable, extensible workspace; (2) a learning project: Django, canvas rendering, state/persistence, CRDT collaboration, AI-assisted engineering. Understandable code beats fast code.

## Non-goals (for now)
Commercial use, mobile/touch support, native apps, paid services, AI features.

## MVP (single user, through Phase 7)
- Dashboard: create/rename/delete boards, description, settings (theme, background), search by title.
- Canvas: pan, zoom (wheel, space+drag), select, multi-select, move, resize, rotate, copy/paste/duplicate/delete, z-order, undo/redo.
- Elements: text, sticky note, shapes, basic arrows/lines, checklist, freehand + eraser, images.
- Autosave, reload, recovery.

## Post-MVP
Auth (Phase 8), collaboration: invites, viewer/editor roles, presence, live cursors (Phase 9), link preview cards, rich text (Tiptap), duplicate board, real thumbnails, version history.

## Long-term
Tables, audio, file attachments, CSV preview, charts, groups, crop, connectors bound to shapes, PWA/offline, export to PDF/image, native apps, AI features.
