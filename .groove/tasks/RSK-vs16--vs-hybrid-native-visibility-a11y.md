---
# RSK-vs16
title: VS remaster — hybrid mode (native visibility) + a11y + intl polish
status: todo
type: task
priority: normal
created_at: 2026-03-22T16:00:00Z
updated_at: 2026-03-22T16:00:00Z
parent: RSK-uxvs
---

## Context

Child of **RSK-uxvs**. Late-phase polish once **RSK-vs11–15** prove value: decide when to **dim**, **hide**, or **leave** native menu chrome; **screen-reader** and **keyboard** paths for Riskbreaker panels; **non-US** keyboard layouts for **backtick** / menu hotkeys (**RSK-74eh** overlap).

## Goal

- **Product rules:** When Riskbreaker owns a surface, what happens to **native** UI (overlay, opacity, pause game? — align with **RSK-74eh** focus notes).
- **A11y:** WCAG-oriented pass on new UI; document gaps.
- **Intl:** Document **Triangle** vs keyboard layout; touch-first assumptions.

## Acceptance Criteria

- [ ] **Written hybrid policy** in `docs/` linked from epic
- [ ] **Issues** filed for known a11y / intl debt
- [ ] Smoke **E2E** for one locale or keyboard path if feasible

## Links

- Parent: **RSK-uxvs**
- Depends on: **RSK-vs11** (at least one panel shipped)
- Related: **RSK-74eh**, **RSK-xfc8** epic (telemetry + perf HUD + menu toggles — **RSK-n8wk**, **RSK-p4jm**)
