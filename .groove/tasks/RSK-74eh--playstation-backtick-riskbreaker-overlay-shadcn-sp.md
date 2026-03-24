---
# RSK-74eh
title: PlayStation — backtick Riskbreaker overlay (shadcn spike)
status: completed
type: task
created_at: 2026-03-22T00:59:11Z
updated_at: 2026-03-22T14:00:00Z
parent: RSK-v50c
---

## Context

Child of **RSK-v50c**. **North-star spike** for the epic: while a PS1 game is running in the vendored shell, the user can press **`** (backtick, Doom-style console metaphor) to **toggle** a **Riskbreaker overlay** — **shadcn-aligned** UI — drawn **on top of** the emulator canvas (same document as `PlayStation.htm`), not a separate route.

Implementation detail is intentionally open (React island vs lightweight bundle, where Tailwind/shadcn compile, how focus/pointer-events interact with canvas). **No** full plugin/session wiring required for “done” — placeholder panel content is OK.

## Goal

Prove **layer 1 (browser) + layer 2 (bundle)** can host **Riskbreaker chrome** in-game without breaking play.

## Acceptance Criteria

- [x] **Backtick** (**Backquote** key) toggles `#rb-riskbreaker-overlay` (`riskbreaker-overlay-boot.js` + `riskbreaker-overlay.ts`); US layout; intl TBD
- [x] Overlay uses host styles / panel spike (shadcn-aligned direction); placeholder content OK for v1
- [x] E2E asserts hidden → visible → hidden via `e2e/play-spike.spec.ts`; focus/pause semantics documented in `playstation-src/README.md` / hacking doc as needed
- [x] **`pnpm e2e`** passes (keyboard smoke on overlay)

**Closed 2026-03-22.**

## Links

- Epic **RSK-v50c** (2↔1 integration)
- [docs/plans/rsk-v50c-playstation-bundle.md](../../docs/plans/rsk-v50c-playstation-bundle.md)
