# Playable spike — browser PS1 emulator (RSK-l7qp)

This documents the **Phase 1 spike** that proves a PlayStation-class emulator can run **in the browser** alongside the Riskbreaker app shell — **without** wiring the emulator into `psx-runtime` yet.

## Chosen approach: PCSX-wasm (kxkx5150)

The canonical spike is **[kxkx5150/PCSX-wasm](https://github.com/kxkx5150/PCSX-wasm)** artifacts, synced into [`apps/web/public/pcsx-wasm/`](../apps/web/public/pcsx-wasm/) via **`pnpm sync:pcsx-wasm`** (after building the vendored core at [`packages/pcsx-wasm-core/`](../packages/pcsx-wasm-core/)). **GPL-3.0**.

The **Riskbreaker** overlay + runtime menu (backtick panel) is implemented in **`packages/pcsx-wasm-shell/src/`** and built into **`public/pcsx-wasm/js/riskbreaker-pcsx-wasm-boot.js`** (`pnpm build:pcsx-wasm-shell`).

| Topic           | Notes |
| --------------- | ----- |
| **Integration** | [`/play/spike`](../apps/web/src/PlaySpikePage.tsx) and **`/`** use **`window.location.replace`** to **`/pcsx-wasm/index.html?riskbreaker=1`** — static HTML + worker WASM (no iframe). |
| **Canvas**      | Main canvas is **`#canvas`** (no `shadowRoot` / `#rb-playstation-host` — that was the **retired** legacy shell). |
| **Trade-offs**  | Worker-based PCSX; **speed hack / upscale** toggles in the overlay are **best-effort** until the fork exposes stable `postMessage` config. |

## UI route

- **`/`** and **`/play/spike`** — **redirect** to **`/pcsx-wasm/index.html?riskbreaker=1`**.
- **Direct URL (dev):** `http://localhost:5173/pcsx-wasm/index.html?riskbreaker=1` — **Deployed:** Netlify redirects **`/`** → **`/pcsx-wasm/index.html`** (302) — see [`netlify.toml`](../netlify.toml).

The emulator shell accepts **`.cue`**, **`.bin`**, **`.iso`**, etc. via the file input (see `index.html`).

## BIOS and disc files (legal)

- **Do not commit** BIOS dumps, disc images, or ROMs to git. Use a local **`bins/`** directory (gitignored per repo conventions).
- You must only use files you **own or have the right to use** for testing (e.g. dumps you created from media you own).
- Typical PS1 BIOS filenames are often named like `SCPH-1001.BIN` (region-dependent). Follow upstream / core behavior.

## Limitations (expect these)

- **Performance:** WASM + audio can stutter; mobile Safari is especially variable.
- **Safari / Firefox:** WebGL and audio policies differ; test on Chromium first.
- **Security:** file input only reads **what you choose**; nothing is uploaded by this scaffold.
- **Browser console noise:** `The AudioContext was not allowed to start` can appear until a **user gesture** (click / key). **`chrome-extension://… ERR_FILE_NOT_FOUND`** is from a **browser extension**, not this app.

## Automated smoke test (Playwright)

[`e2e/play-spike.spec.ts`](../e2e/play-spike.spec.ts):

1. **Shell smoke:** loads **`/play/spike`**, waits for **`/pcsx-wasm/index.html?riskbreaker=1`**, asserts **GitHub** chrome + hidden file input **`#iso_opener`**.
2. **Full emulator path:** **`setInputFiles`** the GPL-2.0 homebrew **`.bin`** (`e2e/fixtures/240pTestSuitePS1-EMU.bin` or **`E2E_PS1_DISC_BIN`**), expects upload UI to hide, asserts **`canvas#canvas`** and **no uncaught page errors**.

Optional: **`E2E_PS1_DISC_BIN`** points at another `.bin` on disk without committing it.

Run: **`pnpm e2e`**.

## Troubleshooting `/play/spike`

| Symptom                                 | What to try |
| --------------------------------------- | ----------- |
| **Redirect doesn’t run**                | Ensure **JavaScript** is on; **hard-refresh** `/play/spike`. Open **`/pcsx-wasm/index.html?riskbreaker=1`** manually. |
| **Missing overlay script**              | Run **`pnpm build:pcsx-wasm-shell`** so `riskbreaker-pcsx-wasm-boot.js` exists. |
| `Could not load CD-ROM!` (core)        | Wrong or unreadable image for PCSX; try another rip or format. |
| **No sound**                            | Click **inside the page** once (user gesture), use system volume. |
| **Keys / pad do nothing**               | **Click the game view** so the document has focus. |
| **Still stuck**                         | Open devtools **Console** for worker/WASM errors; try **Chromium**. Vite sets **COOP/COEP** headers — if something breaks, we can narrow headers. |

## Related

- [`docs/architecture.md`](./architecture.md) — platform boundaries (emulator is **not** integrated with engines in this spike).
- [`packages/pcsx-wasm-core/README.md`](../packages/pcsx-wasm-core/README.md) — PCSX-wasm core source and upstream notes.
