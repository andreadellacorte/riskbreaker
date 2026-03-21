---
# RSK-9nf7
title: Netlify — connect repo, first production deploy
status: todo
type: task
priority: normal
created_at: 2026-03-21T23:45:00Z
updated_at: 2026-03-21T23:45:00Z
parent: RSK-9c07
---

## Context

Hosting is **Netlify** (static CDN for `apps/web`). Repo config is in [`netlify.toml`](../../netlify.toml); CLI is in **`nix develop`** (`netlify-cli` from nixpkgs). **Agents cannot** log into Netlify or trigger authenticated deploys — the owner completes this bean.

## Goal

- **Git-based deploy (recommended):** In the [Netlify UI](https://app.netlify.com/), import **`riskbreaker`** from GitHub, **no base directory**, let `netlify.toml` drive build/publish. Confirm the **first successful deploy** after push to `main`.
- **Optional:** `nix develop` → `netlify login` → `netlify init` / `netlify deploy --prod` for manual/CLI workflows.
- **Optional:** Note the live site URL in README or team notes (not a secret).

## Acceptance Criteria

- [ ] Netlify site linked to the GitHub repo; build completes using root `pnpm` + `apps/web/dist`
- [ ] Deployed app loads the mock session flow in the browser (smoke)
- [ ] This task marked **completed** when verified

## Links

- [`netlify.toml`](../../netlify.toml), [README — Netlify](../../README.md)
- Parent: `RSK-9c07`
