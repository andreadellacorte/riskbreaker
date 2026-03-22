# `playstation-src/`

Source layout for the vendored **lrusso/PlayStation** browser bundle (**RSK-7lri**).

| File / directory | Role |
| ---------------- | ---- |
| **`entry.ts`** | esbuild entry: init → Emscripten glue → `window.__riskbreakerEmulatorHost` registration. |
| **`wasm-embed.ts`** | `WASM_FILE` data URL (Prettier-ignored; huge line). |
| **`riskbreaker-bootstrap.ts`** | `#rb-playstation-host`, shadow DOM, `styleCustomText` (from `PlayStation.htm`). |
| **`playstation-init.ts`** | Assigns `WASM_FILE` + bootstrap globals on `globalThis` before glue runs. |
| **`emulator-bridge.ts`** | `RiskbreakerEmulatorHost` + `registerRiskbreakerEmulatorHost` (overlay / RSK-74eh mount). |
| **`register-emulator-bridge.ts`** | Registers host with canvas + `WASMpsx` accessors. |
| **`riskbreaker-overlay.ts`** | Spike overlay (`?riskbreaker=1`): Backquote toggle, tokens aligned with `apps/web/src/index.css`. |
| **`riskbreaker-overlay-boot.ts`** | Early IIFE entry: `PlayStation.htm` loads this before disc pick so overlay works without `PlayStation.js`. |
| **`emscripten-glue.js`** | Emscripten / PCSX bulk (Prettier-ignored). |
| **`shims/*.cjs`** | Stub `fs` / `path` / `crypto` for esbuild browser bundle (Node-only glue is dead in browser). |

Build: **`pnpm build:playstation`** (repo root) → `apps/web/public/playstation/PlayStation.js` and **`riskbreaker-overlay-boot.js`** (injected from `PlayStation.htm` when `riskbreaker=1`). **`pnpm --filter @riskbreaker/web build`** runs this automatically before **`vite build`**.

See [`docs/playstation-engine-hacking.md`](../../../docs/playstation-engine-hacking.md) and epic **RSK-v50c**.
