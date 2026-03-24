---
# RSK-vs13
title: VS remaster — input bridge (web action → game / menu progression)
status: todo
type: task
priority: normal
created_at: 2026-03-22T16:00:00Z
updated_at: 2026-03-22T16:00:00Z
parent: RSK-uxvs
---

## Context

Child of **RSK-uxvs**. **Highest-risk** slice: map **one** concrete **Riskbreaker** UI action to **in-game** behaviour (e.g. select item row → same effect as native “confirm” on first Item screen, or inject pad events through emulator API). Scope **minimal** — prove **control path**, not full menu automation.

**Depends on** a stable **read** path (**RSK-vs12**) so the UI does not fight stale state; **RSK-vs10** should list **input** options (pad vs memory vs unsupported).

## Goal

- Choose **one** action + **one** mapping strategy; document **security / flakiness** (timing, focus).
- **Feature flag** everything; default path unchanged for players not opting in.

## Acceptance Criteria

- [ ] **One** end-to-end user flow: web control → visible game response (documented video or E2E step)
- [ ] **Failure modes** documented (wrong menu state, desync)
- [ ] No broad “macro” automation — **narrow** scope
- [ ] **`pnpm typecheck` / `pnpm test`** green

## Links

- Parent: **RSK-uxvs**
- Depends on: **RSK-vs12** (strongly recommended), **RSK-vs10**
- Precedes: **RSK-vs14**, **RSK-vs15**
