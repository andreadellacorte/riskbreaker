---
# RSK-wquv
title: PlayStation bundle — docs, LICENSE, CI/build policy
status: completed
type: task
created_at: 2026-03-22T00:47:56Z
updated_at: 2026-03-22T14:00:00Z
parent: RSK-v50c
---

## Context

Child of **RSK-v50c**. Close the loop: update `docs/playstation-engine-hacking.md`, brainstorm cross-links, `LICENSE.playstation.txt` if build adds substantial layers; decide/document whether `apps/web` `pnpm build` depends on PlayStation bundle or stays manual.

## Goal

Contributors can rebuild and understand license posture. **Document the 2↔3↔4 story** in-repo so the epic’s architecture section is not only in Groove.

## Acceptance Criteria

- [x] Docs reflect final layout + commands (`docs/playstation-engine-hacking.md`, `apps/web/playstation-src/README.md`, root README CI)
- [x] Architecture narrative: **2 → host → 4 → 3** documented in epic **RSK-v50c** + [`emulator-bridge.ts`](../../apps/web/playstation-src/emulator-bridge.ts) (`RiskbreakerEmulatorHost`); no `plugins/` imports in `playstation-src/`
- [x] **Backtick overlay** (**RSK-74eh**): E2E in `e2e/play-spike.spec.ts` (Backquote toggles `#rb-riskbreaker-overlay`); docs cross-linked
- [x] LICENSE: `LICENSE.playstation.txt` remains tracked for vendored upstream terms
- [x] **Build policy:** emitted **`PlayStation.js`** + **`riskbreaker-overlay-boot.js`** are **gitignored**; CI/Netlify run `build:playstation` via **`pnpm build`**. Fresh clone: `pnpm build:playstation` before `/play/spike` if artifacts absent

**Closed 2026-03-22.**

## Links

- [brainstorm](../../docs/brainstorms/playstation-js-modularize-typescript.md)
