---
# RSK-vs10
title: VS remaster — menu topology + RAM / feasibility research
status: completed
type: task
priority: normal
created_at: 2026-03-22T16:00:00Z
updated_at: 2026-03-22T16:00:00Z
parent: RSK-uxvs
---

## Context

Child of **RSK-uxvs**. Before engineering commits to **RAM hooks** or **menu detection**, capture **what is known** about Vagrant Story’s **Triangle → Item → sub-menus** flow, **existing community reverse-engineering** (addresses, save formats), and **gaps**. Output is a **short internal doc** under `docs/` or `plugins/vagrant-story/` so **RSK-vs12** / **RSK-vs13** scope stays honest.

**Can run in parallel** with **RSK-l7qs** (runtime adapter).

## Goal

- Map **menu layers** (first Triangle screen → Item → Equip / Use / …) at **player-observable** level (screenshots + labels), not full decompilation.
- List **candidate data sources**: save-state layout, known RAM maps, emulator hooks — with **confidence** (confirmed / speculative / unknown).
- Record **risks**: frame timing, anti-tamper, undiscovered state machines.

## Acceptance Criteria

- [x] **Doc committed** — [`docs/vagrant-story-menu-research.md`](../../docs/vagrant-story-menu-research.md) (Mermaid + bullets)
- [x] **References** linked (TCRF, Fandom, GameFAQs) — no long copyrighted excerpts
- [x] **Unknowns** section for **RSK-vs12** / **RSK-vs13**
- [x] Epic **RSK-uxvs** links to this doc

## Links

- Parent: **RSK-uxvs**
- Feeds: **RSK-vs12**, **RSK-vs13**
- Early reference (starting usable items + screenshot): [vagrant-story-inventory-reference.md](../../docs/vagrant-story-inventory-reference.md)
