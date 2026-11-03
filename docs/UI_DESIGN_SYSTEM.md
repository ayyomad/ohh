# UI Design System

Direction: minimalist editorial + contemporary brutalist + technical instrument. Derived from four references (EQ panel, field recorder, weather instruments, "Impact" bento card).

## Principles
- Flat tonal surfaces; depth from 1.5px ink borders, NOT shadows. No blur shadows, no gradients, no glass.
- Black = solid/"on" state. Orange = the single signal colour (active, selection, primary action, errors, destructive; differentiated by label/icon).
- Mono caps for metadata/labels. Large numerals/type as visual anchors.
- Hatching and thin line-drawn instrument glyphs for empty/loading/placeholder states.
- Dashboard (editorial, bento grid) and canvas (quiet, content dominates) are different environments.

## Tokens
| Token | Light | Dark |
|---|---|---|
| ground (dashboard) | #DADBD7 | #17171A |
| ground (canvas) | #F2F2EF | #17171A |
| surface | #F2F2EF | #202024 |
| surface-2 | #E8E9E5 | #2A2A2F |
| ink / text | #202024 | #ECECE8 |
| muted text | #6B6D6A | #9A9C98 |
| line | #A6A8A5 | #3A3A40 |
| accent (fills, large, outlines) | #F04B12 | #FF5A24 |
| accent-text (small text) | #C93A08 | #FF7A4D |

Rules: #A6A8A5 is decorative only (never text). Text on orange fills is ink, not white. Contrast figures are estimates; verify with a checker.
Presence cursors (Phase 9) may use 6 muted hues: the only multi-hue exception.

## Type
Inter (UI), IBM Plex Mono (labels, 11–12px, uppercase, letter-spaced, tabular numerals), Instrument Serif italic (dashboard annotations/empty states only; never in canvas chrome). Self-hosted via @fontsource (all OFL).

## Shape
Radius: 4px inputs/chips, 12px cards, full for pills/toolbar, 2–4px for canvas elements. Circles only for slider handles and instrument glyphs. Canvas selection handles: small squares with ink border; selection outline orange 1.5px.

## Other
Icons: Lucide, 1.5px stroke, shortcut hints in mono. Per-board accent: curated ~8 swatches, affects canvas content/selection only; app chrome stays orange. Board light/dark is independent of app theme.
