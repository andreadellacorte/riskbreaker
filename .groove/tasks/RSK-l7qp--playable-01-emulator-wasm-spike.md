---
# RSK-l7qp
title: Playable 01 — PS1 emulator core in the browser (spike)
status: completed
type: task
priority: normal
created_at: 2026-03-21T23:00:00Z
updated_at: 2026-03-22T11:00:00Z
parent: RSK-9c07
---

## Context

**Prerequisite:** mock web shell exists (`apps/web`). Goal was **not** full Riskbreaker integration: prove a **PlayStation emulator** can run **in the browser** (canvas/WebGL/WebAudio), document approach and limitations.

## Goal

- Pick and document **one** approach with **license** and **build** implications noted.
- In dev, reach **initialization** and **attempt** boot with **developer-supplied** BIOS + disc files **not** committed to git.
- Capture **limitations** (performance, threads, Safari, mobile) in README or `docs/`.

## Acceptance Criteria

- [x] Spike lives under `apps/web` with a clear **route** `/play/spike` so mock flows stay the default.
- [x] `pnpm dev` opens a page where the emulator **initializes** and can **attempt** boot with local files (file-picker + upstream `readFile`).
- [x] No copyrighted assets in the repo; PlayStation bundle is vendored with notice; BIOS/disc only via local `bins/` + picker.
- [x] README + [`docs/playable-emulator-spike.md`](../../docs/playable-emulator-spike.md): obtain/place BIOS and disc locally (legal use only).

## Delivered

- **lrusso/PlayStation** vendored under [`apps/web/public/playstation/`](../../apps/web/public/playstation/) (see `LICENSE.playstation.txt`). Supersedes earlier WASMpsx-only spike.
- [`apps/web/src/PlaySpikePage.tsx`](../../apps/web/src/PlaySpikePage.tsx), [`MockShellPage.tsx`](../../apps/web/src/MockShellPage.tsx), `react-router-dom` routes.
- [`docs/playable-emulator-spike.md`](../../docs/playable-emulator-spike.md) — approach, trade-offs, limitations, legal.
- Root README + [`docs/architecture.md`](../../docs/architecture.md) cross-links.

## Links

- Parent: `RSK-9c07`
- Next: `RSK-l7qr` (bins loading + play page)
- `project-spec.md` (psx-runtime: mock first; this task starts the real backend path)
