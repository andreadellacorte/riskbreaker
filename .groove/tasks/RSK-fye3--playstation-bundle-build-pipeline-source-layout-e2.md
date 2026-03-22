---
# RSK-fye3
title: PlayStation bundle — build pipeline + source layout (E2E green)
status: completed
type: task
priority: normal
created_at: 2026-03-22T00:47:56Z
updated_at: 2026-03-22T01:16:46Z
parent: RSK-v50c
---

## Context

Child of **RSK-v50c**. First vertical slice: source directory (e.g. `apps/web/playstation-src/` or small package), bundler (esbuild or Vite lib per brainstorm), `pnpm` script producing `apps/web/public/playstation/PlayStation.js` consumed by `PlayStation.htm`.

Lay out **`playstation-src/`** so **RSK-7lri** can add an **`emulator-bridge`** (or equivalent) module **without** reshuffling the whole tree — see epic **2↔3** architecture notes on **RSK-v50c**.

## Goal

Single reproducible build command; **no behaviour change** vs current bundle for default path (WASM `data:` URI preserved in v1). Output must remain the **single script** consumed by `PlayStation.htm` so follow-on tasks (**RSK-7lri**, **RSK-74eh** overlay) can ship incrementally.

## Acceptance Criteria

- [x] `pnpm` script documents and builds PlayStation bundle into `public/playstation/`
- [x] Root or `apps/web` README notes how to rebuild
- [x] Source tree supports **adding** overlay / bridge files **without** renaming the public entrypoint contract (`PlayStation.js` URL unchanged unless intentionally versioned later)
- [x] **`pnpm e2e` passes** (play-spike + rest of suite)

## Links

- [brainstorm](../../docs/brainstorms/playstation-js-modularize-typescript.md)


## Summary of Changes

- Added [`apps/web/playstation-src/`](apps/web/playstation-src/README.md): canonical **`playstation-bundle.js`** (copy of prior `public/playstation/PlayStation.js`), **`entry.ts`** placeholder, **`tsconfig.json`**, README.
- Added [`scripts/build-playstation.mjs`](scripts/build-playstation.mjs): copies source → `public/playstation/PlayStation.js` (esbuild reprints the legacy file; **RSK-7lri** will switch to esbuild bundling from TS).
- Root **`pnpm build:playstation`**; **`pnpm format:playstation`** also formats `playstation-bundle.js`.
- Documented in [`apps/web/README.md`](apps/web/README.md), [`docs/playstation-engine-hacking.md`](docs/playstation-engine-hacking.md).
- **`pnpm typecheck`** / **`pnpm e2e`** green.
