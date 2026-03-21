---
# RSK-l7qp
title: Playable 01 — PS1 emulator core in the browser (spike)
status: todo
type: task
priority: normal
created_at: 2026-03-21T23:00:00Z
updated_at: 2026-03-21T23:00:00Z
parent: RSK-9c07
---

## Context

**Prerequisite:** mock web shell exists or can be a throwaway route (`apps/web` Harness **05** is the normal home for UI).

Goal is **not** full Riskbreaker integration yet: prove a **PlayStation emulator** can run **in the browser** (canvas/WebGL/WebAudio), with a chosen integration path (WASM build, iframe to a known-good player, or vendored core — document trade-offs).

## Goal

- Pick and document **one** approach (e.g. WASM core, EmulatorJS-style embed, or other) with **license** and **build** implications noted.
- In dev, reach **first frame / boot** (menu or title) using **developer-supplied** BIOS + disc files **not** committed to git.
- Capture **limitations** (performance, threads, Safari, mobile) in README or `docs/`.

## Acceptance Criteria

- [ ] Spike lives under `apps/web` and/or `packages/psx-runtime` with a clear **feature flag** or route (e.g. `/play/spike`) so mock flows stay the default.
- [ ] `pnpm dev` (or documented script) opens a page where the emulator **initializes** and can **attempt** boot with local files (path or file-picker — see Playable 02).
- [ ] No copyrighted assets in the repo; only placeholders and links to `bins/` conventions.
- [ ] README section: how to obtain/place BIOS and disc locally for testing (legal use only).

## Links

- Parent: `RSK-9c07`
- Next: `RSK-l7qr` (bins loading + play page)
- `project-spec.md` (psx-runtime: mock first; this task starts the real backend path)
