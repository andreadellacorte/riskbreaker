---
# RSK-l7qr
title: Playable 02 — Local `bins/` assets + play page (dev-only)
status: scrapped
type: task
priority: normal
created_at: 2026-03-21T23:00:00Z
updated_at: 2026-03-22T00:34:45Z
parent: RSK-9c07
---

## Context

Depends on **Playable 01** (`RSK-l7qp`) having a working emulator spike. **Harness 05** should provide a real Vite app shell so this can be a first-class route.

## Goal

Make **testing the game in the browser** ergonomic on a **developer machine**:

- **BIOS** and **disc image** (cue/bin, chd, iso — match what the chosen core supports) loaded from **`bins/`** via a **dev-only** mechanism (Vite `public/` symlink, `server.fs.allow`, static copy script, or **File System Access API** / file input — pick one and document).
- Clear **separation** from production builds: no ROM paths in client bundle for shipped builds; env-gated or dev-only server.
- Optional: **preset paths** for Vagrant Story layout under `bins/` (documented folder names only).

## Acceptance Criteria

- [ ] Documented layout for `bins/` (e.g. `bins/bios/`, `bins/games/vagrant-story/`) — remain **gitignored**; commit only `.gitkeep` or `README` stubs if helpful.
- [ ] Play page loads BIOS + disc from the chosen dev mechanism without manual paste each time (where technically possible).
- [ ] Security called out: dev server binds to localhost; no arbitrary path exposure in prod.
- [ ] README / `apps/web` README: exact steps from clone → place files → `pnpm dev` → play.

## Links

- Parent: `RSK-9c07`
- Depends on: `RSK-l7qp`
- Next: `RSK-l7qs` (IRuntime adapter)
- `.gitignore` (`bins/`)

## Reasons for scrapping

- Cancelled by maintainer (2026-03-22). Phase 1 playable testing is adequately covered by the file-picker flow and `/play/spike` (`RSK-l7qp` complete); separate dev-only `bins/` auto-load and server wiring are not planned for this phase.
