---
# RSK-7lri
title: PlayStation bundle — split TS modules (bootstrap, wasm, glue)
status: todo
type: task
created_at: 2026-03-22T00:47:56Z
updated_at: 2026-03-22T00:47:56Z
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

- [ ] At least bootstrap + wasm embed separated from bulk glue where practical
- [ ] **Bridge module + interface** present (stubs acceptable); **no** `plugins/` imports in `playstation-src/`
- [ ] **Documented mount point or bridge callback** for overlay attachment (full UI is **RSK-74eh**)
- [ ] No functional regression; **`pnpm e2e` passes**

## Links

- [playstation-engine-hacking.md](../../docs/playstation-engine-hacking.md)
