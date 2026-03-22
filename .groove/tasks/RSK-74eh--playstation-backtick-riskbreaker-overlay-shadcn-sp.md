---
# RSK-74eh
title: PlayStation — backtick Riskbreaker overlay (shadcn spike)
status: todo
type: task
created_at: 2026-03-22T00:59:11Z
updated_at: 2026-03-22T00:59:11Z
parent: RSK-v50c
---

## Context

Child of **RSK-v50c**. **North-star spike** for the epic: while a PS1 game is running in the vendored shell, the user can press **`** (backtick, Doom-style console metaphor) to **toggle** a **Riskbreaker overlay** — **shadcn-aligned** UI — drawn **on top of** the emulator canvas (same document as `PlayStation.htm`), not a separate route.

Implementation detail is intentionally open (React island vs lightweight bundle, where Tailwind/shadcn compile, how focus/pointer-events interact with canvas). **No** full plugin/session wiring required for “done” — placeholder panel content is OK.

## Goal

Prove **layer 1 (browser) + layer 2 (bundle)** can host **Riskbreaker chrome** in-game without breaking play.

## Acceptance Criteria

- [ ] **Backtick** (`` ` ``) toggles overlay visibility during gameplay (default US keyboard; document if intl layouts differ).
- [ ] Overlay is **visually** consistent with Riskbreaker / shadcn direction (use existing stack from `apps/web` where practical).
- [ ] Game remains usable when overlay is **closed**; when **open**, document focus behaviour (e.g. game paused vs input still reaching emulator — pick one for v1 and note gaps).
- [ ] **`pnpm e2e` passes**; optional: extend `e2e/play-spike.spec.ts` with a **skipped** or **light** keyboard test if flakiness is a concern — otherwise **manual QA** steps in `docs/playstation-engine-hacking.md` or plan doc.

## Links

- Epic **RSK-v50c** (2↔1 integration)
- [docs/plans/rsk-v50c-playstation-bundle.md](../../docs/plans/rsk-v50c-playstation-bundle.md)
