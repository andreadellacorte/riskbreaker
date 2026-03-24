# @riskbreaker/pcsx-kxkx-shell

Canonical **Riskbreaker** browser shell for PCSX-wasm (kxkx): overlay (`riskbreaker-overlay.ts`), perf HUD, runtime toggles (`riskbreaker-runtime-controls.ts`), and `__riskbreakerEmulatorHost` (`emulator-bridge.ts`). Sources live entirely under **`src/`** (no dependency on `apps/web/legacy/`).

Build output: [`apps/web/public/pcsx-kxkx/js/riskbreaker-kxkx-boot.js`](../../apps/web/public/pcsx-kxkx/js/riskbreaker-kxkx-boot.js) (IIFE), loaded from [`pcsx-kxkx/index.html`](../../apps/web/public/pcsx-kxkx/index.html).

```bash
pnpm build:pcsx-kxkx-shell   # repo root
```

`@riskbreaker/web` runs this before `vite build`.
