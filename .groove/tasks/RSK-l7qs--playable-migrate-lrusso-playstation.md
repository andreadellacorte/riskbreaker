---
# RSK-l7qs
title: Playable — migrate spike to lrusso/PlayStation (audio + maintained fork)
status: done
type: task
priority: normal
created_at: 2026-03-22T12:00:00Z
updated_at: 2026-03-22T12:00:00Z
parent: RSK-9c07
---

## Context

**RSK-l7qp** originally used **js-emulators/wasmpsx**. **RSK-l7qs** migrated **`/play/spike`** to **[lrusso/PlayStation](https://github.com/lrusso/PlayStation)** (sound, UI), vendored under `apps/web/public/playstation/`.

## Done

- `/play/spike` embeds `PlayStation.htm` in an iframe; parent file picker forwards to iframe `readFile`.
- `PlayStation.js` patched to mount on `#rb-playstation-host`.
- WASMpsx assets removed from `public/`.
- Docs + Playwright updated.

## Links

- [lrusso/PlayStation](https://github.com/lrusso/PlayStation)
- [`docs/playable-emulator-spike.md`](../../docs/playable-emulator-spike.md)
