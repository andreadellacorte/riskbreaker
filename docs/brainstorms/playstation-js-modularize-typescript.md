# Brainstorm: Prepare PlayStation.js for modification (split, TypeScript, build, telemetry)

## What We're Building

A **maintainable source layout** for the vendored browser PS1 bundle: break the monolithic `PlayStation.js` into **logical modules**, author them in **TypeScript** where it helps, **compile/bundle back to one** (or few) artifacts for static hosting under `apps/web/public/playstation/`, and add **opt-in debug telemetry** to spot hot paths and frame/worker timing for future optimisation.

**Explicitly out of scope for this brainstorm’s “done”:** recompiling the WASM core from C++, changing PCSX accuracy, or shipping a second emulator. **YAGNI:** no full profiler UI; hooks and structured logs first.

## Why This Approach

- The file is already **formatted and documented** as a fork ([`playstation-engine-hacking.md`](../playstation-engine-hacking.md)); the next step is **engineering ergonomics** so changes (resolution, UI, bridges to `IRuntime`) do not fight a 8k-line single file.
- **TypeScript** catches mistakes at glue boundaries (worker messages, `Module` shape, Riskbreaker bootstrap) without typing the entire Emscripten output on day one.
- **One output bundle** preserves today’s deployment story (plain `script` tags / static server) and keeps E2E stable until we intentionally change load semantics.
- **Telemetry** answers “where to optimise” before rewriting WASM: main thread vs worker vs WASM, frame pacing, load phases.

## Key Decisions

- **License posture (documentation, not legal advice):** Treat **wasmpsx** lineage as **MIT** (see [`LICENSE.playstation.txt`](../../apps/web/public/playstation/LICENSE.playstation.txt)); **lrusso/PlayStation** has **no repo LICENSE** — keep the bundle **dev/spike** unless redistribution terms are clarified; preserve upstream notices and extend the notice file when we add substantial TS/build layers.
- **Source tree:** Add something like `apps/web/playstation-src/` (or `packages/playstation-bundle/`) for `.ts` inputs; **generated output** remains under `public/playstation/` (or `dist/` copied in build) so Vite does not accidentally bundle WASM into the main app chunk.
- **Build tool:** Prefer **esbuild** (already common for small TS bundles) or **Vite library mode** in a **separate** package — decision in **plan**, not here; criterion is single command → `PlayStation.js` (+ optional `.map` for dev).
- **WASM packaging:** Keep **base64 `data:`** in v1 of the modular build to minimise moving parts; optional follow-up: **external `.wasm` file** + `locateFile` (smaller JS, better caching).
- **Telemetry:** **Dev-only** by default (`import.meta.env.DEV`, `?debug=1`, or `localStorage`) so production builds stay quiet; structured `console` or **Performance API** marks; no third-party analytics.

## Open Questions

- Should **Riskbreaker bootstrap** (shadow DOM, `#rb-playstation-host`) be the **first** extracted module with full TS types, leaving Emscripten output as **one** large `.js` chunk imported as **side-effect** or string? (Affects how aggressively we TS the glue.)
- Do we need **source maps** shipped to `public/` for debugging minified output, or only local `dist/` with map excluded from git?
- **Worker:** Is the worker inline blob, separate file, or unchanged until a second phase? (Touches CSP and `new Worker` URLs.)
- **CI:** Should `pnpm build` for `apps/web` **depend** on rebuilding the PlayStation bundle, or keep it **manual** until the pipeline is stable?

## Next Steps

- [x] **`/groove-work-plan`** — [`docs/plans/rsk-v50c-playstation-bundle.md`](../plans/rsk-v50c-playstation-bundle.md) (stage **`RSK-483p`**). **Keep `pnpm e2e` green** after each step.
- **Groove epic `RSK-v50c`** — _PlayStation bundle: modular TS, telemetry, **backtick shadcn overlay**_ (children: **`RSK-fye3`**, **`RSK-7lri`**, **`RSK-74eh`**, **`RSK-xfc8`** (epic: **`RSK-n8wk`**, **`RSK-p4jm`**), **`RSK-wquv`**). The brainstorm bean `RSK-opo3` was removed in favour of this epic.
