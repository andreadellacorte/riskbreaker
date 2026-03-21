# Docker

Build from the **repository root** (context includes the whole monorepo).

## Targets

| Target              | Image role                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------- |
| **`web`** (default) | Static **`apps/web`** build served by **nginx** (SPA `try_files`).                           |
| **`ci`**            | Full **Nix** dev shell + repo — same path as GitHub Actions’ Docker job (`pnpm` test/build). |

```bash
# Production-ish static assets (default last stage = web)
docker build -f infra/docker/Dockerfile -t riskbreaker:web .

# CI parity image (used in .github/workflows/ci.yml)
docker build -f infra/docker/Dockerfile --target ci -t riskbreaker:ci .
```

Run the static image:

```bash
docker run --rm -p 8080:80 riskbreaker:web
# Open http://localhost:8080
```

We standardize on the **official Nix Docker image** published as **[`docker.io/nixos/nix`](https://hub.docker.com/r/nixos/nix)** (NixOS organization on Docker Hub). Pin the tag via build-arg **`NIX_IMAGE`**; values should stay **`nixos/nix:<tag>`** for consistency.

The **`ci`** stage runs **`nix develop`** so Node, pnpm, and other dev-shell packages match `flake.nix`, then `pnpm install`, `pnpm build`, and `pnpm test`.

**Note:** The first `docker build` downloads the dev-shell closure (Nix store paths); expect a large layer. `sandbox = false` is set in the image because Nix’s sandbox is often incompatible with Docker’s default security profile.

**Override Nix image tag:**

```bash
docker build -f infra/docker/Dockerfile --build-arg NIX_IMAGE=docker.io/nixos/nix:2.29.2 -t riskbreaker:web .
```
