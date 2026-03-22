# Playable spike — browser PS1 emulator (RSK-l7qp)

This documents the **Phase 1 spike** that proves a PlayStation-class emulator can run **in the browser** alongside the Riskbreaker mock shell — **without** wiring the emulator into `psx-runtime` yet.

## Chosen approach: lrusso/PlayStation (WASM, WASMpsx lineage)

We vendor **[lrusso/PlayStation](https://github.com/lrusso/PlayStation)** under [`apps/web/public/playstation/`](../apps/web/public/playstation/) — `PlayStation.htm`, **`PlayStation.js`** (WASM embedded as a `data:` URI + worker bootstrap), and [`LICENSE.playstation.txt`](../apps/web/public/playstation/LICENSE.playstation.txt). Upstream improves on [js-emulators/wasmpsx](https://github.com/js-emulators/wasmpsx) with **working sound**, mute/unmute, and UI polish.

| Topic           | Notes                                                                                                                                                                          |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Upstream**    | [lrusso/PlayStation](https://github.com/lrusso/PlayStation) — based on WASMpsx; no separate repo `LICENSE` file (see bundled notice).                                          |
| **Integration** | [`/play/spike`](../apps/web/src/PlaySpikePage.tsx) is **full-viewport** (thin top bar + iframe) like [lrusso.github.io](https://lrusso.github.io/PlayStation/PlayStation.htm). |
| **Patch**       | `PlayStation.js` mounts on **`#rb-playstation-host`**; `PlayStation.htm` includes extra CSS so **Upload / HUD** stay above the game plane in an iframe.                        |
| **Trade-offs**  | Large single JS payload (~1.3 MB); Web Audio policies vary; not “accuracy first” like DuckStation.                                                                             |

## UI route

- **Default mock shell:** [`/`](../apps/web/src/MockShellPage.tsx) — unchanged vertical slice.
- **Spike:** [`/play/spike`](../apps/web/src/PlaySpikePage.tsx) — **full-screen iframe** (same shell as upstream); only the in-frame **Upload** loads a `.bin`.

The upstream shell only accepts **`.bin`** in its validator (see [author demo](https://lrusso.github.io/PlayStation/PlayStation.htm)).

## BIOS and disc files (legal)

- **Do not commit** BIOS dumps, disc images, or ROMs to git. Use a local **`bins/`** directory (gitignored per repo conventions).
- You must only use files you **own or have the right to use** for testing (e.g. dumps you created from media you own).
- Typical PS1 BIOS filenames are often named like `SCPH-1001.BIN` (region-dependent). The spike does not automate BIOS paths yet — follow upstream behavior.

## Limitations (expect these)

- **Performance:** WASM + audio can stutter; mobile Safari is especially variable.
- **Safari / Firefox:** WebGL and audio policies differ; test on Chromium first.
- **Security:** file input only reads **what you choose**; nothing is uploaded by this scaffold.
- **`.cue` vs `.bin`:** The vendored UI validates **`.bin`** only. Multi-file cue + tracks would need a dedicated loader later.
- **Browser console noise:** `The AudioContext was not allowed to start` can appear until a **user gesture** (click / key). **`chrome-extension://… ERR_FILE_NOT_FOUND`** is from a **browser extension**, not this app.

## Automated smoke test (Playwright)

[`e2e/play-spike.spec.ts`](../e2e/play-spike.spec.ts):

1. Loads **`/play/spike`**, waits for **`/playstation/PlayStation.htm`**, asserts **“Playable spike — Ready”** + hidden **`#gui_controls_file`** inside the frame.
2. **`setInputFiles`** a committed **GPL-2.0** homebrew **`.bin`** ([`e2e/fixtures/240pTestSuitePS1-EMU.bin`](../e2e/fixtures/240pTestSuitePS1-EMU.bin)) and asserts a **`canvas`** appears under **`#rb-playstation-host`** in the iframe (disc layer + WASM initialized).

Optional: **`E2E_PS1_DISC_BIN`** points at another `.bin` on disk without committing it.

Run: **`pnpm e2e`**.

## Troubleshooting `/play/spike`

| Symptom                                 | What to try                                                                                                                                                                                                                                      |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Iframe blank / failed to load**       | DevTools **Network** → `PlayStation.htm` / `PlayStation.js` (JS loads **after** you pick a valid `.bin`). Hard-refresh.                                                                                                                          |
| **`Could not load CD-ROM!` (upstream)** | Wrong or unreadable image for PCSX; try another **`.bin`**, BIOS, or rip.                                                                                                                                                                        |
| **No sound**                            | Click **inside the iframe** once (user gesture), use the **speaker** control in-frame, and check system volume.                                                                                                                                  |
| **Keys / pad do nothing**               | **Click the game view** so the iframe has focus (not the Riskbreaker page). We removed a duplicate file picker that kept focus on the parent; the shell also calls **`window.focus()`** after boot.                                              |
| **Red Upload not clickable**            | The **`#rb-playstation-host`** shadow root was still winning hit-tests over the HUD. We set **`pointer-events: none`** on the host and **`auto`** on the canvas + HUD (see `riskbreaker-spike-embed` in `PlayStation.htm` and `PlayStation.js`). |
| **No separate “Play” button**           | Normal — choosing a **`.bin`** runs the game via upstream **`readFile`**.                                                                                                                                                                        |
| **Still stuck**                         | Open devtools **Console** for worker/WASM errors; try **Chromium**. Vite sets **COOP/COEP** headers — if something breaks, we can narrow headers.                                                                                                |

## Related

- [`docs/architecture.md`](./architecture.md) — platform boundaries (emulator is **not** integrated with engines in this spike).
- Next bean: **RSK-l7qr** (bins loading + dedicated play page) — refine UX and integration seams.
