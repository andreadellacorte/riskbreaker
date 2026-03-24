# @riskbreaker/pcsx-wasm-shell

Canonical **Riskbreaker** browser shell for PCSX-wasm: overlay (`riskbreaker-overlay.ts`), perf HUD, runtime toggles (`riskbreaker-runtime-controls.ts`), and `__riskbreakerEmulatorHost` (`emulator-bridge.ts`). Sources live entirely under **`src/`** (no dependency on `apps/web/legacy/`).

Build output: [`apps/web/public/pcsx-wasm/js/riskbreaker-pcsx-wasm-boot.js`](../../apps/web/public/pcsx-wasm/js/riskbreaker-pcsx-wasm-boot.js) (IIFE), loaded from [`pcsx-wasm/index.html`](../../apps/web/public/pcsx-wasm/index.html).

```bash
pnpm build:pcsx-wasm-shell   # repo root
```

`@riskbreaker/web` runs this before `vite build`.
