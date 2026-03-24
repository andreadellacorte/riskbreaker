---
# RSK-vcvj
title: wasmpsx lineage — split artifacts + WASM fork for memory access
status: cancelled
type: feature
created_at: 2026-03-22T18:23:35Z
updated_at: 2026-03-22T20:30:00Z
parent: RSK-v50c
---

## Context

User asked to verify [js-emulators/wasmpsx](https://github.com/js-emulators/wasmpsx) contains full source + build instructions, build it, and test with `e2e/fixtures/240pTestSuitePS1-EMU.bin`. Investigation shows the **wasmpsx repo is distribution-only** (min.js, worker.js, two `.wasm` files, HTML) — **no C/C++ core or Emscripten build** in-tree. “Build from scratch” requires locating the **TJWei / PCSX** lineage and an Emscripten project outside that GitHub repo.

**lrusso/PlayStation** remains the better reference for **shell** differences vs stock wasmpsx (sound, mute, layout, i18n), as documented in its README.

## Goal

Evolve Riskbreaker toward **wasmpsx-style** artifact split + **honest memory / system access** by forking or rebuilding the WASM core with explicit exports, while keeping **plugin/runtime** boundaries (`IRuntime`, no `plugins/*` in `playstation-src/`).

## Acceptance Criteria

- [x] Document upstream reality (done in `docs/playstation-engine-hacking.md` § wasmpsx).
- [ ] Spike: load **split** `wasmpsx_worker.js` + `.wasm` from `/playstation/` (no embedded worker base64) behind a feature flag or branch.
- [x] Locate or document **compile path** for worker WASM — see [`docs/playstation-engine-hacking.md` § “Where the C / Emscripten sources live”](../../docs/playstation-engine-hacking.md) (**kxkx5150/PCSX-wasm**).
- [ ] Add **postMessage** or WASM **exports** for peek/poke or savestate blob — first step toward `EmulatorRuntimeAdapter` real impl.
- [x] **E2E:** `pnpm e2e` keeps passing with `240pTestSuitePS1-EMU.bin` (GPL fixture; see `e2e/fixtures/README.md`) — verified 2026-03-22.

## Verification (2026-03-22)

- `pnpm e2e` — **4 passed** (includes PlayStation spike + 240p load path) on dev server fixture.

## Next steps (ordered)

1. **Vendored sources (done):** [`packages/pcsx-kxkx-core`](../../packages/pcsx-kxkx-core) as first-party source.
2. **Split-artifact spike:** Add optional load path for `wasmpsx_worker.js` + `.wasm` from static URLs (match [wasmpsx](https://github.com/js-emulators/wasmpsx) layout) before replacing the embedded worker in `emscripten-glue.js`.
3. **Build spike:** Prove `emcc` build from the kxkx vendor tree, document Riskbreaker-specific patches.
4. **Exports:** Expose `peek`/`poke` or savestate C API → `EMSCRIPTEN_KEEPALIVE` → worker `postMessage` bridge → `EmulatorRuntimeAdapter` in `psx-runtime`.

## Links

- [wasmpsx](https://github.com/js-emulators/wasmpsx) — artifacts
- [lrusso/PlayStation](https://github.com/lrusso/PlayStation) — bundled fork + UX deltas
- [docs/playstation-engine-hacking.md](../../docs/playstation-engine-hacking.md)
- [docs/architecture.md](../../docs/architecture.md) — runtime/plugin boundaries
- Parent epic **RSK-v50c** — PlayStation modular pipeline
