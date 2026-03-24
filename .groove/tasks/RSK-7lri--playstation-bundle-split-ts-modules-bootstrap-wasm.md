---
# RSK-7lri
title: PlayStation bundle — split TS modules (bootstrap, wasm, glue)
status: in-progress
type: task
created_at: 2026-03-22T00:47:56Z
updated_at: 2026-03-22T14:00:00Z
parent: RSK-v50c
---

## Context

Child of **RSK-v50c**. After build works, split monolith into modules: Riskbreaker bootstrap (shadow DOM, `#rb-playstation-host`), WASM embed constant, Emscripten `Module` glue (can stay thinly typed / side-effect imports).

**2 ↔ 3 (emulator ↔ plugins):** This task is where we **evolve the bundle at the edges**. **Do not** import `plugins/*` from `playstation-src/`. Add a **single bridge module** (name TBD, e.g. `emulator-bridge.ts`) that:

- Declares a **minimal `RiskbreakerEmulatorHost` (or similar) interface** — lifecycle and optional future snapshot/export hooks (**stubs OK**).
- **Registers** with the glue (e.g. `registerRiskbreakerHost` or `window.__riskbreakerEmulatorHost = …`) so **`apps/web`** / a future `EmulatorRuntimeAdapter` can subscribe **without** plugins touching WASM.
- Documents in a short comment or `README` in `playstation-src/` how data flows **2 → host → `packages/*` → plugin decoders** (plugins never import **2**).

**3 ↔ 4** is assumed already defined elsewhere; this task only **prepares 2** for that pipeline.

**1 ↔ 2 (overlay):** Reserve a **stable mount point** (e.g. container sibling to `#rb-playstation-host` or host-exposed hook) so **RSK-74eh** can attach the **backtick** shadcn overlay without fighting shadow-DOM / z-index blind. Document in `playstation-src/README` or comments.

## Goal

Readable TS structure; incremental PRs; still one output file for static hosting; **typed edge** for Riskbreaker ↔ emulator integration; **hooks** for in-game **Riskbreaker chrome** (overlay).

## Acceptance Criteria

- [x] At least bootstrap + wasm embed separated from bulk glue where practical
- [x] **Bridge module + interface** present; **no** `plugins/` imports in `playstation-src/`
- [x] **Documented mount point / bridge** for overlay (**RSK-74eh**)
- [x] No functional regression; **`pnpm e2e` passes**

**Remaining (optional hardening):** thinner typing for glue, more tests, telemetry / perf HUD hooks (**RSK-xfc8** epic — **RSK-n8wk**, **RSK-p4jm**). Task left **in-progress** until unit-test pass and any follow-up splits are explicitly closed or spun out.

## Links

- [playstation-engine-hacking.md](../../docs/playstation-engine-hacking.md)

## Progress (2026-03-22)

| Area | Status |
|------|--------|
| **Entry** | [x] `entry.ts` wires `playstation-init`, `emscripten-glue`, `register-emulator-bridge` |
| **Bootstrap / WASM** | [x] `riskbreaker-bootstrap.ts`, `wasm-embed.ts` split from early monolith |
| **Glue** | [~] `emscripten-glue.js` still large (upstream-shaped); further splits optional |
| **Bridge + `RiskbreakerEmulatorHost`** | [x] `emulator-bridge.ts` + `register-emulator-bridge.ts`; **`registerRiskbreakerEmulatorHost`** on `window` |
| **Overlay mount** | [x] RSK-74eh consumes host; stable overlay container for backtick UI |
| **`pnpm e2e`** | [x] Green |

**Pause / next:** **RSK-7lrj** covers Vitest coverage + Husky pre-commit for `playstation-src`. Further optional work: glue typing/tests, telemetry (**RSK-xfc8**).
