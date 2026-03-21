# @riskbreaker/asset-pipeline

Turns future disc dumps into **`GameManifest`**. Phase 1 only ships **`GameManifestBuilder`** plus mocks:

- **`MockAssetImporter`** — always returns a configured manifest.
- **`MockGameDetector`** — returns `null` (extend when `bins/` wiring lands).
