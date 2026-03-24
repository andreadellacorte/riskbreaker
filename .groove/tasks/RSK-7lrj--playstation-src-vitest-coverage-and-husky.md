---
# RSK-7lrj
title: PlayStation bundle — Vitest coverage for playstation-src + Husky gate
status: completed
type: task
created_at: 2026-03-22T00:00:00Z
updated_at: 2026-03-22T00:00:00Z
parent: RSK-7lri
---

## Context

Follow-up to **RSK-7lri** / **RSK-v50c**: `apps/web/playstation-src` had no Vitest coverage; bridge/bootstrap behaviour was only guarded by e2e.

## Goal

- Keep **unit coverage** on the TS edge (emulator bridge, bootstrap, overlay helpers) **measured and enforced**.
- **Pre-commit** runs `pnpm test:coverage` so merges do not slip below thresholds.
- Optional future work: extend coverage to **glue** (`emscripten-glue.js`) via targeted extraction or integration tests — **do not** block on the giant file.

## Acceptance Criteria

- [x] Root **Vitest** config includes `apps/web/playstation-src/**/*.test.ts` and **v8 coverage** with thresholds on listed TS sources (wasm blob / glue excluded).
- [x] **`pnpm test:coverage`** passes and reports coverage for the PlayStation TS modules.
- [x] **Husky** `pre-commit` invokes **`pnpm test:coverage`** (fails if tests or coverage thresholds fail).
- [ ] Optional: raise branch coverage on **register-emulator-bridge** arrow branches or add a second host fixture.

## Links

- `vitest.config.mts` — `coverage.include` for `playstation-src`
- `.husky/pre-commit`
