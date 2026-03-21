---
# RSK-l7qs
title: Playable — migrate spike to lrusso/PlayStation (audio + maintained fork)
status: todo
type: task
priority: normal
created_at: 2026-03-22T12:00:00Z
updated_at: 2026-03-22T12:00:00Z
parent: RSK-9c07
---

## Context

**RSK-l7qp** vendors **js-emulators/wasmpsx** (MIT) at `/play/spike`. Upstream often has **no browser audio** and minimal maintenance.

**[lrusso/PlayStation](https://github.com/lrusso/PlayStation)** is a fork that builds on the same family, advertises **working sound**, mute/unmute, and UI polish — better candidate once the spike path is proven.

## Goal

- Replace or sit alongside WASMpsx assets with **lrusso/PlayStation** build output (respect its **license** — verify before vendoring).
- Keep route **`/play/spike`** (or document rename) and **file-picker** flow; document BIOS / `.cue` behaviour.
- **Netlify / Vite:** ensure headers (COOP/COEP, CORP) still work for WASM + workers after migration.

## Acceptance Criteria

- [ ] `/play/spike` runs the new bundle; smoke: pick a legal test image and reach **boot or in-game** with **audible** output in Chromium (headphones on).
- [ ] Docs updated: [`docs/playable-emulator-spike.md`](../../docs/playable-emulator-spike.md) + README pointers.
- [ ] Old wasmpsx bundle removed or clearly secondary to avoid duplicate MB in `public/`.

## Links

- [lrusso/PlayStation](https://github.com/lrusso/PlayStation) — README + releases
- Current spike: [`docs/playable-emulator-spike.md`](../../docs/playable-emulator-spike.md)
- Parent: `RSK-9c07`
