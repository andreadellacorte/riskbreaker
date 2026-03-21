# Playable spike — browser PS1 emulator (RSK-l7qp)

This documents the **Phase 1 spike** that proves a PlayStation-class emulator can run **in the browser** alongside the Riskbreaker mock shell — **without** wiring the emulator into `psx-runtime` yet.

## Chosen approach: WASMpsx (MIT)

We vendor the **WASMpsx** release bundle under [`apps/web/public/wasmpsx/`](../apps/web/public/wasmpsx/) — `wasmpsx.min.js`, `wasmpsx_worker.js`, **`wasmpsx_ww.wasm`**, **`wasmpsx_worker.wasm`** (see `LICENSE.wasmpsx.txt`). The minified main script is patched to use **absolute** `/wasmpsx/…` URLs so assets load correctly from nested routes like `/play/spike`.

| Topic                                       | Notes                                                                                                         |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Upstream**                                | [js-emulators/wasmpsx](https://github.com/js-emulators/wasmpsx) (fork of TJWei’s emulator; MIT in this tree). |
| **Why not EmulatorJS / RetroArch web here** | Larger embed surface, different licensing and build story; WASMpsx is a small, self-contained spike.          |
| **Trade-offs**                              | Older codebase; Web Audio / WebGL behavior varies by browser; not “accuracy first” like DuckStation.          |

## UI route

- **Default mock shell:** [`/`](../apps/web/src/MockShellPage.tsx) — unchanged vertical slice.
- **Spike:** [`/play/spike`](../apps/web/src/PlaySpikePage.tsx) — loads `wasmpsx.min.js`, mounts `<wasmpsx-player>`, exposes a **file input** that calls the upstream `readFile` API on a disc image you select locally.

## BIOS and disc files (legal)

- **Do not commit** BIOS dumps, disc images, or ROMs to git. Use a local **`bins/`** directory (gitignored per repo conventions).
- You must only use files you **own or have the right to use** for testing (e.g. dumps you created from media you own).
- Typical PS1 BIOS filenames are often named like `SCPH-1001.BIN` (region-dependent). The spike does not automate BIOS paths yet; WASMpsx may require BIOS depending on build — follow upstream behavior and adjust in Playable 02 if needed.

## Limitations (expect these)

- **Performance:** WASM + main-thread audio can stutter; mobile Safari is especially variable.
- **Threads:** worker-backed WASM (`wasmpsx_worker.js` / `.wasm`) still depends on browser scheduling; background throttling affects tab-in-background.
- **Safari / Firefox:** WebGL and audio policies differ; test on Chromium first.
- **Security:** file input only reads **what you choose**; nothing is uploaded by this scaffold.
- **Audio:** upstream WASMpsx typically has **no working SPU / BGM output** in the browser — not something this spike can “switch on”; it matches the [official demo](https://js-emulators.github.io/wasmpsx/). **Sound** is the main reason for Groove bean **RSK-l7qs** (migrate toward **[lrusso/PlayStation](https://github.com/lrusso/PlayStation)**).
- **`.cue` vs `.bin`:** With a plain file picker, only **one** path is passed through. A **`.cue`** that references other files usually **cannot** resolve those tracks in this flow, so a single **`.bin`** or **`.iso`** often works better here. Multi-file cue handling would need a dedicated loader later.
- **If you pick only a `.cue`:** WASMpsx may log **`Loaded CD Image: …cuespuopen`** then **`Could not load CD-ROM!`** — the cue text is in memory, but the **referenced track files** (e.g. `…(USA).bin`) are **not** on the emulated filesystem, so the CD layer reads zeros / fails. That is expected until we add multi-file upload or a merged image.
- **Browser console noise:** `The AudioContext was not allowed to start` is normal until a **user gesture** (click / key); WASMpsx may still run without audible output. **`chrome-extension://… ERR_FILE_NOT_FOUND`** is from a **browser extension**, not this app.

## Automated smoke test (Playwright)

[`e2e/play-spike.spec.ts`](../e2e/play-spike.spec.ts) loads **`/play/spike`**, waits for **`/wasmpsx/wasmpsx_ww.wasm`**, and asserts the **“WASMpsx loaded”** status and an enabled file input. It does **not** ship or load disc images (legal + CI). Run: **`pnpm e2e`**.

## Troubleshooting `/play/spike`

| Symptom                                                               | What to try                                                                                                                                                                                                                                                                                                                                  |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`CompileError` / wrong WASM “magic word” (`3c 21 64 6f` = `<!do`)** | The browser got **HTML** (usually Vite’s index) instead of a `.wasm` file: missing binaries under `public/wasmpsx/`, or **relative** asset URLs resolved from `/play/spike` to `/play/*.wasm`. This repo vendors **`wasmpsx_ww.wasm`** and **`wasmpsx_worker.wasm`** and patches **`wasmpsx.min.js`** to load **`/wasmpsx/...`** absolutely. |
| **`Could not load CD-ROM!` after picking a `.cue`**                   | The cue loaded, but **track files** it points to are missing in the emulated FS (see limitation above). Use a single **`.bin`** / **`.iso`**, or a future multi-file flow.                                                                                                                                                                   |
| **Tiny black box / nothing after picking a file**                     | The bundle binds to the `wasmpsx-player` node present when `wasmpsx.min.js` runs; the app **defers** script load to survive React 18 Strict Mode. **Hard-refresh** once. Try a single **`.bin`** / **`.iso`** if **`.cue`** does nothing (see `.cue` limitation above).                                                                      |
| **No sound**                                                          | **Expected** for WASMpsx in the browser. Track **RSK-l7qs** (lrusso/PlayStation) for an audio-capable path.                                                                                                                                                                                                                                  |
| **No separate “Play” button**                                         | Normal — choosing a file calls upstream **`readFile`** immediately ([upstream usage](https://js-emulators.github.io/wasmpsx/)).                                                                                                                                                                                                              |
| **Still stuck**                                                       | Open devtools **Console** for worker/WASM errors; try **Chromium**. Vite sets **COOP/COEP** headers to help `crossOriginIsolated` / pthreads — if something breaks, we can narrow headers.                                                                                                                                                   |

## Related

- [`docs/architecture.md`](./architecture.md) — platform boundaries (emulator is **not** integrated with engines in this spike).
- Next bean: **RSK-l7qr** (bins loading + dedicated play page) — refine UX and integration seams.
