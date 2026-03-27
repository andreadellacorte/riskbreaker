# Playwright E2E

Tests live under `e2e/*.spec.ts` and use two **Playwright projects** (see `playwright.config.ts`):

| Project                     | Specs                         | Expectation in CI                                              |
| --------------------------- | ----------------------------- | -------------------------------------------------------------- |
| **`mock-core`**             | `app.spec.ts` only            | **Always runs** — mock vertical slice, no ROM or `.env`        |
| **`conditional-integration`** | All other `e2e/*.spec.ts` | **May skip** — `test.skip` when disc, preload `.env`, or VS fixtures are missing |

Running **`pnpm e2e`** executes **both** projects in one invocation (same as before these projects existed).

## CI vs local

- **CI** (`.github/workflows/ci.yml`) runs `mock-core`, then `node scripts/fetch-e2e-240p-fixture.mjs` (GPL 240p homebrew bin), then `conditional-integration`. That gives a real disc for `psx-ram-api.spec.ts` without committing the binary.
- **Locally**, integration specs skip with a short reason when prerequisites are absent; check the **list** reporter output for skipped tests and messages.

## Useful commands

```bash
pnpm e2e:mock-core       # only /mock inventory smoke
pnpm e2e:integration    # ROM/preload/RAM API (skips as needed)
pnpm e2e                # full suite
```

Vite dev server startup is shared via Playwright `webServer` (unless `PLAYWRIGHT_SKIP_WEBSERVER` is set).
