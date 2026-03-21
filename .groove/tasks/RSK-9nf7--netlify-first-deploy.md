---
# RSK-9nf7
title: Netlify — connect repo, first production deploy
status: completed
type: task
priority: normal
created_at: 2026-03-21T23:45:00Z
updated_at: 2026-03-22T10:00:00Z
parent: RSK-9c07
---

## Context

Hosting is **Netlify** (static CDN for `apps/web`). Repo config is in [`netlify.toml`](../../netlify.toml) (**Node 24.x**, monorepo build from root); CLI is in **`nix develop`** (`netlify-cli` from nixpkgs).

## Goal

- **Git-based deploy:** Import **`riskbreaker`** from GitHub, **no base directory** (or **`@riskbreaker/web`** in the wizard), build/publish from [`netlify.toml`](../../netlify.toml).
- **Optional:** `nix develop` → `netlify login` → `netlify link` / `netlify deploy`.

## Acceptance Criteria

- [x] Netlify site linked to the GitHub repo; build completes using root `pnpm` + `apps/web/dist`
- [x] Deployed app loads the mock session flow in the browser (smoke)
- [x] Task marked **completed** when verified

## Links

- [`netlify.toml`](../../netlify.toml), [README — Netlify](../../README.md)
- Parent: `RSK-9c07`
