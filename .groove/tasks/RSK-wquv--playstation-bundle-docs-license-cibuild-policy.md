---
# RSK-wquv
title: PlayStation bundle — docs, LICENSE, CI/build policy
status: todo
type: task
created_at: 2026-03-22T00:47:56Z
updated_at: 2026-03-22T00:47:56Z
parent: RSK-v50c
---

## Context

Child of **RSK-v50c**. Close the loop: update `docs/playstation-engine-hacking.md`, brainstorm cross-links, `LICENSE.playstation.txt` if build adds substantial layers; decide/document whether `apps/web` `pnpm build` depends on PlayStation bundle or stays manual.

## Goal

Contributors can rebuild and understand license posture. **Document the 2↔3↔4 story** in-repo so the epic’s architecture section is not only in Groove.

## Acceptance Criteria

- [ ] Docs reflect final layout + commands
- [ ] **Add or extend** [`docs/architecture.md`](../../docs/architecture.md) (or `docs/playstation-engine-hacking.md`) with a short subsection: **emulator bundle (2) → host → platform (4) → plugins (3)** — no plugin imports from `playstation-src/`; pointer to `RiskbreakerEmulatorHost` (or final name) in source
- [ ] Document **backtick overlay** (**RSK-74eh**): keyboard, focus, manual QA or E2E note
- [ ] LICENSE / notices updated if required by changes
- [ ] **`pnpm e2e` still passes** after doc-only is N/A; after any script change, e2e required

## Links

- [brainstorm](../../docs/brainstorms/playstation-js-modularize-typescript.md)
