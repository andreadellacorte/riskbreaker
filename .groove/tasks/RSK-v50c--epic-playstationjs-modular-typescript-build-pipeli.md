---
# RSK-v50c
title: 'Epic: PlayStation bundle — modular TS, telemetry, backtick Riskbreaker overlay'
status: in-progress
type: epic
priority: normal
created_at: 2026-03-22T00:47:25Z
updated_at: 2026-03-22T01:06:50Z
---

## Context

Tracks [docs/brainstorms/playstation-js-modularize-typescript.md](../../docs/brainstorms/playstation-js-modularize-typescript.md): maintainable sources, TypeScript where it helps, compile to `apps/web/public/playstation/`, opt-in debug telemetry.

**Constraint:** `pnpm e2e` must keep passing as child tasks land (especially `e2e/play-spike.spec.ts`).

Related program epic: **RSK-9c07** (not a beans parent — epics cannot nest under epics in this backend).

## Goal

Replace the monolithic hand-edited `PlayStation.js` with a built artifact from typed modules without breaking `/play/spike` or Playwright.

**North-star spike (validates 1↔2 in product terms):** While playing a PS1 title in the vendored shell, press **`** (backtick — Doom-style) to **toggle** a **Riskbreaker overlay** (shadcn-aligned UI) **on top of** the emulator canvas — same document, not a navigation away. Deliberate **v1** scope: placeholder content and host wiring are OK; full plugin/session plumbing is **not** required to close the epic. Tracked as **RSK-74eh**.

### Architecture: layer 2 ↔ 3 ↔ 4

Stack (conceptual): **browser shell (1)** → **PlayStation bundle (2)** → **plugins (3)** → **platform packages (4)**.

**Assumption — plugins ↔ platform (3↔4):** Already covered by existing contracts (`plugin-sdk`, `SessionOrchestrator`, decoders on `RuntimeSnapshot` / decoded state). **This epic does not redesign 3↔4.**

**Requirement — emulator (2) must evolve at the edges:** Full integration is **not** “glue 4 to 3 and hope the static blob cooperates.” We **will** modify **2** at **boundaries only** — typed modules, callbacks, or a small **host registration API** — so a future **host adapter** can move data **2 → browser → 4** (then **3** decoders run on platform types). **No** `plugins/*` imports inside `playstation-src/` or inside the emitted `PlayStation.js`.

**How 2 will work with 3 (spec):**

| Rule | Detail |
|------|--------|
| **Isolation** | WASM / Emscripten core stays upstream-shaped; **no** game-specific or plugin code inside the bundle. |
| **Bridge** | **RSK-7lri** adds **named hook points** (e.g. `registerRiskbreakerHost` / `window.__riskbreakerEmulatorHost`) with a **minimal TypeScript interface**: lifecycle (e.g. booted, frame tick, pause), and **optional stubs** for snapshot/export until `EmulatorRuntimeAdapter` lands in `packages/psx-runtime`. |
| **Data path** | Plugins see **only** data that has crossed into **4** (decoded state, commands). The bundle may emit **raw-ish** events to the host; **translation to `RuntimeSnapshot`** is **platform** code, not plugin code. |
| **Follow-up** | Wire host → `SessionOrchestrator` / `IRuntime` in a **separate** task or epic (e.g. Playable 03 / emulator adapter) — **after** hook points exist. |

## Links

- [docs/playstation-engine-hacking.md](../../docs/playstation-engine-hacking.md)



### Suggested task order

1. **RSK-fye3** — build pipeline (foundation; E2E gate).
2. **RSK-7lri** — modular split + emulator **bridge** (2↔3↔4 edges).
3. **RSK-74eh** — **backtick → shadcn overlay** spike (depends on having a maintainable bundle / mount point — often lands after **7lri** starts; can parallelise late **fye3** if bridge hooks exist).
4. **RSK-xfc8** — dev telemetry (can overlap **7lri** / **74eh**).
5. **RSK-wquv** — docs / LICENSE / CI / architecture narrative last.

**Children:** **RSK-fye3**, **RSK-7lri**, **RSK-74eh**, **RSK-xfc8**, **RSK-wquv**.



### Plan (2026-03-22)

- Doc: [docs/plans/rsk-v50c-playstation-bundle.md](../../docs/plans/rsk-v50c-playstation-bundle.md)
- Stage task: **RSK-483p** (`2026-03-22, Plan`)
