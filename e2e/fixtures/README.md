# PS1 disc fixtures (Playwright)

## `240pTestSuitePS1-EMU.bin` (default)

- **What:** Single-track disc image from the **240p Test Suite** PlayStation build (EMU package).
- **Upstream:** [filipalac/240pTestSuite-PS1](https://github.com/filipalac/240pTestSuite-PS1), release **19122020**, asset `240pTestSuitePS1-EMU.zip`.
- **License:** **GPL-2.0** — see [LICENSE.txt](https://github.com/filipalac/240pTestSuite-PS1/blob/master/LICENSE.txt) in that repository. We redistribute only this binary for automated e2e; source is available from the same project.

This file is **safe to commit**: it is homebrew test software, not a commercial game.

## Using your own `.bin` (e.g. Vagrant Story)

To run the same integration test against another single-track image you **own or have the right to use**, set:

```bash
export E2E_PS1_DISC_BIN="/absolute/path/to/your/game.bin"
pnpm e2e
```

Do **not** commit copyrighted rips unless you have explicit rights to redistribute them in this repo.
